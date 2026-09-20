/**
 * Short reminder of where each Travelpayouts embed lives in the dashboard,
 * shown in the partners admin.
 */
export function widgetEmbedHelp(id: string): string {
  switch (id) {
    case 'autoeurope':
      return 'Travelpayouts → Auto Europe → Widgets';
    case 'economybookings':
      return 'Travelpayouts → EconomyBookings → Widgets';
    default:
      return 'Travelpayouts → Rentalcars.com → Widgets';
  }
}

export const EMBED_PLACEHOLDER = [
  'Paste the embed snippet here, e.g.',
  '<script async src="https://www.travelpayouts.com/..."></script>',
  '<div id="tp-widget-..."></div>',
].join('\n');