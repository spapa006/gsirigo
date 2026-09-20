import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { getServerSession } from '@/lib/auth/session';
import { AdminNav } from '@/components/admin/admin-nav';
import { LogoutButton } from '@/components/admin/logout-button';
import '../../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Gsirigo Admin',
    template: '%s — Gsirigo Admin',
  },
  robots: { index: false, follow: false },
};

/**
 * Guarded layout for all admin pages except /admin/login. Redirects
 * unauthenticated requests to the login page (defense in depth — the proxy
 * middleware already does this, but layouts re-check server-side).
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect('/admin/login');

  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          <AdminNav />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-6">
              <p className="text-sm text-muted-foreground">
                Signed in as{' '}
                <span className="font-semibold text-foreground">
                  {session.email}
                </span>
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/en"
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  ← View site
                </Link>
                <LogoutButton />
              </div>
            </header>
            <main className="flex-1 p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}