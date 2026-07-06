import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { RTL_LANGUAGES, translations } from '../i18n/translations';
import type { AppTranslations, Language } from '../i18n/types';
import { readStoredLanguage, storageKeyFor, DEFAULT_LANGUAGE } from '../lib/persistedSettings';
import { useAuth } from './AuthContext';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: AppTranslations;
  isRtl: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const storageKey = storageKeyFor(userId, 'language');

  const [language, setLanguageState] = useState<Language>(() =>
    readStoredLanguage(userId)
  );

  const isRtl = RTL_LANGUAGES.includes(language);
  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.title = t.meta.title;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', t.meta.description);
    }

    try {
      window.localStorage.setItem(storageKey, language);
    } catch {
      // Ignore storage failures.
    }
  }, [language, isRtl, t.meta.description, t.meta.title, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === 'en' || raw === 'he' || raw === 'ar') {
        setLanguageState(raw);
      } else {
        setLanguageState(DEFAULT_LANGUAGE);
      }
    } catch {
      setLanguageState(DEFAULT_LANGUAGE);
    }
  }, [storageKey]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isRtl
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
