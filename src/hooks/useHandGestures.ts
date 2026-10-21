import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CameraManager,
  type CameraDiagnostics,
  type CameraFailure,
  type CameraPhase,
} from '../core/camera';

export type GestureName = 'open_palm' | 'fist' | 'none';

/** State of the hand tracker, independent from the camera. */
export type TrackerPhase = 'idle' | 'loading' | 'ready' | 'failed';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureHook {
  /** Camera lifecycle: idle → requesting → starting → live. */
  cameraPhase: CameraPhase;
  /** MediaPipe lifecycle, runs only once frames are available. */
  trackerPhase: TrackerPhase;
  gesture: GestureName;
  /** The camera is live and real frames are arriving. */
  live: boolean;
  /** The camera is live *and* the tracker is running. */
  tracking: boolean;
  failure: CameraFailure | null;
  errorMessage: string | null;
  diagnostics: CameraDiagnostics | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  overlayRef: React.RefObject<HTMLCanvasElement>;
  start: () => Promise<void>;
  stop: () => void;
}

/** Local model first, CDN fallback. The model is only fetched on demand. */
const MODEL_LOCAL = '/models/hand_landmarker.task';
const MODEL_CDN =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const WASM_LOCAL = '/wasm';
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';

/** Minimum stable frames before a gesture may trigger an action. */
const STABLE_FRAMES = 4;
/** Minimum delay between two triggered actions. */
const COOLDOWN_MS = 1400;

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Classifies a 21-landmark hand as open palm, fist or none. */
export function classifyGesture(landmarks: { x: number; y: number; z: number }[]): GestureName {
  if (!landmarks || landmarks.length < 21) return 'none';
  const wrist = landmarks[0];
  const fingerTriples: [number, number][] = [
    [8, 6], // index
    [12, 10], // middle
    [16, 14], // ring
    [20, 18], // pinky
  ];
  let extended = 0;
  for (const [tip, pip] of fingerTriples) {
    const tipDist = distance(landmarks[tip], wrist);
    const pipDist = distance(landmarks[pip], wrist);
    if (tipDist > pipDist * 1.08) extended += 1;
  }
  // thumb: far from the index MCP when extended
  const thumbExtended = distance(landmarks[4], landmarks[17]) > distance(landmarks[3], landmarks[17]) * 1.25;
  if (extended >= 4 && thumbExtended) return 'open_palm';
  if (extended === 0) return 'fist';
  if (extended >= 4) return 'open_palm';
  return 'none';
}

function defaultGetUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(Object.assign(new Error('getUserMedia unavailable'), { name: 'NotSupportedError' }));
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}

export function useHandGestures(
  onGesture: (gesture: GestureName) => void,
): GestureHook {
  const [cameraPhase, setCameraPhase] = useState<CameraPhase>('idle');
  const [trackerPhase, setTrackerPhase] = useState<TrackerPhase>('idle');
  const [gesture, setGesture] = useState<GestureName>('none');
  const [failure, setFailure] = useState<CameraFailure | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<CameraDiagnostics | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const candidateRef = useRef<{ name: GestureName; count: number }>({ name: 'none', count: 0 });
  const lastFireRef = useRef(0);
  const armedRef = useRef(true);
  const onGestureRef = useRef(onGesture);
  onGestureRef.current = onGesture;
  /** Incremented on every start/stop so late async work can be discarded. */
  const sessionRef = useRef(0);
  const startingRef = useRef(false);

  const managerRef = useRef<CameraManager | null>(null);
  if (managerRef.current === null) {
    managerRef.current = new CameraManager({
      getUserMedia: defaultGetUserMedia,
      onPhase: (phase, phaseFailure, message) => {
        setCameraPhase(phase);
        setFailure(phaseFailure ?? null);
        setErrorMessage(message ?? null);
      },
      onDiagnostics: (snapshot) => {
        setDiagnostics(snapshot);
      },
      log: (message, details) => {
        // Diagnostics only: no frame data, no identifiers, nothing personal.
        // eslint-disable-next-line no-console
        console.info(`[se7enx] camera: ${message}`, details ?? {});
      },
    });
  }

  /**
   * Paints the hand landmarks on the overlay canvas. The canvas is stacked
   * exactly over the video element, so the normalised landmark coordinates
   * are mapped with the same `object-fit: cover` maths the video uses.
   */
  const drawLandmarks = useCallback((points: Landmark[] | null) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    const targetWidth = Math.max(1, Math.round(width * dpr));
    const targetHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!points || points.length === 0) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    // `cover` keeps the aspect ratio and crops the overflow.
    const scale = Math.max(width / vw, height / vh);
    const drawWidth = vw * scale;
    const drawHeight = vh * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    const toX = (p: Landmark) => offsetX + p.x * drawWidth;
    const toY = (p: Landmark) => offsetY + p.y * drawHeight;

    const BONES: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20],
      [0, 17],
    ];

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    BONES.forEach(([a, b]) => {
      if (!points[a] || !points[b]) return;
      ctx.moveTo(toX(points[a]), toY(points[a]));
      ctx.lineTo(toX(points[b]), toY(points[b]));
    });
    ctx.stroke();

    ctx.fillStyle = 'rgba(17,17,17,0.85)';
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(toX(point), toY(point), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, []);

  const releaseResources = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {
        /* ignore */
      }
      video.srcObject = null;
    }
    if (landmarkerRef.current?.close) {
      try {
        landmarkerRef.current.close();
      } catch {
        /* ignore */
      }
    }
    landmarkerRef.current = null;
    candidateRef.current = { name: 'none', count: 0 };
    armedRef.current = true;
    lastVideoTimeRef.current = -1;
    drawLandmarks(null);
  }, [drawLandmarks]);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    startingRef.current = false;
    managerRef.current?.stop();
    releaseResources();
    setCameraPhase('idle');
    setTrackerPhase('idle');
    setGesture('none');
    setFailure(null);
    setErrorMessage(null);
  }, [releaseResources]);

  /** Loads MediaPipe. Never touches the camera: a tracker failure must not
   *  break the live preview. */
  const initTracker = useCallback(async (session: number) => {
    setTrackerPhase('loading');
    try {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      if (session !== sessionRef.current) return;
      let fileset: any;
      try {
        fileset = await FilesetResolver.forVisionTasks(WASM_LOCAL);
      } catch {
        fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
      }
      if (session !== sessionRef.current) return;

      const create = async (modelAssetPath: string, delegate: 'GPU' | 'CPU') =>
        HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath, delegate },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

      let landmarker: any;
      try {
        landmarker = await create(MODEL_LOCAL, 'GPU');
      } catch {
        if (session !== sessionRef.current) return;
        try {
          landmarker = await create(MODEL_LOCAL, 'CPU');
        } catch {
          if (session !== sessionRef.current) return;
          landmarker = await create(MODEL_CDN, 'CPU');
        }
      }
      if (session !== sessionRef.current) {
        landmarker?.close?.();
        return;
      }
      landmarkerRef.current = landmarker;
      setTrackerPhase('ready');
    } catch (error) {
      if (session !== sessionRef.current) return;
      console.warn('[se7enx] hand tracker failed to load', error);
      setTrackerPhase('failed');
      setErrorMessage(error instanceof Error ? error.message : 'model-failed');
    }
  }, []);

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) {
      rafRef.current = null;
      return;
    }

    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      let result: any = null;
      try {
        result = landmarker.detectForVideo(video, performance.now());
      } catch {
        result = null;
      }
      const hands = result?.landmarks ?? [];
      const detected = hands.length ? classifyGesture(hands[0]) : 'none';
      setGesture(detected);
      drawLandmarks(hands.length ? (hands[0] as Landmark[]) : null);

      if (detected === 'none') {
        candidateRef.current = { name: 'none', count: 0 };
        armedRef.current = true;
      } else {
        if (candidateRef.current.name === detected) {
          candidateRef.current.count += 1;
        } else {
          candidateRef.current = { name: detected, count: 1 };
        }
        const now = performance.now();
        if (
          candidateRef.current.count >= STABLE_FRAMES &&
          armedRef.current &&
          now - lastFireRef.current >= COOLDOWN_MS
        ) {
          armedRef.current = false;
          lastFireRef.current = now;
          onGestureRef.current(detected);
        }
      }
    }
    rafRef.current = requestAnimationFrame(detectLoop);
  }, [drawLandmarks]);

  const start = useCallback(async () => {
    if (startingRef.current) return;
    if (cameraPhase === 'live' || cameraPhase === 'starting' || cameraPhase === 'requesting') {
      return;
    }
    startingRef.current = true;
    const session = ++sessionRef.current;
    setFailure(null);
    setErrorMessage(null);
    setTrackerPhase('idle');
    setGesture('none');

    const video = videoRef.current;
    if (!video) {
      startingRef.current = false;
      setCameraPhase('error');
      setFailure('no-video-element');
      setErrorMessage('The video element is not mounted.');
      return;
    }

    const manager = managerRef.current;
    if (!manager) {
      startingRef.current = false;
      return;
    }

    const phase = await manager.start(video);
    startingRef.current = false;
    if (session !== sessionRef.current) return;

    if (phase === 'live') {
      // The camera is live and the preview is already visible. The tracker
      // is loaded afterwards so a slow download never blocks the preview.
      void initTracker(session);
    }
  }, [cameraPhase, initTracker]);

  // The inference loop only runs while the tracker is ready.
  useEffect(() => {
    if (trackerPhase !== 'ready' || cameraPhase !== 'live') return;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [trackerPhase, cameraPhase, detectLoop]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      sessionRef.current += 1;
      startingRef.current = false;
      managerRef.current?.stop();
      releaseResources();
    };
  }, [releaseResources, stop]);

  return {
    cameraPhase,
    trackerPhase,
    gesture,
    live: cameraPhase === 'live',
    tracking: cameraPhase === 'live' && trackerPhase === 'ready',
    failure,
    errorMessage,
    diagnostics,
    videoRef,
    overlayRef,
    start,
    stop,
  };
}
