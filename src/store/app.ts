/**
 * SE7ENX — application store.
 *
 * A single Zustand store holds the simulation state (owned by the pure
 * engine) plus the UI state (language, interaction mode, conversation,
 * selected device, tour progress).
 */
import { create } from 'zustand';
import { answerQuestion } from '../core/assistant';
import { applyCommand, createInitialState, tick as tickSim } from '../core/engine';
import { translate, type MessageKey } from '../core/i18n';
import { parseCommand } from '../core/parser';
import type {
  Command,
  CommandSource,
  DeviceId,
  LanguageCode,
  SimulationState,
} from '../core/types';

export type InteractionMode = 'manual' | 'voice' | 'gesture';
export type AppPhase = 'intro' | 'app';
export type GuideExpression =
  | 'idle'
  | 'speaking'
  | 'explaining'
  | 'pointing'
  | 'thinking'
  | 'concerned'
  | 'success';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: number;
  status?: 'executed' | 'answered' | 'failed';
  /** i18n key of the status badge */
  statusKey?: MessageKey;
}

interface AppState {
  sim: SimulationState;
  lang: LanguageCode;
  mode: InteractionMode;
  phase: AppPhase;
  selectedDevice: DeviceId | null;
  messages: ChatMessage[];
  pending: boolean;
  tourStep: number | null;
  guideExpression: GuideExpression;
  /** live region text, announced to screen readers */
  announcement: string;
  lastResultCode: MessageKey | null;

  setLang: (lang: LanguageCode) => void;
  setMode: (mode: InteractionMode) => void;
  setPhase: (phase: AppPhase) => void;
  selectDevice: (id: DeviceId | null) => void;
  setGuideExpression: (expression: GuideExpression) => void;
  setAnnouncement: (text: string) => void;
  setPending: (pending: boolean) => void;

  dispatch: (command: Command, source: CommandSource) => void;
  sendText: (text: string, source?: CommandSource) => void;
  resetConversation: () => void;
  setTourStep: (step: number | null) => void;
  tick: (deltaSeconds: number) => void;
}

let messageSeq = 0;
function nextMessageId(): string {
  messageSeq += 1;
  return `m-${messageSeq}`;
}

const initialMessages: ChatMessage[] = [];

export const useAppStore = create<AppState>((set, get) => ({
  sim: createInitialState(),
  lang: 'en',
  mode: 'manual',
  phase: 'intro',
  selectedDevice: 'light',
  messages: initialMessages,
  pending: false,
  tourStep: null,
  guideExpression: 'idle',
  announcement: '',
  lastResultCode: null,

  setLang: (lang) => set({ lang }),
  setMode: (mode) => set({ mode }),
  setPhase: (phase) => set({ phase }),
  selectDevice: (id) => set({ selectedDevice: id }),
  setGuideExpression: (guideExpression) => set({ guideExpression }),
  setAnnouncement: (announcement) => set({ announcement }),
  setPending: (pending) => set({ pending }),

  dispatch: (command, source) => {
    const { sim, lang } = get();
    const { state, result } = applyCommand(sim, command, { source });
    const message = translate(lang, result.code, result.params);
    set({
      sim: state,
      announcement: message,
      lastResultCode: result.code,
      guideExpression: result.ok ? 'success' : 'concerned',
    });
  },

  sendText: (text, source = 'text') => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { lang } = get();
    const userMessage: ChatMessage = {
      id: nextMessageId(),
      role: 'user',
      text: trimmed,
      at: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, userMessage], pending: true }));

    const outcome = parseCommand(trimmed, lang);

    // Small delay so the "processing" indicator is perceivable, but never blocks.
    window.setTimeout(() => {
      const current = get();
      if (outcome.type === 'command') {
        const { state, result } = applyCommand(current.sim, outcome.command, { source });
        const reply: ChatMessage = {
          id: nextMessageId(),
          role: 'assistant',
          text: translate(current.lang, result.code, result.params),
          at: Date.now(),
          status: result.ok ? 'executed' : 'failed',
          statusKey: result.ok ? 'assistant.status.executed' : 'assistant.status.failed',
        };
        set({
          sim: state,
          messages: [...current.messages, reply],
          pending: false,
          announcement: reply.text,
          lastResultCode: result.code,
          guideExpression: result.ok ? 'success' : 'concerned',
        });
        return;
      }
      if (outcome.type === 'question') {
        const answer = answerQuestion(outcome.intent, current.sim, current.lang);
        const reply: ChatMessage = {
          id: nextMessageId(),
          role: 'assistant',
          text: answer.text,
          at: Date.now(),
          status: answer.status,
          statusKey:
            answer.status === 'answered' ? 'assistant.status.answered' : 'assistant.status.failed',
        };
        set({
          messages: [...current.messages, reply],
          pending: false,
          announcement: reply.text,
          guideExpression: 'explaining',
        });
        return;
      }
      if (outcome.type === 'invalid') {
        const reply: ChatMessage = {
          id: nextMessageId(),
          role: 'assistant',
          text: translate(current.lang, 'answer.invalid'),
          at: Date.now(),
          status: 'failed',
          statusKey: 'assistant.status.failed',
        };
        set({
          messages: [...current.messages, reply],
          pending: false,
          announcement: reply.text,
          guideExpression: 'concerned',
        });
        return;
      }
      const reply: ChatMessage = {
        id: nextMessageId(),
        role: 'assistant',
        text: translate(current.lang, 'answer.unknown'),
        at: Date.now(),
        status: 'failed',
        statusKey: 'assistant.status.failed',
      };
      set({
        messages: [...current.messages, reply],
        pending: false,
        announcement: reply.text,
        guideExpression: 'thinking',
      });
    }, 220);
  },

  resetConversation: () =>
    set((state) => ({
      messages: [
        {
          id: nextMessageId(),
          role: 'assistant',
          text: translate(state.lang, 'assistant.greeting'),
          at: Date.now(),
          status: 'answered',
          statusKey: 'assistant.status.answered',
        },
      ],
    })),

  setTourStep: (tourStep) => set({ tourStep }),

  tick: (deltaSeconds) => {
    const { sim } = get();
    if (!sim.devices.shutter.moving) return;
    const next = tickSim(sim, deltaSeconds);
    set({ sim: next });
  },
}));

/** Subscribe to simulation state without re-rendering (used by the 3D scene). */
export function useSimState(): SimulationState {
  return useAppStore((s) => s.sim);
}
