import { snapshotDevice } from '../core/engine';
import type { DeviceId } from '../core/types';
import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';

const DEVICES: DeviceId[] = ['light', 'shutter', 'plug', 'ambient', 'climate', 'occupancy'];

export function InspectorPanel() {
  const t = useT();
  const sim = useAppStore((s) => s.sim);
  const selected = useAppStore((s) => s.selectedDevice);
  const selectDevice = useAppStore((s) => s.selectDevice);

  const snapshot = selected ? snapshotDevice(sim, selected) : null;
  const lastEvent = sim.events.find((event) => event.device === selected) ?? null;

  return (
    <section className="panel" aria-labelledby="inspector-title">
      <div className="panel-head">
        <h2 className="panel-title" id="inspector-title">
          {t('inspector.title')}
        </h2>
      </div>
      <div className="panel-body">
        <div className="field">
          <label className="field-label" htmlFor="inspector-device">
            {t('inspector.device')}
          </label>
          <select
            id="inspector-device"
            className="lang-select"
            value={selected ?? ''}
            onChange={(event) =>
              selectDevice(event.target.value ? (event.target.value as DeviceId) : null)
            }
          >
            <option value="">{t('inspector.choose')}</option>
            {DEVICES.map((id) => (
              <option key={id} value={id}>
                {t(snapshotDevice(sim, id).labelKey)}
              </option>
            ))}
          </select>
        </div>

        {snapshot ? (
          <dl className="inspector-grid">
            <dt>{t('inspector.device')}</dt>
            <dd data-testid="inspector-device">{t(snapshot.labelKey)}</dd>
            <dt>{t('inspector.state')}</dt>
            <dd data-testid="inspector-state">{t(snapshot.stateKey)}</dd>
            {snapshot.value && (
              <>
                <dt>{t('inspector.value')}</dt>
                <dd data-testid="inspector-value">{snapshot.value}</dd>
              </>
            )}
            <dt>{t('inspector.lastAction')}</dt>
            <dd data-testid="inspector-last-action">
              {lastEvent ? t(lastEvent.action as never, lastEvent.params) : t('inspector.none')}
            </dd>
          </dl>
        ) : (
          <p className="empty-state">{t('inspector.choose')}</p>
        )}
      </div>
    </section>
  );
}
