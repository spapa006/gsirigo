export const siteConfig = {
  name: 'Gsirigo',
  email: 'hello@gsirigo.com',
  launchedYear: 2026,
  social: {
    x: 'https://x.com/gsirigo',
    instagram: 'https://instagram.com/gsirigo',
    facebook: 'https://facebook.com/gsirigo',
  },
};

export function siteUrl(path = ''): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gsirigo.com';
  return `${base}${path}`;
}