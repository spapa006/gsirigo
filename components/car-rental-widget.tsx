'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { PARTNERS, type PartnerId, getAffiliateLink } from '@/lib/partners';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';

export type WidgetVariant = 'full' | 'mini';

export type CarRentalWidgetProps = {
  /** Which Travelpayouts car rental partner powers this widget */
  partner?: PartnerId;
  /** Pre-filled city/pickup location (already localized by the caller) */
  destination?: string;
  country?: string;
  variant?: WidgetVariant;
  className?: string;
  /** Real Travelpayouts embed snippet (loaded from the DB via WidgetHost) */
  embed?: string;
  /** Travelpayouts attribution overrides from partner/settings DB rows */
  marker?: string;
  subId?: string;
  /** When set, the search button routes through /go/<slug> (cloaked link) */
  redirectSlug?: string;
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const DRIVER_AGES = Array.from({ length: 54 }, (_, i) => i + 18);

/**
 * Reusable Travelpayouts car-rental search widget.
 *
 * Right now this renders a high-conversion *mock* search form that opens the
 * partner site with Travelpayouts attribution params. At integration time,
 * paste the real widget snippet (from your Travelpayouts dashboard) into the
 * `embed` field of the partner in lib/partners.ts — this component then
 * renders that snippet verbatim and the mock form disappears.
 */
export function CarRentalWidget({
  partner = 'rentalcars',
  destination,
  country,
  variant = 'full',
  className,
  embed,
  marker,
  subId,
  redirectSlug,
}: CarRentalWidgetProps) {
  const locale = useLocale();
  const t = useTranslations('Widget');

  const config = PARTNERS[partner];
  const [pickup, setPickup] = useState(destination ?? '');
  const [checkIn, setCheckIn] = useState(() => toDateInputValue(addDays(3)));
  const [checkOut, setCheckOut] = useState(() => toDateInputValue(addDays(10)));
  const [driverAge, setDriverAge] = useState('30');

  // Real Travelpayouts embed takes over when configured (DB row via WidgetHost).
  if (embed) {
    return (
      <div
        className={cn(
          'widget-embed overflow-hidden rounded-xl border bg-white',
          className
        )}
        data-partner={partner}
        data-locale={locale}
        dangerouslySetInnerHTML={{ __html: embed }}
      />
    );
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Cloaked affiliate link: /go/<slug> tracks the click and 302s to the
    // real Travelpayouts URL (standard way outbound affiliate links are issued).
    if (redirectSlug) {
      // Locale rides along as ?loc= so /go/[slug] records the article's
      // locale even when the referrer is stripped (direct entry, Safari
      // noopener quirks, in-app browsers).
      window.open(`/go/${redirectSlug}?loc=${locale}`, '_blank', 'noopener');
      return;
    }
    // Fallback: deep-open the partner site with attribution params.
    window.open(
      getAffiliateLink(partner, pickup.trim() || undefined, { marker, subId }),
      '_blank',
      'noopener'
    );
  }

  const sharedInner = (
    <>
      <div className="relative">
        <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder={t('cityPlaceholder')}
          className="ps-9"
          aria-label={t('pickup')}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('pickupDate')}
          </label>
          <Input
            type="date"
            value={checkIn}
            min={toDateInputValue(new Date())}
            onChange={(e) => setCheckIn(e.target.value)}
            aria-label={t('pickupDate')}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('dropoffDate')}
          </label>
          <Input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            aria-label={t('dropoffDate')}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {t('driverAge')}
        </label>
        <NativeSelect
          value={driverAge}
          onChange={(e) => setDriverAge(e.target.value)}
          aria-label={t('driverAge')}
        >
          {DRIVER_AGES.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </NativeSelect>
      </div>
    </>
  );

  if (variant === 'mini') {
    return (
      <form
        onSubmit={handleSearch}
        className={cn('space-y-3 rounded-xl border bg-white p-4', className)}
      >
        {sharedInner}
        <Button type="submit" className="w-full" size="sm">
          {t('search')}
          <ExternalLink />
        </Button>
      </form>
    );
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/60 bg-white p-5 shadow-soft sm:p-6',
        className
      )}
    >
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">{t('searchTitle')}</h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {t('poweredBy')}
            <span className="font-semibold text-foreground">{config.name}</span>
          </span>
        </div>
        {sharedInner}
        <Button type="submit" size="lg" className="w-full">
          {t('search')}
          <ExternalLink />
        </Button>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t('note')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-primary" />
            {country ?? config.tagline}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-4 w-4 text-primary" />
            {t('disclosure')}
          </span>
        </div>
      </form>
    </section>
  );
}