import { useCallback, useEffect, useRef, useState } from 'react';
import type { LanguageCode } from '../core/types';

function synthesisLang(lang: LanguageCode): string {
  switch (lang) {
    case 'fr':
      return 'fr-FR';
    case 'ar':
    case 'dz':
      return 'ar-DZ';
    default:
      return 'en-GB';
  }
}

/**
 * Optional text-to-speech for the guide narration.
 * Nothing is ever played automatically: the visitor presses "Listen".
 */
export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const lastRef = useRef<{ text: string; lang: LanguageCode } | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speak = useCallback(
    (text: string, lang: LanguageCode) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!text) return;
      window.speechSynthesis.cancel();
      lastRef.current = { text, lang };
      if (muted) {
        setSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = synthesisLang(lang);
      utterance.rate = 0.98;
      utterance.pitch = 1.02;
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
      };
      setSpeaking(true);
      setPaused(false);
      window.speechSynthesis.speak(utterance);
    },
    [muted],
  );

  const toggle = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking && !paused) {
      window.speechSynthesis.pause();
      setPaused(true);
      return;
    }
    if (speaking && paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      return;
    }
    if (lastRef.current) speak(lastRef.current.text, lastRef.current.lang);
  }, [speaking, paused, speak]);

  const replay = useCallback(() => {
    if (lastRef.current) speak(lastRef.current.text, lastRef.current.lang);
  }, [speak]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        setPaused(false);
      }
      return next;
    });
  }, []);

  return { supported, speaking, paused, muted, speak, toggle, replay, toggleMute, stop };
}
