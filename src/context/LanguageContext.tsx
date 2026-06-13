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

const STORAGE_KEY = '2failure-language';
const DEFAULT_LANGUAGE: Language = 'en';

export function readStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'en' || raw === 'he' || raw === 'ar') return raw;
  } catch {
    // Ignore storage failures.
  }

  return DEFAULT_LANGUAGE;
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: AppTranslations;
  isRtl: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);
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
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage failures.
    }
  }, [language, isRtl, t.meta.description, t.meta.title]);

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
