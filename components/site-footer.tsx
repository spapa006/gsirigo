import { getTranslations } from 'next-intl/server';
import { CarFront, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/lib/site';
import { PARTNER_LIST } from '@/lib/partners';
import type { Locale } from '@/i18n/routing';

const QUICK_LINKS = [
  { href: '/', key: 'home' },
  { href: '/articles', key: 'articles' },
  { href: '/destinations', key: 'destinations' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const;

const LEGAL_LINKS = [
  { href: '/legal/affiliate-disclosure', key: 'affiliate' },
  { href: '/legal/privacy-policy', key: 'privacy' },
  { href: '/legal/terms', key: 'terms' },
] as const;

export async function SiteFooter({
  locale,
  disclosure,
  socialX,
  socialInstagram,
  socialFacebook,
}: {
  locale: Locale;
  /** Display text override from the admin Settings table */
  disclosure?: string;
  socialX?: string;
  socialInstagram?: string;
  socialFacebook?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'Footer' });
  const headerT = await getTranslations({ locale, namespace: 'Header' });

  return (
    <footer className="border-t bg-slate-950 text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CarFront className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Gsirigo
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{t('tagline')}</p>
          <p className="text-xs leading-relaxed text-slate-500">{t('partnerNote')}</p>
        </div>

        {/* Quick links */}
        <nav aria-label={t('quickLinks')}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            {t('quickLinks')}
          </h3>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-teal-300">
                  {headerT(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Partners */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            {t('partners')}
          </h3>
          <ul className="space-y-2.5 text-sm">
            {PARTNER_LIST.map((p) => (
              <li key={p.id}>
                <a
                  href={p.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-teal-300"
                >
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            {t('legal')}
          </h3>
          <ul className="space-y-2.5 text-sm">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-teal-300">
                  {t(`legalLinks.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>

          <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-white">
            {t('social')}
          </h3>
          <div className="flex gap-3">
            <a
              href={socialX ?? siteConfig.social.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 transition-colors hover:bg-primary"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href={socialInstagram ?? siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 transition-colors hover:bg-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={socialFacebook ?? siteConfig.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 transition-colors hover:bg-primary"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Affiliate disclosure + copyright */}
      <div className="border-t border-slate-800">
        <div className="container-page space-y-3 py-6 text-center text-xs text-slate-500">
          <p>{disclosure ?? t('affiliateDisclosure')}</p>
          <p>
            © {new Date().getFullYear()} Gsirigo · {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}