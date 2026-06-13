import type { AppTranslations, Language } from '../types';
import { FUN_FACTS_AR } from '../funFacts/ar';
import { FUN_FACTS_EN } from '../funFacts/en';
import { FUN_FACTS_HE } from '../funFacts/he';
import { moveTranslations } from '../moveTranslations';
import { settingsContent } from '../settingsContent';
import { uiContent } from '../uiContent';

export const RTL_LANGUAGES: Language[] = ['he', 'ar'];
export const LANGUAGE_OPTIONS: Language[] = ['en', 'he', 'ar'];

const FUN_FACTS_BY_LANG = {
  en: FUN_FACTS_EN,
  he: FUN_FACTS_HE,
  ar: FUN_FACTS_AR
} as const;

function buildLocale(lang: Language): AppTranslations {
  const ui = uiContent[lang];
  return {
    ...ui,
    settings: settingsContent[lang],
    moves: moveTranslations[lang],
    dashboard: {
      ...ui.dashboard,
      funFacts: {
        loading: ui.dashboard.funFactsLoading,
        facts: [...FUN_FACTS_BY_LANG[lang]]
      }
    }
  };
}

export const translations: Record<Language, AppTranslations> = {
  en: buildLocale('en'),
  he: buildLocale('he'),
  ar: buildLocale('ar')
};
