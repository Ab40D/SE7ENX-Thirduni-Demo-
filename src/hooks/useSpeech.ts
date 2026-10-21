import { useCallback, useEffect, useRef, useState } from 'react';
import type { LanguageCode } from '../core/types';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function recognitionLang(lang: LanguageCode): string {
  switch (lang) {
    case 'fr':
      return 'fr-FR';
    case 'ar':
      return 'ar-DZ';
    case 'dz':
      return 'ar-DZ';
    default:
      return 'en-GB';
  }
}

export interface SpeechState {
  supported: boolean;
  listening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Browser-native speech recognition.
 *
 * The Web Speech API does not expose whether recognition runs on-device, so the
 * UI always discloses that the browser vendor may process audio remotely.
 */
export function useSpeech(
  lang: LanguageCode,
  onTranscript: (text: string, isFinal: boolean) => void,
  onError?: (message: string) => void,
): SpeechState {
  const supported = useRef<boolean>(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  onTranscriptRef.current = onTranscript;
  onErrorRef.current = onError;

  useEffect(() => {
    supported.current = Boolean(getRecognitionCtor());
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.abort();
      } catch {
        /* ignore */
      }
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('unsupported');
      onErrorRef.current?.('unsupported');
      return;
    }
    setError(null);
    try {
      const recognition = new Ctor();
      recognition.lang = recognitionLang(lang);
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? '';
          if (result.isFinal) {
            onTranscriptRef.current(transcript.trim(), true);
          } else {
            interim += transcript;
          }
        }
        if (interim) onTranscriptRef.current(interim.trim(), false);
      };

      recognition.onerror = (event: any) => {
        const code = event?.error ?? 'unknown';
        setError(code);
        setListening(false);
        onErrorRef.current?.(code);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'start-failed';
      setError(message);
      onErrorRef.current?.(message);
    }
  }, [lang]);

  useEffect(() => () => stop(), [stop]);

  return { supported: supported.current, listening, error, start, stop };
}
