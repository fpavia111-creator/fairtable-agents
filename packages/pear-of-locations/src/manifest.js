import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, money } from 'fairtable-core';
import { locations, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const LOCATION_FIELDS = {
  location: t(['Location', 'Store', 'Restaurant', 'Unit'], { required: true }),
  period: t(['Period', 'Month', 'Week']),
  net_sales: t(['Net Sales', 'Sales', 'Revenue'], { type: 'money' }),
  food_cost: t(['Food Cost', 'Food COGS'], { type: 'money' }),
  beverage_cost: t(['Beverage Cost', 'Bev Cost', 'Liquor Cost'], { type: 'money' }),
  labor_cost: t(['Labor Cost', 'Labor', 'Payroll'], { type: 'money' }),
  voids: t(['Voids', 'Void Amount'], { type: 'money' }),
  comps: t(['Comps', 'Comp Amount'], { type: 'money' }),
  discounts: t(['Discounts', 'Discount Amount', 'Promotions'], { type: 'money' }),
  checks: t(['Checks', 'Check Count', 'Tickets', 'Orders'], { type: 'number' }),
};
const files = { locations: { type: 'string', description: 'One row per location (and period) under --root, from your POS and back-office reports: net sales, food cost, beverage cost, labor, voids, comps, discounts, check count' } };
export const DEMO = { title: 'Pear of Locations', files: { locations: 'locations.csv', settings: 'settings.json' }, explain: { arg: 'location', value: 'Uptown' }, draft: {} };

export const manifest = tableAgent({
  pkg, prefix: 'pear',
  description: 'Compares every location of a multi-unit group on the same measures (food and beverage cost, labor, prime cost, voids, comps, discounts as a share of sales, and average check) against the group median, and shows which location is out of line on what. Writes a worklist and a memo draft for the operations lead. Never changes anything at a location.',
  check: { title: 'Location comparison', description: 'Work out each location\'s shares of sales and average check, take the group median of each, and flag locations over the median by more than the points in the settings; watch a much lower average check.' },
  args: files, required: ['locations'],
  sources: { locations: { label: 'Location measures', args: ['locations'], fields: LOCATION_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    points: { type: 'object', additionalProperties: { type: 'number' }, description: 'Points over the group median that count, per measure: food_pct, labor_pct, prime_pct, void_pct, comp_pct, discount_pct' },
    avg_check_drop_pct: { type: 'number', minimum: 0, description: 'Watch an average check this % under the group median (default 15)' },
  } } },
  run: ({ rows, settings }) => locations(rows, settings),
  key: { arg: 'location', field: 'location', label: 'location' },
  summary: (o) => `${o.totals.locations} location(s), group sales ${money(o.totals.group_sales)}; group median prime cost ${o.extra.group_median.prime_pct ?? 'n/a'}%. ${o.items.filter((i) => i.status === 'flag').length} location(s) flagged, ${o.items.filter((i) => i.status === 'watch').length} watched.`,
  report: {
    title: 'Location comparison', base: 'pear-locations',
    row: (i) => ({ location: i.location ?? '', net_sales: i.net_sales ?? '', food_pct: i.food_pct ?? '', labor_pct: i.labor_pct ?? '', prime_pct: i.prime_pct ?? '', void_pct: i.void_pct ?? '', comp_pct: i.comp_pct ?? '', discount_pct: i.discount_pct ?? '', avg_check: i.avg_check ?? '' }),
    htmlColumns: ['location', 'net_sales', 'food_pct', 'labor_pct', 'prime_pct', 'void_pct', 'avg_check'],
    sections: (o) => [{ title: 'By location', rows: [{ location: 'Group median', ...o.extra.group_median }], columns: ['location', 'food_pct', 'labor_pct', 'prime_pct', 'void_pct', 'comp_pct', 'discount_pct', 'avg_check'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the owner',
    description: 'Write drafts/memo-locations.md: each location out of line, on which measure and by how much, for the operations lead to take up with the managers. Marked DRAFT.',
    args: { to: { type: 'string', description: 'Operations lead or area manager' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: 'locations', to: a.to, text: letter({ title: 'Locations against the group', to: a.to, from: a.from, re: 'Where each location is out of line',
      intro: `Group median: food and beverage ${o.extra.group_median.food_pct}%, labor ${o.extra.group_median.labor_pct}%, prime ${o.extra.group_median.prime_pct}%, voids ${o.extra.group_median.void_pct}%, average check ${o.extra.group_median.avg_check}.`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ location: i.location, sales: money(i.net_sales), out_of_line: i.findings.map((f) => f.code.replace(/_high|_low/, '')).join(', ') })), columns: ['location', 'sales', 'out_of_line'],
      closing: ['Follow-up meetings set with each manager: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.ledger, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name a report uses for a location, e.g. {"name": "Store 002", "means": "Harbor Road"}.', effect: 'reads that name as the location, so its rows are added together', fields: { locations: ['location'] } },
});
