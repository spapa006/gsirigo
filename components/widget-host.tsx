import { getPartner } from '@/lib/db/repositories/partners';
import { getSettings } from '@/lib/db/repositories/settings';
import { CarRentalWidget, type CarRentalWidgetProps } from '@/components/car-rental-widget';

export type WidgetHostProps = CarRentalWidgetProps & {
  /** Locale used to fetch the per-locale partner embed & attribution. */
  locale: string;
};

/**
 * Server-side widget wrapper: loads the partner's Travelpayouts embed and
 * attribution overrides from the database (admin-managed) and feeds them to
 * the client <CarRentalWidget/>. Falls back to static config when the DB has
 * no row for the partner/locale.
 */
export async function WidgetHost({
  locale,
  partner = 'rentalcars',
  redirectSlug,
  ...rest
}: WidgetHostProps) {
  const [partnerRow, settings] = await Promise.all([
    getPartner(partner, locale),
    getSettings(),
  ]);

  const embed =
    partnerRow && partnerRow.active ? partnerRow.embed || '' : '';

  return (
    <CarRentalWidget
      {...rest}
      partner={partner}
      embed={embed}
      marker={partnerRow?.marker || settings.defaultMarker || undefined}
      subId={partnerRow?.subId || settings.defaultSubId || undefined}
      redirectSlug={redirectSlug}
    />
  );
}