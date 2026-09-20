import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'fr', 'es', 'ar'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Always include the locale prefix: /en, /fr, /es, /ar
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

/** Locales written in their own language (used by the language switcher). */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  ar: 'العربية',
};

/** Locales that render right-to-left. */
export const rtlLocales: Locale[] = ['ar'];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}