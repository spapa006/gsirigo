import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Destination, DestinationLocalized } from '@/lib/destinations';
import { Link } from '@/i18n/navigation';
import { WidgetHost } from '@/components/widget-host';
import { Badge } from '@/components/ui/badge';

type DestinationCardProps = {
  destination: Pick<Destination, 'slug' | 'image'>;
  localized: DestinationLocalized;
  locale: string;
};

export async function DestinationCard({
  destination,
  localized,
  locale,
}: DestinationCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-soft">
      <Link
        href={`/destinations/${destination.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <Image
          src={destination.image}
          alt={localized.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="text-xl font-bold">{localized.name}</h3>
          <p className="text-sm text-white/85">
            {localized.country} · {localized.priceFrom}
          </p>
        </div>
        <Badge className="absolute start-3 top-3 bg-white/90 text-foreground backdrop-blur">
          {localized.tagline}
        </Badge>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <WidgetHost
          variant="mini"
          locale={locale}
          destination={localized.city}
          country={localized.country}
        />
        <div className="mt-auto flex items-center justify-between">
          <p className="line-clamp-2 max-w-[70%] text-xs text-muted-foreground">
            {localized.description}
          </p>
          <Link
            href={`/destinations/${destination.slug}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <span>→</span>
            <span className="sr-only">
              {localized.name} ({locale})
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}