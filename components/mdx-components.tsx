import type { ComponentProps } from 'react';
import { WidgetHost } from '@/components/widget-host';

export type WidgetMdxProps = {
  partner?: string;
  city?: string;
  country?: string;
  variant?: 'full' | 'mini';
  /** Optional cloaked /go/… redirect slug for the widget CTA */
  redirectSlug?: string;
};

/**
 * Component map used when rendering MDX content (articles + legal pages).
 *
 * `<Widget partner="rentalcars" city="Barcelona" country="Spain"/>` inside
 * an article renders a contextual car-rental widget pre-filled with that
 * destination — the main affiliate conversion element of each article. The
 * embed + attribution params are loaded from the DB by <WidgetHost/>.
 */
export function mdxComponents(
  locale: string,
  overrides: {
    Widget?: (props: WidgetMdxProps) => React.ReactNode;
  } = {}
) {
  return {
    Widget: (props: WidgetMdxProps) =>
      overrides.Widget ? (
        overrides.Widget(props)
      ) : (
        <WidgetHost
          className="my-6 not-prose"
          locale={locale}
          partner={(props.partner ?? 'rentalcars') as 'rentalcars' | 'autoeurope' | 'economybookings'}
          destination={props.city}
          country={props.country}
          variant={props.variant ?? 'full'}
          redirectSlug={props.redirectSlug}
        />
      ),
  };
}

export type MdxComponentProps = ComponentProps<'div'>;