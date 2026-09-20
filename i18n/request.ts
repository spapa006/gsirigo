import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { locale } from 'next/root-params';
import { routing } from './routing';

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  // Determine the locale. When none is passed explicitly (e.g. from the
  // proxy), read the dynamic `[locale]` segment via next/root-params.
  const resolvedLocale = explicitLocale ?? (await locale());

  if (!hasLocale(routing.locales, resolvedLocale)) {
    // Unknown locale: 404
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});