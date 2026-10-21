/**
 * Camera session manager — framework agnostic, dependency injected.
 *
 * The module never touches `navigator.mediaDevices` itself: the caller
 * injects `getUserMedia`. That keeps every branch (denied, unavailable,
 * rejected playback, missing frames, stale stream, unexpected track end)
 * reachable from a unit test with a mocked media stream.
 *
 * The manager owns exactly one job: take a video surface from "no stream"
 * to "frames are actually arriving". Hand tracking (MediaPipe) is a separate
 * concern and must never be a precondition for the preview.
 */

export type CameraPhase =
  /** Nothing requested yet. */
  | 'idle'
  /** The permission prompt is open. */
  | 'requesting'
  /** Permission granted, the stream is attached, waiting for frames. */
  | 'starting'
  /** Frames are arriving (readyState >= 2 and a non-zero picture size). */
  | 'live'
  /** The user refused the camera. */
  | 'denied'
  /** No camera, or the camera is busy in another application. */
  | 'unavailable'
  /** Any other failure — the stream has been released. */
  | 'error';

export type CameraFailure =
  | 'permission-denied'
  | 'not-found'
  | 'in-use'
  | 'play-rejected'
  | 'no-frames'
  | 'no-video-element'
  | 'stream-ended'
  | 'unknown';

/** The subset of `HTMLVideoElement` the manager relies on. */
export interface VideoSurface {
  srcObject: unknown;
  muted: boolean;
  autoplay: boolean;
  playsInline: boolean;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface CameraTrackInfo {
  kind: string;
  label: string;
  readyState: string;
  enabled: boolean;
  muted: boolean;
}

export interface CameraDiagnostics {
  phase: CameraPhase;
  failure?: CameraFailure;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  tracks: CameraTrackInfo[];
  message?: string;
}

export interface CameraManagerOptions {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  onPhase: (phase: CameraPhase, failure?: CameraFailure, message?: string) => void;
  onDiagnostics?: (diagnostics: CameraDiagnostics) => void;
  /** Console logger. Never receives frame data. */
  log?: (message: string, details?: Record<string, unknown>) => void;
  constraints?: MediaStreamConstraints;
  /** How long to wait for real frames before giving up. */
  framesTimeoutMs?: number;
}

export const DEFAULT_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user',
  },
  audio: false,
};

const READY_EVENTS = [
  'loadedmetadata',
  'loadeddata',
  'canplay',
  'canplaythrough',
  'playing',
  'resize',
];

const DEFAULT_FRAMES_TIMEOUT_MS = 8000;

function errorName(error: unknown): string {
  if (error && typeof error === 'object' && 'name' in error) {
    return String((error as { name?: unknown }).name ?? 'Error');
  }
  return 'Error';
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return errorName(error);
}

function classifyFailure(error: unknown): CameraFailure {
  const name = errorName(error);
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'permission-denied';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return 'not-found';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
    return 'in-use';
  }
  return 'unknown';
}

function stopTracks(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => track.stop());
  } catch {
    /* the stream may already be gone */
  }
}

export class CameraManager {
  private options: CameraManagerOptions;
  private stream: MediaStream | null = null;
  private video: VideoSurface | null = null;
  /** Incremented on every start/stop so stale async work can bail out. */
  private token = 0;
  private phase: CameraPhase = 'idle';
  private framesTimeoutMs: number;

  constructor(options: CameraManagerOptions) {
    this.options = options;
    this.framesTimeoutMs = options.framesTimeoutMs ?? DEFAULT_FRAMES_TIMEOUT_MS;
  }

  get isLive(): boolean {
    return this.stream !== null;
  }

  get currentStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Opens the camera and attaches it to `video`.
   * Resolves with the phase the session ended in.
   */
  async start(video: VideoSurface | null): Promise<CameraPhase> {
    // Never open a second stream while one is already running.
    if (this.phase === 'live' || this.phase === 'starting' || this.phase === 'requesting') {
      this.log('start ignored, session already active', { phase: this.phase });
      return this.phase;
    }
    const token = ++this.token;
    this.video = video;
    this.report('requesting');

    let stream: MediaStream;
    try {
      stream = await this.options.getUserMedia(
        this.options.constraints ?? DEFAULT_CAMERA_CONSTRAINTS,
      );
    } catch (error) {
      if (token !== this.token) return 'idle';
      const failure = classifyFailure(error);
      const phase: CameraPhase =
        failure === 'permission-denied'
          ? 'denied'
          : failure === 'not-found' || failure === 'in-use'
            ? 'unavailable'
            : 'error';
      this.report(phase, failure, errorMessage(error));
      return phase;
    }

    // The session was cancelled while the permission prompt was open.
    if (token !== this.token) {
      stopTracks(stream);
      this.log('stale stream released', { token });
      return 'idle';
    }

    this.stream = stream;
    this.watchForTrackEnd(stream, token);
    this.report('starting');

    if (!video) {
      this.fail(token, 'no-video-element', 'The video element is not mounted.');
      return 'error';
    }

    try {
      video.srcObject = stream;
    } catch (error) {
      this.fail(token, 'unknown', errorMessage(error));
      return 'error';
    }
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    try {
      await video.play();
    } catch (error) {
      if (token !== this.token) return 'idle';
      this.fail(token, 'play-rejected', errorMessage(error));
      return 'error';
    }

    if (token !== this.token) return 'idle';

    const hasFrames = await this.waitForFrames(video, token);
    if (token !== this.token) return 'idle';
    if (!hasFrames) {
      this.fail(token, 'no-frames', 'The camera stream produced no video frames.');
      return 'error';
    }

    this.report('live');
    return 'live';
  }

  /** Releases the camera and cancels any pending start. */
  stop(): void {
    this.token += 1;
    this.releaseStream();
    this.video = null;
    this.report('idle');
  }

  /** Releases the camera without touching the reported phase. */
  private releaseStream(): void {
    const stream = this.stream;
    this.stream = null;
    stopTracks(stream);
    const video = this.video;
    if (video) {
      try {
        video.pause();
      } catch {
        /* ignore */
      }
      try {
        video.srcObject = null;
      } catch {
        /* ignore */
      }
    }
  }

  private fail(token: number, failure: CameraFailure, message: string): void {
    if (token !== this.token) return;
    this.releaseStream();
    this.report('error', failure, message);
  }

  private watchForTrackEnd(stream: MediaStream, token: number): void {
    const tracks = typeof stream.getVideoTracks === 'function' ? stream.getVideoTracks() : [];
    tracks.forEach((track) => {
      const onEnded = () => {
        if (token !== this.token) return;
        this.releaseStream();
        this.report('error', 'stream-ended', 'The camera track ended unexpectedly.');
      };
      if (typeof track.addEventListener === 'function') {
        track.addEventListener('ended', onEnded);
      }
    });
  }

  /**
   * Resolves `true` once the element really is playing a picture.
   * Events are used first, a short poll is the fallback for browsers that
   * do not fire them, and a timeout guarantees the promise settles.
   */
  private waitForFrames(video: VideoSurface, token: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let settled = false;
      let interval: ReturnType<typeof setInterval> | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        READY_EVENTS.forEach((event) => {
          try {
            video.removeEventListener(event, check);
          } catch {
            /* ignore */
          }
        });
        if (interval !== null) {
          clearInterval(interval);
          interval = null;
        }
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      };

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      const currentToken = token;

      function check(): void {
        if (settled) return;
        if (token !== currentToken) {
          finish(false);
          return;
        }
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          finish(true);
        }
      }

      READY_EVENTS.forEach((event) => {
        try {
          video.addEventListener(event, check);
        } catch {
          /* ignore */
        }
      });

      interval = setInterval(check, 100);
      if (typeof (interval as { unref?: () => void }).unref === 'function') {
        (interval as { unref: () => void }).unref();
      }
      timer = setTimeout(() => {
        this.log('no video frames before timeout', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        });
        finish(false);
      }, this.framesTimeoutMs);
      if (typeof (timer as { unref?: () => void }).unref === 'function') {
        (timer as { unref: () => void }).unref();
      }

      check();
    });
  }

  private report(phase: CameraPhase, failure?: CameraFailure, message?: string): void {
    this.phase = phase;
    const video = this.video;
    const tracks = this.stream
      ? this.stream.getTracks().map((track) => ({
          kind: track.kind,
          label: track.label,
          readyState: track.readyState,
          enabled: track.enabled,
          muted: track.muted,
        }))
      : [];

    this.options.onPhase(phase, failure, message);
    this.options.onDiagnostics?.({
      phase,
      failure,
      readyState: video ? video.readyState : 0,
      videoWidth: video ? video.videoWidth : 0,
      videoHeight: video ? video.videoHeight : 0,
      tracks,
      message,
    });
    this.log('phase', {
      phase,
      failure: failure ?? null,
      readyState: video ? video.readyState : 0,
      videoWidth: video ? video.videoWidth : 0,
      videoHeight: video ? video.videoHeight : 0,
      tracks: tracks.map((track) => `${track.kind}:${track.readyState}`).join(','),
    });
  }

  private log(message: string, details?: Record<string, unknown>): void {
    this.options.log?.(message, details);
  }
}
