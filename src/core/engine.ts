/**
 * SE7ENX — pure simulation engine.
 *
 * Every interaction (manual control, voice, text, gesture) funnels through
 * `applyCommand`, so the 3D scene, the panels, the inspector and the event
 * history always read from one single source of truth.
 *
 * No browser APIs are used here, which makes the engine unit-testable.
 */
import type { MessageKey } from './i18n';
import type {
  ActionResult,
  ActivityEvent,
  Command,
  CommandSource,
  DeviceId,
  SimulationState,
} from './types';

/** Documented initial state of the simulation. */
export const INITIAL_LIGHT_BRIGHTNESS = 70;

export function createInitialState(): SimulationState {
  return {
    devices: {
      light: { on: true, brightness: INITIAL_LIGHT_BRIGHTNESS },
      shutter: { position: 100, target: 100, moving: false, lastMotion: 'stop' },
      plug: { on: true },
      ambient: { level: 45 },
      climate: { temperature: 21.5 },
      occupancy: { occupied: true },
    },
    events: [],
    eventSeq: 0,
  };
}

/** Shutter travel speed, in percent of the full travel per second. */
export const SHUTTER_SPEED = 42;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampPercent(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

/** Deterministic simulated temperature, derived from the other devices. */
export function deriveTemperature(state: SimulationState): number {
  const { ambient, light, shutter, occupancy, plug } = state.devices;
  const daylight = (ambient.level / 100) * (shutter.position / 100);
  const heat = (light.on ? (light.brightness / 100) * 1.6 : 0) + (plug.on ? 0.8 : 0);
  const people = occupancy.occupied ? 1.2 : 0;
  const value = 18.4 + daylight * 3.4 + heat + people;
  return Math.round(value * 10) / 10;
}

/** Simulated instantaneous power draw, in watts. */
export function derivePower(state: SimulationState): number {
  const { light, plug, ambient } = state.devices;
  const lighting = light.on ? Math.round((light.brightness / 100) * 14) : 0;
  const appliances = plug.on ? 42 : 0;
  const ambientLoad = Math.round((ambient.level / 100) * 6);
  return lighting + appliances + ambientLoad;
}

function pushEvent(
  state: SimulationState,
  source: CommandSource,
  device: DeviceId,
  action: MessageKey,
  params?: Record<string, string | number>,
): SimulationState {
  const eventSeq = state.eventSeq + 1;
  const event: ActivityEvent = {
    id: `ev-${eventSeq}`,
    at: Date.now(),
    source,
    device,
    action,
    params,
  };
  return {
    ...state,
    eventSeq,
    events: [event, ...state.events].slice(0, 60),
  };
}

function withClimate(state: SimulationState): SimulationState {
  return {
    ...state,
    devices: {
      ...state.devices,
      climate: { temperature: deriveTemperature(state) },
    },
  };
}

export interface ApplyOptions {
  source: CommandSource;
  /** epoch ms, injectable for deterministic tests */
  now?: number;
}

/**
 * Applies a command and returns the new state plus a structured result.
 * The result code is an i18n key — the UI layer translates it.
 */
export function applyCommand(
  state: SimulationState,
  command: Command,
  options: ApplyOptions,
): { state: SimulationState; result: ActionResult } {
  const { source } = options;

  switch (command.kind) {
    case 'light.on': {
      if (state.devices.light.on) {
        return { state, result: { ok: true, code: 'ok.light.on', noop: true } };
      }
      let next = state;
      next = {
        ...next,
        devices: {
          ...next.devices,
          light: { ...next.devices.light, on: true, brightness: next.devices.light.brightness || INITIAL_LIGHT_BRIGHTNESS },
        },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'light', 'event.light.on');
      return { state: next, result: { ok: true, code: 'ok.light.on' } };
    }

    case 'light.off': {
      if (!state.devices.light.on) {
        return { state, result: { ok: true, code: 'ok.light.off', noop: true } };
      }
      let next = state;
      next = {
        ...next,
        devices: {
          ...next.devices,
          // keep the last positive brightness so "turn on" restores it
          light: { ...next.devices.light, on: false },
        },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'light', 'event.light.off');
      return { state: next, result: { ok: true, code: 'ok.light.off' } };
    }

    case 'light.toggle': {
      return applyCommand(state, state.devices.light.on ? { kind: 'light.off' } : { kind: 'light.on' }, options);
    }

    case 'light.brightness': {
      const value = clampPercent(command.value);
      if (!Number.isFinite(value)) {
        return { state, result: { ok: false, code: 'err.light.brightness' } };
      }
      let next = state;
      next = {
        ...next,
        devices: {
          ...next.devices,
          light: { on: value > 0, brightness: value },
        },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'light', 'event.light.brightness', { value });
      return { state: next, result: { ok: true, code: 'ok.light.brightness', params: { value } } };
    }

    case 'light.brighter':
    case 'light.dimmer': {
      const delta = command.kind === 'light.brighter' ? 20 : -20;
      const current = state.devices.light.brightness || INITIAL_LIGHT_BRIGHTNESS;
      const value = clampPercent(current + delta);
      const applied = applyCommand(state, { kind: 'light.brightness', value }, options);
      return {
        state: applied.state,
        result: { ok: true, code: 'ok.light.bumped', params: { value } },
      };
    }

    case 'shutter.open':
    case 'shutter.close': {
      const target = command.kind === 'shutter.open' ? 100 : 0;
      const motion = command.kind === 'shutter.open' ? 'open' : 'close';
      if (Math.round(state.devices.shutter.position) === target && !state.devices.shutter.moving) {
        return { state, result: { ok: true, code: `ok.shutter.${motion}`, noop: true } };
      }
      let next = state;
      next = {
        ...next,
        devices: {
          ...next.devices,
          shutter: { ...next.devices.shutter, target, moving: true, lastMotion: motion },
        },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'shutter', `event.shutter.${motion}`);
      return { state: next, result: { ok: true, code: `ok.shutter.${motion}` } };
    }

    case 'shutter.stop': {
      const shutter = state.devices.shutter;
      if (!shutter.moving) {
        return { state, result: { ok: true, code: 'ok.shutter.stop', noop: true } };
      }
      let next = state;
      next = {
        ...next,
        devices: {
          ...next.devices,
          shutter: {
            ...shutter,
            position: shutter.position,
            target: shutter.position,
            moving: false,
            lastMotion: 'stop',
          },
        },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'shutter', 'event.shutter.stop', { value: Math.round(shutter.position) });
      return { state: next, result: { ok: true, code: 'ok.shutter.stop', params: { value: Math.round(shutter.position) } } };
    }

    case 'shutter.position': {
      const value = clampPercent(command.value);
      if (!Number.isFinite(value)) {
        return { state, result: { ok: false, code: 'err.shutter.position' } };
      }
      const shutter = state.devices.shutter;
      const isThere = Math.round(shutter.position) === value && !shutter.moving;
      let next = state;
      next = {
        ...next,
        devices: {
          ...next.devices,
          shutter: {
            ...shutter,
            target: value,
            moving: !isThere,
            lastMotion: isThere ? 'stop' : value > shutter.position ? 'open' : 'close',
          },
        },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'shutter', 'event.shutter.position', { value });
      return {
        state: next,
        result: { ok: true, code: 'ok.shutter.position', params: { value }, noop: isThere },
      };
    }

    case 'plug.on':
    case 'plug.off':
    case 'plug.toggle': {
      const current = state.devices.plug.on;
      const on = command.kind === 'plug.toggle' ? !current : command.kind === 'plug.on';
      if (current === on) {
        return { state, result: { ok: true, code: on ? 'ok.plug.on' : 'ok.plug.off', noop: true } };
      }
      let next = state;
      next = {
        ...next,
        devices: { ...next.devices, plug: { on } },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'plug', on ? 'event.plug.on' : 'event.plug.off');
      return { state: next, result: { ok: true, code: on ? 'ok.plug.on' : 'ok.plug.off' } };
    }

    case 'ambient.set': {
      const value = clampPercent(command.value);
      if (!Number.isFinite(value)) {
        return { state, result: { ok: false, code: 'err.ambient.value' } };
      }
      let next = state;
      next = {
        ...next,
        devices: { ...next.devices, ambient: { level: value } },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'ambient', 'event.ambient.set', { value });
      return { state: next, result: { ok: true, code: 'ok.ambient.set', params: { value } } };
    }

    case 'occupancy.toggle': {
      const occupied = !state.devices.occupancy.occupied;
      let next = state;
      next = {
        ...next,
        devices: { ...next.devices, occupancy: { occupied } },
      };
      next = withClimate(next);
      next = pushEvent(next, source, 'occupancy', occupied ? 'event.occupancy.on' : 'event.occupancy.off');
      return { state: next, result: { ok: true, code: 'ok.occupancy.set', params: { value: occupied ? 1 : 0 } } };
    }

    case 'reset': {
      const fresh = createInitialState();
      const next = pushEvent(fresh, source, 'light', 'event.reset');
      return { state: next, result: { ok: true, code: 'ok.reset' } };
    }

    default: {
      return { state, result: { ok: false, code: 'err.generic' } };
    }
  }
}

/**
 * Advances the simulation clock (used for shutter motion).
 * The 3D scene reads `shutter.position`, so geometry and state never drift.
 */
export function tick(state: SimulationState, deltaSeconds: number): SimulationState {
  const shutter = state.devices.shutter;
  if (!shutter.moving) return state;
  const delta = shutter.target - shutter.position;
  const step = SHUTTER_SPEED * Math.max(0, Math.min(deltaSeconds, 5));
  if (Math.abs(delta) <= step) {
    const next = withClimate({
      ...state,
      devices: { ...state.devices, shutter: { ...shutter, position: shutter.target, moving: false } },
    });
    return next;
  }
  return {
    ...state,
    devices: {
      ...state.devices,
      shutter: { ...shutter, position: shutter.position + Math.sign(delta) * step },
    },
  };
}

/** Human-readable snapshot used by the inspector panel. */
export interface DeviceSnapshot {
  id: DeviceId;
  labelKey: MessageKey;
  stateKey: MessageKey;
  value?: string;
}

export function snapshotDevice(state: SimulationState, id: DeviceId): DeviceSnapshot {
  const { light, shutter, plug, ambient, occupancy } = state.devices;
  switch (id) {
    case 'light':
      return {
        id,
        labelKey: 'device.light',
        stateKey: light.on ? 'state.on' : 'state.off',
        value: `${light.brightness}%`,
      };
    case 'shutter':
      return {
        id,
        labelKey: 'device.shutter',
        stateKey: shutter.moving ? 'state.moving' : 'state.stopped',
        value: `${Math.round(shutter.position)}%`,
      };
    case 'plug':
      return { id, labelKey: 'device.plug', stateKey: plug.on ? 'state.on' : 'state.off' };
    case 'ambient':
      return { id, labelKey: 'device.ambient', stateKey: 'state.level', value: `${ambient.level}%` };
    case 'climate':
      return {
        id,
        labelKey: 'device.climate',
        stateKey: 'state.simulated',
        value: `${state.devices.climate.temperature.toFixed(1)} °C`,
      };
    case 'occupancy':
      return {
        id,
        labelKey: 'device.occupancy',
        stateKey: occupancy.occupied ? 'state.occupied' : 'state.empty',
      };
    default:
      return { id, labelKey: 'device.light', stateKey: 'state.unknown' };
  }
}
