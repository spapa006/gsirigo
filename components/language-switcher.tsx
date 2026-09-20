'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, localeNames } from '@/i18n/routing';
import { NativeSelect } from '@/components/ui/select';

/**
 * Language switcher. Uses the locale-less pathname from next-intl's
 * navigation helpers, so switching locale keeps the user on the same page.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('Header');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={t('language')}
      data-pending={isPending ? '' : undefined}
    >
      <Languages className="h-4 w-4 shrink-0 text-muted-foreground" />
      <NativeSelect
        value={locale}
        onChange={onSelectChange}
        className="h-9 w-auto min-w-28 border-transparent bg-transparent font-medium shadow-none focus-visible:border-input focus-visible:bg-background"
        aria-label={t('language')}
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}