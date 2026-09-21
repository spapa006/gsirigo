import Link from 'next/link';
import { cn } from '@/lib/utils';

const LOCALES = [
  { id: 'en', label: 'EN — English' },
  { id: 'fr', label: 'FR — Français' },
  { id: 'es', label: 'ES — Español' },
  { id: 'ar', label: 'AR — العربية' },
] as const;

export function LocaleTabs({
  locale,
  baseHref,
}: {
  /** Active locale id */
  locale: string;
  /** e.g. /admin/articles/my-slug */
  baseHref: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LOCALES.map((l) => {
        const active = locale === l.id;
        return (
          <Link
            key={l.id}
            href={`${baseHref}?locale=${l.id}`}
            className={cn(
              'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}