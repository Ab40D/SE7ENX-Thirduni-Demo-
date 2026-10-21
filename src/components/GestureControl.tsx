import { useHandGestures } from '../hooks/useHandGestures';
import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';
import type { CameraFailure } from '../core/camera';

export function GestureControl() {
  const t = useT();
  const dispatch = useAppStore((s) => s.dispatch);

  const gestures = useHandGestures((gesture) => {
    if (gesture === 'open_palm') {
      dispatch({ kind: 'light.on' }, 'gesture');
    } else if (gesture === 'fist') {
      dispatch({ kind: 'light.off' }, 'gesture');
    }
  });

  const cameraFailure = (failure: CameraFailure | null): string | null => {
    switch (failure) {
      case 'permission-denied':
        return t('gesture.status.denied');
      case 'not-found':
      case 'in-use':
        return t('gesture.status.unavailable');
      case 'no-frames':
        return t('gesture.status.noFrames');
      case 'play-rejected':
        return t('gesture.status.playFailed');
      case 'no-video-element':
        return t('gesture.status.error', { message: 'video element missing' });
      case 'stream-ended':
        return t('gesture.status.streamEnded');
      default:
        return null;
    }
  };

  const cameraStatus = (() => {
    switch (gestures.cameraPhase) {
      case 'idle':
        return t('gesture.status.idle');
      case 'requesting':
        return t('gesture.status.requesting');
      case 'starting':
        return t('gesture.status.starting');
      case 'live': {
        if (gestures.trackerPhase === 'failed') return t('gesture.status.live');
        return t('gesture.status.live');
      }
      case 'denied':
        return t('gesture.status.denied');
      case 'unavailable':
        return t('gesture.status.unavailable');
      default:
        return cameraFailure(gestures.failure) ?? t('gesture.status.error', { message: gestures.errorMessage ?? '' });
    }
  })();

  const trackerStatus = (() => {
    if (gestures.cameraPhase !== 'live') return null;
    if (gestures.trackerPhase === 'loading') return t('gesture.tracker.loading');
    if (gestures.trackerPhase === 'failed') return t('gesture.tracker.failed');
    if (gestures.trackerPhase === 'ready') return t('gesture.status.running');
    return null;
  })();

  const gestureLabel =
    gestures.gesture === 'open_palm'
      ? t('gesture.openPalm')
      : gestures.gesture === 'fist'
        ? t('gesture.fist')
        : t('gesture.noHands');

  const previewState = gestures.live ? 'live' : gestures.cameraPhase === 'idle' ? 'idle' : 'pending';

  const previewNote = (() => {
    if (gestures.live) return null;
    if (gestures.cameraPhase === 'idle') return t('gesture.preview.idle');
    if (gestures.cameraPhase === 'requesting') return t('gesture.preview.permission');
    if (gestures.cameraPhase === 'starting') return t('gesture.preview.starting');
    return cameraFailure(gestures.failure) ?? t('gesture.preview.error');
  })();

  return (
    <div className="field" data-testid="gesture-control">
      <p className="notice">{t('gesture.explain')}</p>

      <div className="btn-row">
        {gestures.live || gestures.cameraPhase === 'requesting' || gestures.cameraPhase === 'starting' ? (
          <button
            type="button"
            className="btn btn-primary"
            data-testid="gesture-stop"
            onClick={() => {
              gestures.stop();
            }}
          >
            {t('gesture.stop')}
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            data-testid="gesture-start"
            onClick={() => {
              void gestures.start();
            }}
          >
            {t('gesture.enable')}
          </button>
        )}
      </div>

      <div className="status-line">
        <span
          className={`status-dot ${
            gestures.live ? 'active' : ''
          } ${
            gestures.cameraPhase === 'denied' ||
            gestures.cameraPhase === 'unavailable' ||
            gestures.cameraPhase === 'error'
              ? 'error'
              : ''
          }`}
          aria-hidden="true"
        />
        <span data-testid="gesture-status">{cameraStatus}</span>
      </div>

      {trackerStatus && (
        <div className="status-line" data-testid="gesture-tracker-status">
          <span
            className={`status-dot ${
              gestures.trackerPhase === 'ready' ? 'active' : ''
            } ${gestures.trackerPhase === 'failed' ? 'error' : ''}`}
            aria-hidden="true"
          />
          <span>{trackerStatus}</span>
        </div>
      )}

      {/*
        The video element is always mounted: the camera session needs a real
        element to attach the stream to, and the preview must be able to show
        frames before the hand-tracking model has finished downloading.
      */}
      <div className="gesture-preview" data-state={previewState} data-testid="gesture-preview">
        <video
          ref={gestures.videoRef}
          className="video-preview"
          autoPlay
          muted
          playsInline
          data-testid="gesture-video"
          aria-label={t('gesture.preview.label')}
        />
        <canvas
          ref={gestures.overlayRef}
          className="gesture-overlay"
          data-testid="gesture-overlay"
          aria-hidden="true"
        />
        {previewNote && (
          <p className="gesture-preview-note" data-testid="gesture-preview-note">
            {previewNote}
          </p>
        )}
      </div>

      {gestures.live && (
        <div className="gesture-readout">
          <span data-testid="gesture-detected">{t('gesture.detected', { gesture: gestureLabel })}</span>
          <span>
            {gestures.gesture === 'open_palm'
              ? t('light.turnOn')
              : gestures.gesture === 'fist'
                ? t('light.turnOff')
                : '—'}
          </span>
        </div>
      )}
    </div>
  );
}
