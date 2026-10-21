import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';

/** Monochrome switch used for the light and the smart plug. */
function Switch({
  checked,
  onChange,
  label,
  id,
  'data-tour': dataTour,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  id: string;
  'data-tour'?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      data-testid={id}
      data-tour={dataTour}
      className="switch"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      <span className="switch-track" aria-hidden="true">
        <span className="switch-knob" />
      </span>
      <span className="switch-label">{label}</span>
    </button>
  );
}

export function DevicePanel() {
  const t = useT();
  const devices = useAppStore((s) => s.sim.devices);
  const dispatch = useAppStore((s) => s.dispatch);
  const selectDevice = useAppStore((s) => s.selectDevice);

  const { light, shutter, plug } = devices;

  return (
    <section className="panel" aria-labelledby="devices-title">
      <div className="panel-head">
        <h2 className="panel-title" id="devices-title">
          {t('panel.devices')}
        </h2>
        <span className="device-state">{t('app.badge.simulation')}</span>
      </div>

      <div className="panel-body">
        {/* Ceiling light */}
        <div className="device-block">
          <div className="device-title">
            <span className="device-name" id="device-light-name">
              {t('device.light')}
            </span>
            <span className="device-state" data-testid="light-state">
              {light.on ? t('state.on') : t('state.off')}
            </span>
          </div>
          <Switch
            id="light-switch"
            data-tour="light-switch"
            checked={light.on}
            onChange={() => {
              selectDevice('light');
              dispatch({ kind: 'light.toggle' }, 'manual');
            }}
            label={light.on ? t('light.turnOff') : t('light.turnOn')}
          />
          <div className="field">
            <div className="field-row">
              <label className="field-label" htmlFor="light-brightness">
                {t('light.brightness')}
              </label>
              <span className="field-value" data-testid="brightness-value">
                {light.brightness}%
              </span>
            </div>
            <input
              id="light-brightness"
              data-testid="light-brightness"
              data-tour="brightness"
              type="range"
              min={0}
              max={100}
              step={1}
              value={light.brightness}
              onChange={(event) => {
                selectDevice('light');
                dispatch({ kind: 'light.brightness', value: Number(event.target.value) }, 'manual');
              }}
            />
            {!light.on && light.brightness > 0 && (
              <span className="device-hint">{t('light.remembered', { value: light.brightness })}</span>
            )}
          </div>
        </div>

        {/* Shutter */}
        <div className="device-block">
          <div className="device-title">
            <span className="device-name">{t('device.shutter')}</span>
            <span className="device-state" data-testid="shutter-state">
              {shutter.moving ? t('state.moving') : t('state.stopped')}
            </span>
          </div>
          <div className="field">
            <div className="field-row">
              <label className="field-label" htmlFor="shutter-position">
                {t('shutter.position')}
              </label>
              <span className="field-value" data-testid="shutter-value">
                {Math.round(shutter.position)}%
              </span>
            </div>
            <input
              id="shutter-position"
              data-testid="shutter-position"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(shutter.position)}
              onChange={(event) => {
                selectDevice('shutter');
                dispatch(
                  { kind: 'shutter.position', value: Number(event.target.value) },
                  'manual',
                );
              }}
            />
            <div className="meter" aria-hidden="true">
              <span style={{ width: `${Math.round(shutter.position)}%` }} />
            </div>
            <span className="device-hint">{t('shutter.semantics')}</span>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              data-tour="shutter"
              data-testid="shutter-open"
              onClick={() => {
                selectDevice('shutter');
                dispatch({ kind: 'shutter.open' }, 'manual');
              }}
            >
              {t('shutter.open')}
            </button>
            <button
              type="button"
              className="btn"
              data-testid="shutter-close"
              onClick={() => {
                selectDevice('shutter');
                dispatch({ kind: 'shutter.close' }, 'manual');
              }}
            >
              {t('shutter.close')}
            </button>
            <button
              type="button"
              className="btn"
              data-testid="shutter-stop"
              onClick={() => {
                selectDevice('shutter');
                dispatch({ kind: 'shutter.stop' }, 'manual');
              }}
            >
              {t('shutter.stop')}
            </button>
          </div>
        </div>

        {/* Smart plug */}
        <div className="device-block">
          <div className="device-title">
            <span className="device-name">{t('device.plug')}</span>
            <span className="device-state" data-testid="plug-state">
              {plug.on ? t('state.on') : t('state.off')}
            </span>
          </div>
          <Switch
            id="plug-switch"
            checked={plug.on}
            onChange={() => {
              selectDevice('plug');
              dispatch({ kind: 'plug.toggle' }, 'manual');
            }}
            label={plug.on ? t('light.turnOff') : t('light.turnOn')}
          />
          <span className="device-hint">{t('plug.hint')}</span>
        </div>
      </div>
    </section>
  );
}
