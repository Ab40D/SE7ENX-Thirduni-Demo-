import { formatTime, type MessageKey } from '../core/i18n';
import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';

export function HistoryPanel() {
  const t = useT();
  const events = useAppStore((s) => s.sim.events);
  const lang = useAppStore((s) => s.lang);

  return (
    <section className="panel" aria-labelledby="history-title">
      <div className="panel-head">
        <h2 className="panel-title" id="history-title">
          {t('history.title')}
        </h2>
        <span className="device-state">{events.length}</span>
      </div>
      <div className="panel-body">
        {events.length === 0 ? (
          <p className="empty-state">{t('history.empty')}</p>
        ) : (
          <ul className="history-list" data-testid="history-list">
            {events.map((event) => (
              <li key={event.id} className="history-item">
                <span>{t(event.action, event.params)}</span>
                <span className="history-source">{t(`source.${event.source}` as MessageKey)}</span>
                <span className="history-time">{formatTime(lang, event.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
