'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Draft contact form — no backend yet. Wire it to a form service,
 * email API or server action before launch.
 */
export function ContactForm() {
  const t = useTranslations('Contact');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <p className="font-semibold">{t('success')}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
      className="grid gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block text-sm font-medium"
          >
            {t('name')}
          </label>
          <Input id="contact-name" name="name" required autoComplete="name" />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block text-sm font-medium"
          >
            {t('email')}
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-sm font-medium"
        >
          {t('message')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit" size="lg" className="justify-self-start">
        <Send />
        {t('send')}
      </Button>
    </form>
  );
}