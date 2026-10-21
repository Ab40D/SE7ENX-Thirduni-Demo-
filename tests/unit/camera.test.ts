/**
 * Camera lifecycle regression tests.
 *
 * Every test drives `CameraManager` with a mocked media stream and a fake
 * video element, so each failure branch (denied, unavailable, rejected
 * playback, missing frames, stale stream, unexpected track end) is
 * reachable without a camera.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  CameraManager,
  type CameraDiagnostics,
  type CameraFailure,
  type CameraPhase,
  type VideoSurface,
} from '../../src/core/camera';

interface FakeTrack {
  kind: string;
  label: string;
  readyState: string;
  enabled: boolean;
  muted: boolean;
  stop: () => void;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  emit: (type: string) => void;
}

function createTrack(kind = 'video'): FakeTrack {
  const listeners = new Map<string, Set<() => void>>();
  return {
    kind,
    label: 'Fake Camera',
    readyState: 'live',
    enabled: true,
    muted: false,
    stop: vi.fn(),
    addEventListener: (type, listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
    emit: (type) => {
      listeners.get(type)?.forEach((listener) => listener());
    },
  };
}

function createStream(tracks: FakeTrack[] = [createTrack()]) {
  return {
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter((track) => track.kind === 'video'),
  } as unknown as MediaStream;
}

interface FakeVideo extends VideoSurface {
  srcObject: unknown;
  muted: boolean;
  autoplay: boolean;
  playsInline: boolean;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  play: () => Promise<void>;
  pause: () => void;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  emit: (type: string) => void;
  listeners: Set<string>;
}

function createVideo(overrides: Partial<VideoSurface> = {}): FakeVideo {
  const listeners = new Map<string, Set<() => void>>();
  const video: FakeVideo = {
    srcObject: null,
    muted: false,
    autoplay: false,
    playsInline: false,
    readyState: 0,
    videoWidth: 0,
    videoHeight: 0,
    play: () => Promise.resolve(),
    pause: vi.fn(),
    addEventListener: (type, listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
    emit: (type) => {
      listeners.get(type)?.forEach((listener) => listener());
    },
    listeners: new Set(listeners.keys()),
    ...overrides,
  } as FakeVideo;
  return video;
}

interface Harness {
  manager: CameraManager;
  phases: { phase: CameraPhase; failure?: CameraFailure }[];
  diagnostics: CameraDiagnostics[];
  logs: string[];
}

function createHarness(
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>,
  framesTimeoutMs = 200,
): Harness {
  const phases: { phase: CameraPhase; failure?: CameraFailure }[] = [];
  const diagnostics: CameraDiagnostics[] = [];
  const logs: string[] = [];
  const manager = new CameraManager({
    getUserMedia,
    framesTimeoutMs,
    onPhase: (phase, failure) => {
      phases.push({ phase, failure });
    },
    onDiagnostics: (snapshot) => {
      diagnostics.push(snapshot);
    },
    log: (message) => {
      logs.push(message);
    },
  });
  return { manager, phases, diagnostics, logs };
}

const lastPhase = (harness: Harness) => harness.phases[harness.phases.length - 1];

describe('CameraManager', () => {
  it('attaches the stream and reports live once real frames arrive', async () => {
    const track = createTrack();
    const stream = createStream([track]);
    const harness = createHarness(async () => stream);
    const video = createVideo();

    const start = harness.manager.start(video);
    // The element is "ready" as soon as the metadata is known.
    await Promise.resolve();
    video.readyState = 4;
    video.videoWidth = 640;
    video.videoHeight = 480;
    video.emit('loadedmetadata');

    const phase = await start;

    expect(phase).toBe('live');
    expect(lastPhase(harness)).toEqual({ phase: 'live', failure: undefined });
    expect(video.srcObject).toBe(stream);
    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(track.stop).not.toHaveBeenCalled();
  });

  it('never reports live while the preview stays unready', async () => {
    const track = createTrack();
    const harness = createHarness(async () => createStream([track]), 60);
    const video = createVideo();

    const phase = await harness.manager.start(video);

    expect(phase).toBe('error');
    expect(lastPhase(harness)).toEqual({ phase: 'error', failure: 'no-frames' });
    // The stream must be released, never left running in the background.
    expect(track.stop).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
    expect(harness.phases.some((entry) => entry.phase === 'live')).toBe(false);
  });

  it('reports a rejected video.play() and releases the camera', async () => {
    const track = createTrack();
    const harness = createHarness(async () => createStream([track]));
    const video = createVideo({ play: () => Promise.reject(new Error('NotAllowedError')) });

    const phase = await harness.manager.start(video);

    expect(phase).toBe('error');
    expect(lastPhase(harness)).toEqual({ phase: 'error', failure: 'play-rejected' });
    expect(track.stop).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
  });

  it('reports a denied permission', async () => {
    const harness = createHarness(async () => {
      throw Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    });

    const phase = await harness.manager.start(createVideo());

    expect(phase).toBe('denied');
    expect(lastPhase(harness)).toEqual({ phase: 'denied', failure: 'permission-denied' });
  });

  it('reports a missing camera as unavailable', async () => {
    const harness = createHarness(async () => {
      throw Object.assign(new Error('none'), { name: 'NotFoundError' });
    });

    const phase = await harness.manager.start(createVideo());

    expect(phase).toBe('unavailable');
    expect(lastPhase(harness)).toEqual({ phase: 'unavailable', failure: 'not-found' });
  });

  it('reports a camera that is busy in another application as unavailable', async () => {
    const harness = createHarness(async () => {
      throw Object.assign(new Error('busy'), { name: 'NotReadableError' });
    });

    const phase = await harness.manager.start(createVideo());

    expect(phase).toBe('unavailable');
    expect(lastPhase(harness)).toEqual({ phase: 'unavailable', failure: 'in-use' });
  });

  it('detects a camera track that ends unexpectedly', async () => {
    const track = createTrack();
    const harness = createHarness(async () => createStream([track]));
    const video = createVideo();

    const start = harness.manager.start(video);
    await Promise.resolve();
    video.readyState = 4;
    video.videoWidth = 640;
    video.videoHeight = 480;
    video.emit('canplay');
    await start;

    track.emit('ended');

    expect(lastPhase(harness)).toEqual({ phase: 'error', failure: 'stream-ended' });
    expect(video.srcObject).toBeNull();
  });

  it('releases a stale stream when the session is cancelled during the permission prompt', async () => {
    const track = createTrack();
    let resolveStream: (stream: MediaStream) => void = () => undefined;
    const harness = createHarness(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveStream = resolve;
        }),
    );
    const video = createVideo();

    const start = harness.manager.start(video);
    harness.manager.stop();
    resolveStream(createStream([track]));
    const phase = await start;

    expect(phase).toBe('idle');
    expect(track.stop).toHaveBeenCalled();
    expect(harness.phases.some((entry) => entry.phase === 'live')).toBe(false);
  });

  it('never opens a second stream while a session is running', async () => {
    const getUserMedia = vi.fn(async () => createStream([createTrack()]));
    const harness = createHarness(getUserMedia);
    const video = createVideo();

    const start = harness.manager.start(video);
    await Promise.resolve();
    video.readyState = 4;
    video.videoWidth = 640;
    video.videoHeight = 480;
    video.emit('canplay');
    await start;

    const second = await harness.manager.start(video);

    expect(second).toBe('live');
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('cleans up every track, the element and the phase on stop', async () => {
    const track = createTrack();
    const harness = createHarness(async () => createStream([track]));
    const video = createVideo();

    const start = harness.manager.start(video);
    await Promise.resolve();
    video.readyState = 4;
    video.videoWidth = 640;
    video.videoHeight = 480;
    video.emit('canplay');
    await start;

    harness.manager.stop();

    expect(track.stop).toHaveBeenCalled();
    expect(video.pause).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
    expect(lastPhase(harness)).toEqual({ phase: 'idle', failure: undefined });
  });

  it('publishes diagnostics with the element state and the track states', async () => {
    const track = createTrack();
    const harness = createHarness(async () => createStream([track]));
    const video = createVideo();

    const start = harness.manager.start(video);
    await Promise.resolve();
    video.readyState = 4;
    video.videoWidth = 1280;
    video.videoHeight = 720;
    video.emit('canplay');
    await start;

    const live = harness.diagnostics[harness.diagnostics.length - 1];
    expect(live.phase).toBe('live');
    expect(live.readyState).toBe(4);
    expect(live.videoWidth).toBe(1280);
    expect(live.videoHeight).toBe(720);
    expect(live.tracks[0]).toMatchObject({ kind: 'video', readyState: 'live', enabled: true });
  });
});
