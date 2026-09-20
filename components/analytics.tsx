'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

/**
 * Google Analytics 4 — loads only when a GA4 measurement id is configured
 * (during build via NEXT_PUBLIC_GA_ID, or at runtime via the admin Settings
 * database row which overrides it).
 */
export function Analytics({ gaId }: { gaId?: string }) {
  const pathname = usePathname();
  const id = gaId ?? process.env.NEXT_PUBLIC_GA_ID;

  if (!id) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { page_path: '${pathname}' });
        `}
      </Script>
    </>
  );
}