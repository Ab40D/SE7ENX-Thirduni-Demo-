/**
 * SE7ENX — core domain types.
 * Pure TypeScript. No browser APIs, no React, no Three.js.
 */

import type { MessageKey } from './i18n';

export type LanguageCode = 'en' | 'fr' | 'ar' | 'dz';

export type DeviceId =
  | 'light'
  | 'shutter'
  | 'plug'
  | 'ambient'
  | 'climate'
  | 'occupancy';

export type CommandSource = 'manual' | 'voice' | 'text' | 'gesture' | 'system';

/** Light semantics:
 *  - `on === false`  → the luminaire is off.
 *  - `brightness === 0` → the luminaire is off (forced).
 *  - Turning the light off PRESERVES the last positive brightness value,
 *    so "turn on" restores the previous dimming level.
 */
export interface LightState {
  on: boolean;
  /** 0..100 */
  brightness: number;
}

export type ShutterMotion = 'open' | 'close' | 'stop';

/** Shutter semantics: 0 % = fully closed, 100 % = fully open. */
export interface ShutterState {
  /** 0..100 current physical position */
  position: number;
  /** 0..100 commanded destination (equals position when stopped) */
  target: number;
  moving: boolean;
  lastMotion: ShutterMotion;
}

export interface PlugState {
  on: boolean;
}

export interface AmbientState {
  /** 0..100 ambient/daylight level */
  level: number;
}

export interface ClimateState {
  /** simulated room temperature in °C */
  temperature: number;
}

export interface OccupancyState {
  occupied: boolean;
}

export interface DeviceStates {
  light: LightState;
  shutter: ShutterState;
  plug: PlugState;
  ambient: AmbientState;
  climate: ClimateState;
  occupancy: OccupancyState;
}

export interface ActivityEvent {
  id: string;
  /** epoch ms */
  at: number;
  source: CommandSource;
  device: DeviceId;
  /** i18n key, e.g. 'event.light.on' */
  action: MessageKey;
  /** i18n interpolation params */
  params?: Record<string, string | number>;
}

export interface SimulationState {
  devices: DeviceStates;
  events: ActivityEvent[];
  /** monotonic counter, keeps ids deterministic in tests */
  eventSeq: number;
}

/** Commands understood by the simulation engine. */
export type Command =
  | { kind: 'light.on' }
  | { kind: 'light.off' }
  | { kind: 'light.toggle' }
  | { kind: 'light.brightness'; value: number }
  | { kind: 'light.brighter' }
  | { kind: 'light.dimmer' }
  | { kind: 'shutter.open' }
  | { kind: 'shutter.close' }
  | { kind: 'shutter.stop' }
  | { kind: 'shutter.position'; value: number }
  | { kind: 'plug.on' }
  | { kind: 'plug.off' }
  | { kind: 'plug.toggle' }
  | { kind: 'ambient.set'; value: number }
  | { kind: 'occupancy.toggle' }
  | { kind: 'reset' };

export type CommandKind = Command['kind'];

/** i18n key of the message produced by a command. */
export type ResultCode =
  | 'ok.light.on'
  | 'ok.light.off'
  | 'ok.light.brightness'
  | 'ok.light.bumped'
  | 'ok.shutter.open'
  | 'ok.shutter.close'
  | 'ok.shutter.stop'
  | 'ok.shutter.position'
  | 'ok.plug.on'
  | 'ok.plug.off'
  | 'ok.ambient.set'
  | 'ok.occupancy.set'
  | 'ok.reset'
  | 'err.light.brightness'
  | 'err.shutter.position'
  | 'err.ambient.value'
  | 'err.generic';

export interface ActionResult {
  ok: boolean;
  code: ResultCode;
  params?: Record<string, string | number>;
  /** true when the command produced no physical change */
  noop?: boolean;
}

/** Knowledge-base questions answered by the assistant. */
export type QuestionIntent =
  | 'who'
  | 'what'
  | 'controls'
  | 'lightStatus'
  | 'shutterStatus'
  | 'gestures'
  | 'realBuilding'
  | 'automation'
  | 'help'
  | 'greetings'
  | 'thanks';

export type ParseOutcome =
  | { type: 'command'; command: Command; confidence: 'exact' | 'fuzzy' }
  | { type: 'question'; intent: QuestionIntent }
  | { type: 'invalid'; reason: 'range' | 'value'; device?: DeviceId }
  | { type: 'unknown' };

export const LANGUAGES: { code: LanguageCode; label: string; native: string; rtl: boolean }[] = [
  { code: 'en', label: 'English', native: 'English', rtl: false },
  { code: 'fr', label: 'French', native: 'Français', rtl: false },
  { code: 'ar', label: 'Arabic', native: 'العربية', rtl: true },
  { code: 'dz', label: 'Algerian Darija', native: 'الدارجة', rtl: true },
];
