'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CarFront, Info, Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { PARTNER_LIST } from '@/lib/partners';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/language-switcher';

const NAV_ITEMS = [
  { href: '/', key: 'home' },
  { href: '/articles', key: 'articles' },
  { href: '/destinations', key: 'destinations' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const;

export function SiteHeader() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50">
      {/* Widget transparency / affiliate disclosure strip */}
      <div className="bg-teal-950 text-teal-50" role="note">
        <div className="container-page flex items-center justify-center gap-2 py-2 text-center text-xs sm:text-sm">
          <Info className="h-4 w-4 shrink-0 text-teal-300" />
          <p className="max-w-4xl">{t('disclosure')}</p>
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Gsirigo">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CarFront className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Gsirigo
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t('menu')}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive(item.href) && 'text-primary'
                )}
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent lg:hidden"
              aria-expanded={open}
              aria-label={open ? t('close') : t('menu')}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {open && (
          <nav className="border-t lg:hidden" aria-label={t('menu')}>
            <div className="container-page flex flex-col py-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-3 text-sm font-medium hover:bg-accent',
                    isActive(item.href) && 'text-primary'
                  )}
                  onClick={() => setOpen(false)}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Optional partner trust row */}
        <div className="hidden border-t bg-secondary/50 md:block">
          <div className="container-page flex items-center justify-center gap-6 py-1.5 text-xs text-muted-foreground">
            <span>{t('trustRow')}</span>
            {PARTNER_LIST.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.shortName}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}