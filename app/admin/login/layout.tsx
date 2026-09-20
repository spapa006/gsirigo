import '../../globals.css';

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
        {children}
      </body>
    </html>
  );
}