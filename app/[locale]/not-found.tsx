import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';

export default function LocaleNotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-7xl font-black text-primary">404</p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        {t('title')}
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t('message')}</p>
      <Link href="/" className={`${buttonVariants({ size: 'lg' })} mt-8`}>
        {t('back')}
      </Link>
    </div>
  );
}