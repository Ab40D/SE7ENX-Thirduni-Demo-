import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';

interface GuideAudioBarProps {
  text: string;
}

/** Optional narration controls for the guide. Never autoplays. */
export function GuideAudioBar({ text }: GuideAudioBarProps) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const speech = useSpeechSynthesis();

  if (!speech.supported) {
    return <p className="device-hint">{t('voice.unsupported')}</p>;
  }

  return (
    <div className="btn-row compact" data-testid="guide-audio">
      <button
        type="button"
        className="btn"
        onClick={() => {
          if (speech.speaking && !speech.paused) {
            speech.toggle();
          } else {
            speech.speak(text, lang);
          }
        }}
      >
        {speech.speaking && !speech.paused ? t('voice.stop') : t('guide.listen')}
      </button>
      <button type="button" className="btn" onClick={speech.replay}>
        {t('guide.replay')}
      </button>
      <button
        type="button"
        className="btn"
        aria-pressed={speech.muted}
        onClick={speech.toggleMute}
      >
        {speech.muted ? t('guide.unmute') : t('guide.mute')}
      </button>
    </div>
  );
}
