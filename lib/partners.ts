/**
 * Travelpayouts car rental partner programs.
 *
 * ⚠️ IMPORTANT — before going live:
 * Every program has its own commission structure and widget/embed code that
 * change over time. Log into your Travelpayouts dashboard, open each program
 * (Rentalcars.com, AutoEurope, EconomyBookings), copy the CURRENT embed
 * snippet for your account and paste it into the `embed` field below.
 *
 * When `embed` is non-empty, <CarRentalWidget/> renders that snippet directly
 * (typically a <script> tag). Until then it renders the built-in mock search
 * form that links out to `affiliateLink`.
 */

export type PartnerId = 'rentalcars' | 'autoeurope' | 'economybookings';

export type PartnerConfig = {
  id: PartnerId;
  name: string;
  /** Short name used in the trust strip */
  shortName: string;
  tagline: string;
  baseUrl: string;
  /** Brand accent used for small UI accents */
  color: string;
  commissionNote: string;
  /** Paste the real Travelpayouts embed snippet here at integration time. */
  embed: string;
};

export const PARTNERS: Record<PartnerId, PartnerConfig> = {
  rentalcars: {
    id: 'rentalcars',
    name: 'Rentalcars.com',
    shortName: 'Rentalcars',
    tagline: 'Global inventory from 900+ suppliers',
    baseUrl: 'https://www.rentalcars.com',
    color: '#1d4ed8',
    commissionNote: 'Per-booking commission on worldwide inventory',
    embed: '', // TODO: insert Travelpayouts Rentalcars.com widget script here
  },
  autoeurope: {
    id: 'autoeurope',
    name: 'Auto Europe',
    shortName: 'AutoEurope',
    tagline: 'Specialist in Europe & worldwide long-term rentals',
    baseUrl: 'https://www.autoeurope.com',
    color: '#b91c1c',
    commissionNote: 'Commission on daily, weekly and long-term rentals',
    embed: '', // TODO: insert Travelpayouts AutoEurope widget script here
  },
  economybookings: {
    id: 'economybookings',
    name: 'EconomyBookings',
    shortName: 'EconomyBookings',
    tagline: 'Budget-focused inventory across 30,000+ locations',
    baseUrl: 'https://www.economybookings.com',
    color: '#0f766e',
    commissionNote: 'Per-booking commission on budget vehicles',
    embed: '', // TODO: insert Travelpayouts EconomyBookings widget script here
  },
};

export const PARTNER_LIST = Object.values(PARTNERS);

/**
 * Builds a partner link with the Travelpayouts attribution marker / sub_id.
 * `marker`/`subId` override the environment defaults (used by the admin
 * partners & settings DB tables when present). Verify the exact query
 * parameter names in your dashboard before launch.
 */
export function getAffiliateLink(
  partnerId: PartnerId,
  city?: string,
  overrides?: { marker?: string | null; subId?: string | null }
): string {
  const p = PARTNERS[partnerId];
  const url = new URL(p.baseUrl);
  const marker =
    overrides?.marker?.trim() ||
    process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER?.trim();
  const subId =
    overrides?.subId?.trim() ||
    process.env.NEXT_PUBLIC_TRAVELPAYOUTS_SUB_ID?.trim();
  if (marker) url.searchParams.set('aff', marker);
  if (subId) url.searchParams.set('sub_id', subId);
  if (city) url.searchParams.set('pickup', city);
  return url.toString();
}