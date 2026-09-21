'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CarFront, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Login failed. Server responded ${res.status}.`);
        return;
      }
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border bg-white p-8 shadow-soft">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-white">
            <CarFront className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight">Gsirigo Admin</h1>
          <p className="text-center text-sm text-muted-foreground">
            Sign in to manage articles, destinations, partners, redirects and
            site settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Email
            </label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            Rate-limited to 5 attempts per 15 minutes. Credentials are stored as
            environment variables.
          </p>
        </form>
      </div>
    </div>
  );
}