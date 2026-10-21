import { useEffect, useRef, useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';
import { translate } from '../core/i18n';

export function VoiceControl() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const sendText = useAppStore((s) => s.sendText);
  const setMode = useAppStore((s) => s.setMode);
  const [lastHeard, setLastHeard] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);
  const supportedRef = useRef<boolean | null>(null);

  const speech = useSpeech(
    lang,
    (text, isFinal) => {
      setLastHeard(text);
      if (isFinal && text.trim()) {
        sendText(text.trim(), 'voice');
      }
    },
    (code) => {
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setNotice(t('voice.denied'));
      } else if (code === 'no-speech') {
        setNotice(t('voice.noSpeech'));
      } else if (code === 'unsupported') {
        setNotice(t('voice.unsupported'));
      } else if (code === 'audio-capture') {
        setNotice(t('voice.unsupported'));
      } else {
        setNotice(t('voice.error', { message: code }));
      }
    },
  );

  useEffect(() => {
    supportedRef.current = speech.supported;
  }, [speech.supported]);

  const supported = typeof window !== 'undefined'
    ? Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : false;

  const start = () => {
    setMode('voice');
    setNotice(null);
    speech.start();
  };

  const stop = () => {
    speech.stop();
  };

  return (
    <div className="field" data-testid="voice-control">
      <div className="btn-row">
        <button
          type="button"
          className={speech.listening ? 'btn btn-primary' : 'btn'}
          data-testid="voice-toggle"
          onClick={speech.listening ? stop : start}
          disabled={!supported}
        >
          {speech.listening ? t('voice.stop') : t('voice.start')}
        </button>
      </div>

      <div className="status-line">
        <span
          className={`status-dot ${speech.listening ? 'active' : ''} ${notice ? 'error' : ''}`}
          aria-hidden="true"
        />
        <span data-testid="voice-status">
          {speech.listening ? t('voice.listening') : supported ? t('common.ready') : t('common.unavailable')}
        </span>
      </div>

      {!supported && <p className="notice">{t('voice.unsupported')}</p>}
      {supported && <p className="notice">{t('voice.remote')}</p>}
      {notice && <p className="notice">{notice}</p>}
      {lastHeard && (
        <p className="device-hint" data-testid="voice-transcript">
          « {lastHeard} »
        </p>
      )}
      <span className="device-hint">{t('voice.hint')}</span>
      <span className="device-hint">
        {translate(lang, 'voice.languageSet', { language: lang.toUpperCase() })}
      </span>
    </div>
  );
}
