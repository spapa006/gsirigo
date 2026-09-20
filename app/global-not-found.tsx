import './globals.css';

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
};

// Rendered when a request is not matched by the next-intl proxy at all
// (e.g. a file with a dot or an API-like pathname). The localized 404 lives
// in app/[locale]/not-found.tsx.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            404
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Page not found
          </h1>
          <p className="max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </main>
      </body>
    </html>
  );
}