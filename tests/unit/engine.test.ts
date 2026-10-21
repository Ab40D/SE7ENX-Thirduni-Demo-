import { describe, expect, it } from 'vitest';
import {
  applyCommand,
  createInitialState,
  deriveTemperature,
  INITIAL_LIGHT_BRIGHTNESS,
  snapshotDevice,
  tick,
} from '../../src/core/engine';
import type { Command, CommandSource, SimulationState } from '../../src/core/types';

const source: CommandSource = 'manual';

function run(state: SimulationState, ...commands: Command[]) {
  let current = state;
  const results = [];
  for (const command of commands) {
    const outcome = applyCommand(current, command, { source });
    current = outcome.state;
    results.push(outcome.result);
  }
  return { state: current, results };
}

describe('light', () => {
  it('starts on with the documented initial brightness', () => {
    const state = createInitialState();
    expect(state.devices.light.on).toBe(true);
    expect(state.devices.light.brightness).toBe(INITIAL_LIGHT_BRIGHTNESS);
  });

  it('turns on and off', () => {
    const { state } = run(createInitialState(), { kind: 'light.off' }, { kind: 'light.on' });
    expect(state.devices.light.on).toBe(true);
  });

  it('keeps the previous positive brightness when the light is switched off', () => {
    const { state } = run(createInitialState(), { kind: 'light.brightness', value: 42 });
    expect(state.devices.light.brightness).toBe(42);
    const off = applyCommand(state, { kind: 'light.off' }, { source });
    expect(off.state.devices.light.on).toBe(false);
    expect(off.state.devices.light.brightness).toBe(42);
    const on = applyCommand(off.state, { kind: 'light.on' }, { source });
    expect(on.state.devices.light.on).toBe(true);
    expect(on.state.devices.light.brightness).toBe(42);
  });

  it('treats 0 % brightness as off', () => {
    const { state } = run(createInitialState(), { kind: 'light.brightness', value: 0 });
    expect(state.devices.light.on).toBe(false);
    expect(state.devices.light.brightness).toBe(0);
  });

  it('clamps brightness into the 0..100 range', () => {
    const { state } = run(createInitialState(), { kind: 'light.brightness', value: 140 });
    expect(state.devices.light.brightness).toBe(100);
  });

  it('supports relative brightness changes', () => {
    const { state } = run(createInitialState(), { kind: 'light.dimmer' });
    expect(state.devices.light.brightness).toBe(INITIAL_LIGHT_BRIGHTNESS - 20);
  });
});

describe('shutter', () => {
  it('opens, closes and stops', () => {
    const { state: opened } = run(createInitialState(), { kind: 'shutter.close' });
    expect(opened.devices.shutter.moving).toBe(true);
    expect(opened.devices.shutter.target).toBe(0);

    const closed = tick(opened, 5);
    expect(closed.devices.shutter.position).toBe(0);
    expect(closed.devices.shutter.moving).toBe(false);

    const { state: reopened } = run(closed, { kind: 'shutter.open' });
    expect(reopened.devices.shutter.target).toBe(100);
    const openedState = tick(reopened, 5);
    expect(openedState.devices.shutter.position).toBe(100);
  });

  it('freezes the position when stopped mid-travel', () => {
    const { state: closing } = run(createInitialState(), { kind: 'shutter.close' });
    const partial = tick(closing, 0.5);
    const position = partial.devices.shutter.position;
    expect(position).toBeGreaterThan(0);
    expect(position).toBeLessThan(100);

    const { state: stopped } = run(partial, { kind: 'shutter.stop' });
    expect(stopped.devices.shutter.moving).toBe(false);
    const after = tick(stopped, 2);
    expect(after.devices.shutter.position).toBe(position);
  });

  it('moves towards an absolute position', () => {
    const { state } = run(createInitialState(), { kind: 'shutter.position', value: 70 });
    expect(state.devices.shutter.target).toBe(70);
    const after = tick(state, 3);
    expect(Math.round(after.devices.shutter.position)).toBe(70);
    expect(after.devices.shutter.moving).toBe(false);
  });
});

describe('other devices', () => {
  it('toggles the smart plug', () => {
    const { state } = run(createInitialState(), { kind: 'plug.toggle' });
    expect(state.devices.plug.on).toBe(false);
  });

  it('toggles occupancy', () => {
    const { state } = run(createInitialState(), { kind: 'occupancy.toggle' });
    expect(state.devices.occupancy.occupied).toBe(false);
  });

  it('derives a coherent simulated temperature', () => {
    const base = createInitialState();
    const bright = applyCommand(base, { kind: 'light.brightness', value: 100 }, { source }).state;
    const dark = applyCommand(base, { kind: 'light.off' }, { source }).state;
    expect(deriveTemperature(bright)).toBeGreaterThan(deriveTemperature(dark));
  });
});

describe('history and reset', () => {
  it('appends timestamped events with their source', () => {
    const { state } = run(createInitialState(), { kind: 'light.off' });
    expect(state.events.length).toBe(1);
    expect(state.events[0].device).toBe('light');
    expect(state.events[0].source).toBe('manual');
    expect(typeof state.events[0].at).toBe('number');
  });

  it('does not log an event when nothing changes', () => {
    const { state } = run(createInitialState(), { kind: 'light.on' });
    expect(state.events.length).toBe(0);
  });

  it('resets to the documented initial state', () => {
    const { state } = run(
      createInitialState(),
      { kind: 'light.brightness', value: 5 },
      { kind: 'shutter.close' },
      { kind: 'plug.off' },
      { kind: 'reset' },
    );
    const fresh = createInitialState();
    expect(state.devices.light).toEqual(fresh.devices.light);
    expect(state.devices.shutter.position).toBe(fresh.devices.shutter.position);
    expect(state.devices.plug).toEqual(fresh.devices.plug);
    expect(state.events[0].action).toBe('event.reset');
  });
});

describe('inspector snapshots', () => {
  it('describes the current device state', () => {
    const state = createInitialState();
    const snapshot = snapshotDevice(state, 'light');
    expect(snapshot.labelKey).toBe('device.light');
    expect(snapshot.stateKey).toBe('state.on');
    expect(snapshot.value).toBe(`${INITIAL_LIGHT_BRIGHTNESS}%`);
  });
});
