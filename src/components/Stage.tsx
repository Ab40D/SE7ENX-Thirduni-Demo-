import { useEffect, useMemo, useRef, useState } from 'react';
import { RoomCanvas, useWebGLSupport } from '../three/RoomScene';
import { FallbackRoom } from '../three/FallbackRoom';
import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';

/**
 * The stage: the 3D digital twin plus a compact HUD.
 * `assemble` drives the cinematic build of the room during the intro.
 */
export function Stage({ assemble, introActive }: { assemble: number; introActive: boolean }) {
  const t = useT();
  const devices = useAppStore((s) => s.sim.devices);
  const lang = useAppStore((s) => s.lang);
  const webgl = useWebGLSupport();
  const [isMobile, setIsMobile] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const power = useMemo(() => {
    const lighting = devices.light.on ? Math.round((devices.light.brightness / 100) * 14) : 0;
    const appliances = devices.plug.on ? 42 : 0;
    return lighting + appliances + Math.round((devices.ambient.level / 100) * 6);
  }, [devices]);

  const useFallback = webgl === false;

  return (
    <div className="stage" data-tour="stage" ref={stageRef}>
      <div className="stage-canvas">
        {useFallback ? (
          <FallbackRoom />
        ) : (
          <RoomCanvas
            assemble={assemble}
            introActive={introActive}
            shadows={!isMobile}
          />
        )}
      </div>

      {!introActive && (
      <div className="stage-legend" aria-hidden="true">
        <span className="legend-item">Digital twin · {t('app.badge.simulation')}</span>
        <span className="legend-item">1 unit = 1 m</span>
      </div>
      )}

      {!introActive && (
      <div className="stage-hud">
        <span className="hud-chip">
          {t('device.light')}{' '}
          <strong>
            <bdi>{devices.light.on ? `${devices.light.brightness}%` : t('state.off')}</bdi>
          </strong>
        </span>
        <span className="hud-chip">
          {t('device.shutter')} <strong><bdi>{Math.round(devices.shutter.position)}%</bdi></strong>
        </span>
        <span className="hud-chip">
          {t('device.climate')} <strong><bdi>{devices.climate.temperature.toFixed(1)} °C</bdi></strong>
        </span>
        <span className="hud-chip">
          <strong>
            <bdi>{power} W</bdi>
          </strong>
        </span>
        <span className="hud-chip">
          {t('device.occupancy')}{' '}
          <strong>{devices.occupancy.occupied ? t('state.occupied') : t('state.empty')}</strong>
        </span>
        <span className="hud-chip" lang={lang}>
          {t('hud.simulationOnly')}
        </span>
      </div>
      )}
    </div>
  );
}
