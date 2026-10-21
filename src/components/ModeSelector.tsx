import { useAppStore, type InteractionMode } from '../store/app';
import { useT } from '../hooks/useT';
import { VoiceControl } from './VoiceControl';
import { GestureControl } from './GestureControl';

const MODES: { id: InteractionMode; labelKey: 'mode.manual' | 'mode.voice' | 'mode.gesture' }[] = [
  { id: 'manual', labelKey: 'mode.manual' },
  { id: 'voice', labelKey: 'mode.voice' },
  { id: 'gesture', labelKey: 'mode.gesture' },
];

export function ModeSelector() {
  const t = useT();
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);

  return (
    <section className="panel" aria-labelledby="mode-title">
      <div className="panel-head">
        <h2 className="panel-title" id="mode-title">
          {t('panel.mode')}
        </h2>
        <span className="device-state">{t(`mode.${mode}` as never)}</span>
      </div>
      <div className="panel-body">
        <div className="segmented" role="group" aria-label={t('panel.mode')}>
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              data-testid={`mode-${item.id}`}
              data-tour={`mode-${item.id}`}
              onClick={() => setMode(item.id)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        {mode === 'manual' && <p className="panel-note">{t('mode.manual.hint')}</p>}
        {mode === 'voice' && (
          <>
            <VoiceControl />
            <p className="panel-note">{t('mode.voice.hint')}</p>
          </>
        )}
        {mode === 'gesture' && (
          <>
            <GestureControl />
            <p className="panel-note">{t('mode.gesture.hint')}</p>
          </>
        )}
      </div>
    </section>
  );
}
