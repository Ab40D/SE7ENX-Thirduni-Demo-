import { useEffect, useRef, useState } from 'react';
import { sampleCommands } from '../core/parser';
import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';

export function AssistantPanel() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const messages = useAppStore((s) => s.messages);
  const pending = useAppStore((s) => s.pending);
  const sendText = useAppStore((s) => s.sendText);
  const resetConversation = useAppStore((s) => s.resetConversation);
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  const examples = sampleCommands(lang);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    sendText(trimmed, 'text');
    setDraft('');
  };

  return (
    <section className="panel" aria-labelledby="assistant-title">
      <div className="panel-head">
        <h2 className="panel-title" id="assistant-title">
          {t('assistant.title')}
        </h2>
        <button type="button" className="btn btn-ghost" onClick={resetConversation}>
          {t('assistant.reset')}
        </button>
      </div>
      <div className="panel-body">
        <div className="chat-log" ref={logRef} data-testid="chat-log" aria-live="polite">
          {messages.length === 0 && (
            <p className="empty-state">{t('assistant.greeting')}</p>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`chat-msg ${message.role}`}>
              <span className="chat-meta">
                {message.role === 'user' ? t('assistant.you') : t('assistant.se7enx')}
                {message.statusKey && (
                  <span className="chat-status">{t(message.statusKey)}</span>
                )}
              </span>
              <span className="chat-bubble">{message.text}</span>
            </div>
          ))}
          {pending && (
            <div className="chat-msg assistant">
              <span className="chat-bubble typing" aria-label={t('assistant.thinking')}>
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
        </div>

        <div className="field">
          <span className="field-label">{t('assistant.examples')}</span>
          <div className="example-chips">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                className="chip"
                onClick={() => submit(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <form
          className="chat-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <label className="sr-only" htmlFor="chat-input">
            {t('assistant.placeholder')}
          </label>
          <input
            id="chat-input"
            className="chat-input"
            data-testid="chat-input"
            value={draft}
            placeholder={t('assistant.placeholder')}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary" data-testid="chat-send">
            {t('assistant.send')}
          </button>
        </form>
      </div>
    </section>
  );
}
