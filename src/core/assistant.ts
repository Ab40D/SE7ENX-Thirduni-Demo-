/**
 * SE7ENX — conversational building assistant.
 *
 * Deterministic, rule-based answers about the simulated building. The
 * assistant reads the same simulation state as the 3D scene, so it can never
 * report a state that does not exist.
 */
import { translate, type MessageKey } from './i18n';
import type { LanguageCode, QuestionIntent, SimulationState } from './types';

export interface Answer {
  text: string;
  /** 'answered' for knowledge questions, 'executed' for device commands. */
  status: 'answered' | 'executed' | 'failed';
}

export function answerQuestion(
  intent: QuestionIntent,
  state: SimulationState,
  lang: LanguageCode,
): Answer {
  const t = (key: MessageKey, params?: Record<string, string | number>) =>
    translate(lang, key, params);

  switch (intent) {
    case 'lightStatus': {
      const { light } = state.devices;
      return {
        text: t('answer.lightStatus', {
          state: light.on ? t('state.on') : t('state.off'),
          brightness: light.brightness,
        }),
        status: 'answered',
      };
    }
    case 'shutterStatus': {
      const { shutter } = state.devices;
      return {
        text: t('answer.shutterStatus', {
          position: Math.round(shutter.position),
          motion: shutter.moving ? t('state.moving') : t('state.stopped'),
        }),
        status: 'answered',
      };
    }
    case 'greetings':
      return { text: t('answer.greetings'), status: 'answered' };
    case 'thanks':
      return { text: t('answer.thanks'), status: 'answered' };
    case 'who':
      return { text: t('answer.who'), status: 'answered' };
    case 'what':
      return { text: t('answer.what'), status: 'answered' };
    case 'controls':
      return { text: t('answer.controls'), status: 'answered' };
    case 'gestures':
      return { text: t('answer.gestures'), status: 'answered' };
    case 'realBuilding':
      return { text: t('answer.realBuilding'), status: 'answered' };
    case 'automation':
      return { text: t('answer.automation'), status: 'answered' };
    case 'help':
      return { text: t('answer.help'), status: 'answered' };
    default:
      return { text: t('answer.unknown'), status: 'failed' };
  }
}
