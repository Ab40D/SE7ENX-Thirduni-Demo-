import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';

export function EnvironmentPanel() {
  const t = useT();
  const devices = useAppStore((s) => s.sim.devices);
  const dispatch = useAppStore((s) => s.dispatch);
  const selectDevice = useAppStore((s) => s.selectDevice);
  const { ambient, occupancy, climate } = devices;

  return (
    <section className="panel" aria-labelledby="environment-title">
      <div className="panel-head">
        <h2 className="panel-title" id="environment-title">
          {t('panel.environment')}
        </h2>
        <span className="device-state" data-testid="climate-value">
          {climate.temperature.toFixed(1)} °C
        </span>
      </div>
      <div className="panel-body">
        <div className="device-block">
          <div className="device-title">
            <span className="device-name">{t('device.ambient')}</span>
            <span className="device-state">{ambient.level}%</span>
          </div>
          <input
            type="range"
            aria-label={t('device.ambient')}
            min={0}
            max={100}
            step={1}
            value={ambient.level}
            onChange={(event) => {
              selectDevice('ambient');
              dispatch({ kind: 'ambient.set', value: Number(event.target.value) }, 'manual');
            }}
          />
          <span className="device-hint">{t('ambient.hint')}</span>
        </div>

        <div className="device-block">
          <div className="device-title">
            <span className="device-name">{t('device.occupancy')}</span>
            <span className="device-state" data-testid="occupancy-state">
              {occupancy.occupied ? t('state.occupied') : t('state.empty')}
            </span>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              data-testid="occupancy-toggle"
              onClick={() => {
                selectDevice('occupancy');
                dispatch({ kind: 'occupancy.toggle' }, 'manual');
              }}
            >
              {t('occupancy.title')}
            </button>
          </div>
          <span className="device-hint">{t('occupancy.hint')}</span>
        </div>

        <div className="device-block">
          <div className="device-title">
            <span className="device-name">{t('device.climate')}</span>
            <span className="device-state">{t('state.simulated')}</span>
          </div>
          <span className="device-hint">{t('climate.hint')}</span>
        </div>
      </div>
    </section>
  );
}
