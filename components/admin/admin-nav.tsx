'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CarFront, LayoutDashboard, FileText, MapPin, Handshake, ArrowLeftRight, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/articles', label: 'Articles', icon: FileText },
  { href: '/admin/destinations', label: 'Destinations', icon: MapPin },
  { href: '/admin/partners', label: 'Partners', icon: Handshake },
  { href: '/admin/redirects', label: 'Redirects', icon: ArrowLeftRight },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-white">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
          <CarFront className="h-4 w-4" />
        </span>
        <span className="text-base font-extrabold tracking-tight">Gsirigo</span>
        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 text-[11px] leading-relaxed text-slate-400">
        Travelpayouts car-rental affiliate admin. Changes publish instantly via
        on-demand revalidation.
      </div>
    </aside>
  );
}