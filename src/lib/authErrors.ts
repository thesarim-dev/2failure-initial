import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../i18n/types';
import { translations } from '../i18n/translations';

export function formatOAuthError(message: string, language: Language): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('unable to exchange external code') ||
    lower.includes('invalid_client') ||
    lower.includes('client secret is invalid')
  ) {
    return translations[language].login.errors.googleOAuth;
  }

  return message;
}
