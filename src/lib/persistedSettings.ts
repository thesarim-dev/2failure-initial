import type { Language } from '../i18n/types';

export const DEFAULT_LANGUAGE: Language = 'en';

export function storageKeyFor(userId: string | undefined, key: string) {
  return userId ? `2failure-user-${userId}-${key}` : `2failure-${key}`;
}

export function readStoredLanguage(userId?: string): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, 'language'));
    if (raw === 'en' || raw === 'he' || raw === 'ar') return raw;
  } catch {
    // ignore
  }

  return DEFAULT_LANGUAGE;
}
