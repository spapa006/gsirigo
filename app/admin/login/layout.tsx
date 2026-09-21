import '../../globals.css';
import Script from 'next/script';

/**
 * Travelpayouts Drive tracking — loaded in <head> (beforeInteractive) to match
 * the "every page" placement requirement.
 */
const DRIVE_SNIPPET = `(function () {
  var script = document.createElement("script");
  script.async = 1;
  script.setAttribute("data-cmp-ab","2");
  script.src = 'https://tp-em.com/NTc2Mzk1.js?t=576395';
  document.head.appendChild(script);
})();`;

/**
 * Self-contained layout for the public login page. It owns <html>/<body> and
 * deliberately has NO session guard — everything else under /admin lives in
 * app/admin/(dashboard) which is guarded.
 */
export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Script
          id="tp-drive"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: DRIVE_SNIPPET }}
        />
        {children}
      </body>
    </html>
  );
}