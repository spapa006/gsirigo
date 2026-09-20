import { getTranslations } from 'next-intl/server';
import { Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';

type CtaBlockProps = {
  locale: string;
  /** Where the CTA button leads. Defaults to the homepage (search widget). */
  href?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
};

/** Conversion CTA band used at the end of articles and destination pages. */
export async function CtaBlock({
  locale,
  href = '/',
  title,
  description,
  buttonLabel,
}: CtaBlockProps) {
  const t = await getTranslations({ locale, namespace: 'Common' });

  return (
    <section className="not-prose rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground shadow-soft sm:px-10">
      <h2 className="text-2xl font-extrabold sm:text-3xl">
        {title ?? t('ctaTitle')}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/90 sm:text-base">
        {description ?? t('ctaDescription')}
      </p>
      <Link
        href={href}
        className={`${buttonVariants({
          variant: 'secondary',
          size: 'lg',
        })} mt-6`}
      >
        <Search />
        {buttonLabel ?? t('ctaButton')}
      </Link>
    </section>
  );
}