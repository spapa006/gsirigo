import Image from 'next/image';
import { CalendarDays, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Article } from '@/lib/content';

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const { meta } = article;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-soft">
      <Link
        href={`/articles/${article.slug}`}
        className="relative block aspect-[16/9] overflow-hidden"
      >
        <Image
          src={meta.image}
          alt={meta.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {meta.date}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {meta.readingTime}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug">
          <Link
            href={`/articles/${article.slug}`}
            className="transition-colors hover:text-primary"
          >
            {meta.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {meta.excerpt}
        </p>
      </div>
    </article>
  );
}