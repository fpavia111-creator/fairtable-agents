import { readFileSync } from 'node:fs';
import { tableAgent, ITEM_SALES_FIELDS, ITEM_SALES_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { stockouts, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const EIGHTY_SIX_FIELDS = {
  date: t(['Date', 'Business Date', 'Day'], { type: 'date' }),
  location: t(['Location', 'Store', 'Restaurant']),
  item: t(['Item', 'Menu Item', 'Product', '86 Item'], { required: true }),
  out_at: t(['Out At', '86 Time', 'Time Out', 'Out', 'Stocked Out']),
  back_at: t(['Back At', 'Back', 'Time Back', 'Restocked', 'Un-86 Time']),
  reason: t(['Reason', 'Note', 'Why']),
};
const files = {
  eighty_six: { type: 'string', description: '86 log or out-of-stock export under --root: date, item, time it went out, time it came back, reason' },
  sales: { type: 'string', description: 'POS item sales for the same period (date, item, quantity, net sales) for the lost-sales estimate' },
};
export const DEMO = { title: 'Fairtable Stockouts', files: { eighty_six: 'eighty_six.csv', sales: 'sales.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Short Rib' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'stockouts',
  description: 'Reads the 86 log against item sales: items that run out again and again, how long they stay off, an estimate of the sales lost, items 86ed before the dinner rush and items with no time back. Writes a worklist and a par-and-prep memo draft for the kitchen. Never changes 86 status, pars or orders.',
  check: { title: 'Items 86ed and stockouts', description: 'Count each item\'s 86 events and hours off, estimate lost sales from its average sales per open hour, and flag repeated and long outages, outages before the peak and items never brought back.' },
  args: files, required: ['eighty_six'],
  sources: {
    eighty_six: { label: '86 log', args: ['eighty_six'], fields: EIGHTY_SIX_FIELDS },
    sales: { label: 'POS item sales', args: ['sales'], fields: ITEM_SALES_FIELDS, profiles: ITEM_SALES_PROFILES },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    open_hours_per_day: { type: 'number', minimum: 1, maximum: 24, description: 'Hours open per day, for sales per hour (default 11)' },
    close_time: { type: 'string', description: 'Closing time, used when an item has no time back (default 22:00)' },
    peak_start: { type: 'string', description: 'Start of the rush; running out before it is watched (default 18:00)' },
    repeat_count: { type: 'integer', minimum: 2, description: '86 events in the period that count as repeated (default 3)' },
    long_hours: { type: 'number', minimum: 0, description: 'Hours off that count as a long outage (default 3)' },
  } } },
  run: ({ rows, settings }) => stockouts(rows, settings),
  key: { arg: 'item', field: 'item', label: 'menu item' },
  summary: (o) => `${o.totals.events} 86 event(s) on ${o.totals.items_86ed} item(s), ${o.totals.hours_out} hours off; lost sales estimate ${money(o.totals.lost_sales_estimate)}. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Items 86ed and stockouts', base: 'stockouts',
    row: (i) => ({ item: i.item ?? '', times_86: i.times_86 ?? '', hours_out: i.hours_out ?? '', sales_per_open_hour: i.sales_per_open_hour ?? '', lost_sales_estimate: i.lost_sales_estimate ?? '' }),
    htmlColumns: ['item', 'times_86', 'hours_out', 'lost_sales_estimate'],
    sections: (o) => [{ title: 'By item', rows: o.items.map((i) => ({ item: i.item, count: i.times_86, hours: i.hours_out })), columns: ['item', 'count', 'hours'] }],
    limits: ['Reads only the files you give it; it does not log in to the POS or change 86 status.', 'Lost sales are an estimate (average sales per open hour x hours off); demand is not even through the day.', 'Not advice. The chef decides pars and prep.'],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/memo-<location>.md: the items that keep running out, when and for how long, for the chef to raise pars or prep. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Chef or kitchen manager' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, amount: o.totals.lost_sales_estimate, text: letter({ title: `86 board review${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Items that keep running out',
      intro: `${o.totals.events} 86 events this period, ${o.totals.hours_out} hours off, roughly ${money(o.totals.lost_sales_estimate)} in sales lost (an estimate).`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ item: i.item, times: i.times_86, hours_off: i.hours_out, lost_estimate: money(i.lost_sales_estimate), issue: i.findings.map((f) => f.code).join(' ') })), columns: ['item', 'times', 'hours_off', 'lost_estimate', 'issue'],
      closing: ['New pars or prep amounts: [TO CONFIRM with the chef]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.order, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name the 86 board uses for a POS item, e.g. {"name": "shortrib", "means": "Short Rib"}.', effect: 'reads that 86 board name as the POS item, so its sales are used', fields: { eighty_six: ['item'] } },
});
