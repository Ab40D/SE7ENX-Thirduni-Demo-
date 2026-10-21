import { useEffect } from 'react';
import { useAppStore } from '../store/app';

/**
 * Drives the simulation clock (shutter motion). The delta is clamped so a
 * backgrounded tab cannot make the shutter jump.
 */
export function SimulationClock() {
  const tick = useAppStore((s) => s.tick);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.25);
      last = now;
      tick(delta);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [tick]);

  return null;
}
