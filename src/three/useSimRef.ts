import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/app';
import type { SimulationState } from '../core/types';

/**
 * Keeps a live reference to the simulation state without triggering React
 * re-renders — the 3D scene reads it inside `useFrame`.
 */
export function useSimRef(): React.MutableRefObject<SimulationState> {
  const ref = useRef<SimulationState>(useAppStore.getState().sim);
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state) => {
      ref.current = state.sim;
    });
    ref.current = useAppStore.getState().sim;
    return unsubscribe;
  }, []);
  return ref;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Frame-rate independent smoothing factor. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * Math.min(dt, 0.1)));
}

export const COLORS = {
  wall: '#F2F2F2',
  wallShade: '#E7E7E7',
  floor: '#DCDCDC',
  ceiling: '#FAFAFA',
  dark: '#1C1C1C',
  mid: '#3A3A3A',
  soft: '#B9B9B9',
  line: '#111111',
  sun: '#FFFFFF',
};

export function useThreeColors(): {
  wall: THREE.Color;
  floor: THREE.Color;
  dark: THREE.Color;
} {
  return {
    wall: new THREE.Color(COLORS.wall),
    floor: new THREE.Color(COLORS.floor),
    dark: new THREE.Color(COLORS.dark),
  };
}
