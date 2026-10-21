import { useAppStore } from '../store/app';
import { translate } from '../core/i18n';

/**
 * 2D schematic fallback used when WebGL is unavailable.
 * It still reflects the live simulation state.
 */
export function FallbackRoom() {
  const lang = useAppStore((s) => s.lang);
  const light = useAppStore((s) => s.sim.devices.light);
  const shutter = useAppStore((s) => s.sim.devices.shutter);
  const plug = useAppStore((s) => s.sim.devices.plug);
  const occupancy = useAppStore((s) => s.sim.devices.occupancy);
  const temperature = useAppStore((s) => s.sim.devices.climate.temperature);
  const dispatch = useAppStore((s) => s.dispatch);

  const shutterHeight = Math.max(0, 120 - (shutter.position / 100) * 120);

  return (
    <div className="fallback-room" role="img" aria-label={translate(lang, 'intro.fallback')}>
      <svg viewBox="0 0 400 300" className="fallback-plan" aria-hidden="true">
        <rect x="30" y="30" width="340" height="220" className="plan-room" />
        <rect x="140" y="30" width="120" height="70" className="plan-window" />
        <rect
          x="140"
          y="30"
          width="120"
          height={shutterHeight}
          className={`plan-shutter ${shutter.moving ? 'moving' : ''}`}
        />
        <rect x="250" y="150" width="90" height="50" className="plan-sofa" />
        <rect x="120" y="190" width="70" height="40" className="plan-desk" />
        <circle cx="200" cy="95" r="26" className={`plan-lamp ${light.on ? 'on' : ''}`} />
        <circle cx="185" cy="210" r="9" className={`plan-plug ${plug.on ? 'on' : ''}`} />
        <circle cx="330" cy="210" r="9" className={`plan-sensor ${occupancy.occupied ? 'on' : ''}`} />
        <text x="200" y="275" className="plan-label">
          {temperature.toFixed(1)} °C
        </text>
      </svg>
      <div className="fallback-actions">
        <button type="button" className="btn" onClick={() => dispatch({ kind: 'light.toggle' }, 'manual')}>
          {light.on ? translate(lang, 'light.turnOff') : translate(lang, 'light.turnOn')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => dispatch({ kind: 'shutter.position', value: shutter.position > 50 ? 0 : 100 }, 'manual')}
        >
          {shutter.position > 50 ? translate(lang, 'shutter.close') : translate(lang, 'shutter.open')}
        </button>
      </div>
    </div>
  );
}
