import { useMemo } from 'react';
import { useAppStore } from '../store/app';
import { translate, type MessageKey } from '../core/i18n';
import type { LanguageCode } from '../core/types';

export function useT() {
  const lang = useAppStore((s) => s.lang);
  return useMemo(
    () => (key: MessageKey, params?: Record<string, string | number>) =>
      translate(lang, key, params),
    [lang],
  );
}

export function useLang(): LanguageCode {
  return useAppStore((s) => s.lang);
}
