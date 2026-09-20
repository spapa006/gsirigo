import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { routing, isRtl } from '@/i18n/routing';
import { getSettings } from '@/lib/db/repositories/settings';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Analytics } from '@/components/analytics';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gsirigo.com'
    ),
    title: {
      default: t('title'),
      template: `%s — ${t('brand')}`,
    },
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRtl(locale) ? 'rtl' : 'ltr';
  const settings = await getSettings();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${notoArabic.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter
              locale={locale as (typeof routing.locales)[number]}
              disclosure={settings.affiliateDisclosure || undefined}
              socialX={settings.socialX}
              socialInstagram={settings.socialInstagram}
              socialFacebook={settings.socialFacebook}
            />
          </div>
          <Analytics gaId={settings.gaId || undefined} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}