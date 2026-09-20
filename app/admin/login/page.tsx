import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Login — Gsirigo Admin',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <LoginForm />
    </main>
  );
}