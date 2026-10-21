// @vitest-environment jsdom
/**
 * React level regression tests for the camera pipeline.
 *
 * These cover the failure that produced the black preview: the video
 * element has to exist *before* the camera starts, the stream has to be
 * attached to it, and neither an unmount nor a broken hand-tracking model
 * may take the preview down with it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useHandGestures, type GestureName } from '../../src/hooks/useHandGestures';

const tasksVision = vi.hoisted(() => ({
  createFromOptions: vi.fn(),
  forVisionTasks: vi.fn(),
}));

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: tasksVision.forVisionTasks },
  HandLandmarker: { createFromOptions: tasksVision.createFromOptions },
}));

interface FakeTrack {
  kind: string;
  label: string;
  readyState: string;
  enabled: boolean;
  muted: boolean;
  stop: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function createTrack(): FakeTrack {
  return {
    kind: 'video',
    label: 'Fake Camera',
    readyState: 'live',
    enabled: true,
    muted: false,
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

function createStream(tracks: FakeTrack[]) {
  return {
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter((track) => track.kind === 'video'),
  } as unknown as MediaStream;
}

let mediaState = { readyState: 0, videoWidth: 0, videoHeight: 0 };
let playImplementation: () => Promise<void> = () => Promise.resolve();
let getUserMedia: ReturnType<typeof vi.fn>;

function Harness({ onGesture }: { onGesture: (gesture: GestureName) => void }) {
  const gestures = useHandGestures(onGesture);
  return React.createElement(
    'div',
    null,
    React.createElement('span', { 'data-testid': 'phase' }, gestures.cameraPhase),
    React.createElement('span', { 'data-testid': 'tracker' }, gestures.trackerPhase),
    React.createElement('span', { 'data-testid': 'failure' }, gestures.failure ?? ''),
    React.createElement('video', { ref: gestures.videoRef, 'data-testid': 'video' }),
    React.createElement('canvas', { ref: gestures.overlayRef }),
    React.createElement(
      'button',
      { 'data-testid': 'start', onClick: () => void gestures.start() },
      'start',
    ),
    React.createElement(
      'button',
      { 'data-testid': 'stop', onClick: () => gestures.stop() },
      'stop',
    ),
  );
}

function setFramesReady(): void {
  mediaState = { readyState: 4, videoWidth: 640, videoHeight: 480 };
}

function dispatchCanPlay(): void {
  const video = screen.getByTestId('video') as HTMLVideoElement;
  act(() => {
    video.dispatchEvent(new Event('canplay'));
  });
}

beforeEach(() => {
  mediaState = { readyState: 0, videoWidth: 0, videoHeight: 0 };
  playImplementation = () => Promise.resolve();
  getUserMedia = vi.fn();

  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'readyState', {
    get: () => mediaState.readyState,
    configurable: true,
  });
  // jsdom exposes `videoWidth` / `videoHeight` on HTMLVideoElement.
  Object.defineProperty(window.HTMLVideoElement.prototype, 'videoWidth', {
    get: () => mediaState.videoWidth,
    configurable: true,
  });
  Object.defineProperty(window.HTMLVideoElement.prototype, 'videoHeight', {
    get: () => mediaState.videoHeight,
    configurable: true,
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    value: () => playImplementation(),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    value: () => undefined,
    configurable: true,
    writable: true,
  });

  tasksVision.forVisionTasks.mockResolvedValue({});
  tasksVision.createFromOptions.mockResolvedValue({
    detectForVideo: () => ({ landmarks: [] }),
    close: vi.fn(),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useHandGestures camera pipeline', () => {
  it('has a mounted video element before the camera is started', async () => {
    getUserMedia.mockResolvedValue(createStream([createTrack()]));
    render(React.createElement(Harness, { onGesture: () => undefined }));

    const video = screen.getByTestId('video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.srcObject ?? null).toBeNull();

    act(() => {
      screen.getByTestId('start').click();
    });

    await waitFor(() => {
      expect(video.srcObject).not.toBeNull();
    });
  });

  it('reports live only after real frames are available', async () => {
    getUserMedia.mockResolvedValue(createStream([createTrack()]));
    render(React.createElement(Harness, { onGesture: () => undefined }));

    act(() => {
      screen.getByTestId('start').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('phase').textContent).toBe('starting');
    });
    // Permission alone is never enough.
    expect(screen.getByTestId('phase').textContent).not.toBe('live');

    act(() => {
      setFramesReady();
      dispatchCanPlay();
    });

    await waitFor(() => {
      expect(screen.getByTestId('phase').textContent).toBe('live');
    });
  });

  it('keeps the camera preview working when the hand-tracking model fails to load', async () => {
    tasksVision.createFromOptions.mockRejectedValue(new Error('model missing'));
    getUserMedia.mockResolvedValue(createStream([createTrack()]));
    render(React.createElement(Harness, { onGesture: () => undefined }));

    act(() => {
      screen.getByTestId('start').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('phase').textContent).toBe('starting');
    });
    act(() => {
      setFramesReady();
      dispatchCanPlay();
    });

    await waitFor(() => {
      expect(screen.getByTestId('phase').textContent).toBe('live');
    });
    await waitFor(() => {
      expect(screen.getByTestId('tracker').textContent).toBe('failed');
    });
    // The camera is untouched by the tracker failure.
    expect((screen.getByTestId('video') as HTMLVideoElement).srcObject).not.toBeNull();
  });

  it('surfaces a denied permission without claiming a working camera', async () => {
    getUserMedia.mockRejectedValue(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
    );
    render(React.createElement(Harness, { onGesture: () => undefined }));

    act(() => {
      screen.getByTestId('start').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('phase').textContent).toBe('denied');
    });
    expect(screen.getByTestId('failure').textContent).toBe('permission-denied');
    expect((screen.getByTestId('video') as HTMLVideoElement).srcObject ?? null).toBeNull();
  });

  it('releases the camera when the component unmounts during the permission prompt', async () => {
    const track = createTrack();
    let resolveStream: (stream: MediaStream) => void = () => undefined;
    getUserMedia.mockImplementation(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveStream = resolve;
        }),
    );
    const view = render(React.createElement(Harness, { onGesture: () => undefined }));

    act(() => {
      screen.getByTestId('start').click();
    });
    view.unmount();

    await act(async () => {
      resolveStream(createStream([track]));
      await Promise.resolve();
    });

    expect(track.stop).toHaveBeenCalled();
  });

  it('never opens a second stream when start is pressed twice', async () => {
    getUserMedia.mockResolvedValue(createStream([createTrack()]));
    render(React.createElement(Harness, { onGesture: () => undefined }));

    act(() => {
      screen.getByTestId('start').click();
      screen.getByTestId('start').click();
    });
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
  });

  it('releases every track when the camera is stopped', async () => {
    const track = createTrack();
    getUserMedia.mockResolvedValue(createStream([track]));
    render(React.createElement(Harness, { onGesture: () => undefined }));

    act(() => {
      screen.getByTestId('start').click();
    });
    await waitFor(() => {
      expect((screen.getByTestId('video') as HTMLVideoElement).srcObject).not.toBeNull();
    });

    act(() => {
      screen.getByTestId('stop').click();
    });

    expect(track.stop).toHaveBeenCalled();
    expect((screen.getByTestId('video') as HTMLVideoElement).srcObject ?? null).toBeNull();
    expect(screen.getByTestId('phase').textContent).toBe('idle');
  });

  it('can be started again after a clean stop', async () => {
    getUserMedia.mockResolvedValue(createStream([createTrack()]));
    render(React.createElement(Harness, { onGesture: () => undefined }));

    act(() => {
      screen.getByTestId('start').click();
    });
    await waitFor(() => {
      expect((screen.getByTestId('video') as HTMLVideoElement).srcObject).not.toBeNull();
    });
    act(() => {
      screen.getByTestId('stop').click();
    });
    act(() => {
      screen.getByTestId('start').click();
    });

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect((screen.getByTestId('video') as HTMLVideoElement).srcObject).not.toBeNull();
    });
  });
});
