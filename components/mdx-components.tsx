import type { ComponentProps } from 'react';
import {
  CarRentalWidget,
  type CarRentalWidgetProps,
} from '@/components/car-rental-widget';

export type WidgetMdxProps = {
  partner?: string;
  city?: string;
  country?: string;
  variant?: 'full' | 'mini';
};

/**
 * Component map used when rendering MDX content (articles + legal pages).
 *
 * `<Widget partner="rentalcars" city="Barcelona" country="Spain"/>` inside
 * an article renders a contextual <CarRentalWidget/> pre-filled with that
 * destination — the main affiliate conversion element of each article.
 */
export function mdxComponents(
  overrides: {
    Widget?: (props: WidgetMdxProps) => React.ReactNode;
  } = {}
) {
  return {
    Widget: (props: WidgetMdxProps) =>
      overrides.Widget ? (
        overrides.Widget(props)
      ) : (
        <CarRentalWidget
          className="my-6 not-prose"
          partner={(props.partner ?? 'rentalcars') as CarRentalWidgetProps['partner']}
          destination={props.city}
          country={props.country}
          variant={props.variant ?? 'full'}
        />
      ),
  };
}

export type MdxComponentProps = ComponentProps<'div'>;