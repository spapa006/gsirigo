import { createHash, createHmac } from 'node:crypto';
import { UAParser } from 'ua-parser-js';

/**
 * Build a detailed click event from an incoming redirect request.
 *
 * Everything here is pure header parsing — synchronous, no I/O — so the /go
 * route can build the event before issuing the 302 without adding latency.
 * The actual DB write happens later in an `after()` background task.
 *
 * Privacy rules enforced:
 *  - Raw client IPs are NEVER stored; only a (peppered) SHA-256 hash.
 *  - The IP hash is HMAC-SHA256 keyed with AUTH_SECRET when available so the
 *    stored digest cannot be brute-forced back to an IP from a leaked DB
 *    dump; falls back to plain SHA-256 if no secret is configured.
 */

const SITE_LOCALES = ['en', 'fr', 'es', 'ar'];

/** Payload stored in redirect_clicks. */
export type ClickEvent = {
  ipHash: string | null;
  country: string | null;
  city: string | null;
  deviceType: 'mobile' | 'desktop' | 'tablet' | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  locale: string | null;
  isBot: boolean;
  userAgent: string | null;
};

/** Known bots / crawlers / headless fetchers (case-insensitive). */
const BOT_PATTERNS: RegExp[] = [
  // Search engines & crawlers
  /googlebot/i,
  /bingbot/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /baiduspider/i,
  /yandex(?:bot|images)?\b/i,
  /duckduckbot/i,
  /twitterbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /whatsapp\/|\bwhatsapp\b/i,
  /telegrambot/i,
  /petalbot/i,
  /bytespider/i,
  /ccbot/i,
  /gptbot|chatgpt\b/i,
  /claudebot|anthropic/i,
  /amazonbot/i,
  /applebot/i,
  /ia_archiver/i,
  /sogou/i,
  /exabot/i,
  /mj12bot/i,
  /dotbot/i,
  // Generic crawler/robot markers
  /\bcrawler\b|\bspider\b|\bslurp\b|\bbot\b/i,
  // Headless browsers & scraping tools
  /headlesschrome/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /python-requests/i,
  /python-urllib/i,
  /go-http-client/i,
  /\baxios\b/i,
  /node-fetch/i,
  /okhttp/i,
  /libwww-perl|\blwp-?\d/i,
  /\bcurl\/?/i,
  /wget(\/| )/i,
  /scrapy/i,
  /\bjava\/8|jersey|apache-httpclient/i,
  // Monitoring / uptime checks
  /pingdom/i,
  /uptimerobot/i,
  /statuscake/i,
  /newrelic|synthetics/i,
  /lighthouse/i,
];

function isBotUa(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/** Peppered SHA-256 / HMAC of the client IP, or null when no IP is visible. */
export function hashIp(rawIp: string | null | undefined): string | null {
  const ip = rawIp?.trim();
  if (!ip) return null;
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) {
    return createHmac('sha256', secret).update(ip).digest('hex');
  }
  return createHash('sha256').update(ip).digest('hex');
}

/** First client IP from the standard proxy chain headers. */
export function extractIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || null;
}

/**
 * Same-site referrers collapse to their pathname (e.g. /ar/articles/x) so the
 * "which page drove the click" breakdown groups cleanly; external referrers
 * keep host + path. Null for direct traffic or unparsable referrers.
 */
export function normalizeReferrer(
  rawReferrer: string | null | undefined,
  requestHost: string | null
): string | null {
  if (!rawReferrer) return null;
  try {
    const url = new URL(rawReferrer);
    if (!url.hostname) return null;
    const isSameHost =
      requestHost?.toLowerCase() === url.host.toLowerCase() ||
      requestHost?.toLowerCase() === url.hostname.toLowerCase();
    return isSameHost ? url.pathname : `${url.host}${url.pathname}`;
  } catch {
    return null;
  }
}

/**
 * Determine the site locale at click time:
 *  1. referrer path prefix (/ar/... → ar)
 *  2. NEXT_LOCALE cookie (set by next-intl when the user switches locale)
 */
export function resolveLocale(
  referrer: string | null,
  cookieHeader: string | null
): string | null {
  if (referrer && referrer.startsWith('/')) {
    const segment = referrer.split('/')[1];
    if (SITE_LOCALES.includes(segment)) return segment;
  }
  if (cookieHeader) {
    const match = /(?:^|;\s*)NEXT_LOCALE=([a-z]{2})/i.exec(cookieHeader);
    const cookieLocale = match?.[1];
    if (cookieLocale && SITE_LOCALES.includes(cookieLocale)) return cookieLocale;
  }
  return null;
}

const UA_TRUNCATE = 512;

/** Parse a User-Agent string into a ClickEvent. */
export function parseUserAgent(userAgent: string | null): {
  deviceType: ClickEvent['deviceType'];
  browser: string | null;
  os: string | null;
} {
  if (!userAgent) return { deviceType: null, browser: null, os: null };
  const result = UAParser(userAgent);
  const deviceType =
    result.device.type === 'mobile'
      ? 'mobile'
      : result.device.type === 'tablet'
        ? 'tablet'
        : 'desktop';
  return {
    deviceType,
    browser: result.browser?.name || null,
    os: result.os?.name || null,
  };
}

/** Build the full ClickEvent from a redirect request. */
export function buildClickEvent(request: Request): ClickEvent {
  const userAgent = request.headers.get('user-agent')?.slice(0, UA_TRUNCATE) || null;
  const rawReferrer = request.headers.get('referer');
  const requestHost = request.headers.get('host');
  const geoCountry = request.headers.get('x-vercel-ip-country')?.trim() || null;
  const rawCity = request.headers.get('x-vercel-ip-city')?.trim() || null;

  // Vercel URL-encodes the city header (e.g. "M%C3%BCnchen").
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }

  const referrer = normalizeReferrer(rawReferrer, requestHost);
  const parsed = parseUserAgent(userAgent);

  return {
    ipHash: hashIp(extractIp(request)),
    country: geoCountry || null,
    city: city || null,
    deviceType: parsed.deviceType,
    browser: parsed.browser,
    os: parsed.os,
    referrer,
    locale: resolveLocale(referrer, request.headers.get('cookie')),
    isBot: isBotUa(userAgent),
    userAgent,
  };
}