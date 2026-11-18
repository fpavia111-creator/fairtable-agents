import { readFileSync } from 'node:fs';
import { tableAgent, COUNT_FIELDS, COUNT_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { countVariance, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { counts: { type: 'string', description: 'Inventory count under --root (R365, MarginEdge or a count sheet): item, area, counted quantity, expected (system or theoretical) quantity, unit, unit cost' } };
export const DEMO = { title: 'Cherry of Counts', files: { counts: 'counts.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Heavy Cream' }, draft: { location: 'Main Street' } };
const r2 = (n) => Math.round(n * 100) / 100;

export const manifest = tableAgent({
  pkg, prefix: 'cherry',
  description: 'Compares each item\'s count with the quantity the system expected and prices the difference; picks out counts that look like a unit mistake, missing and negative counts, and writes a recount list draft for the kitchen. Never changes the inventory system.',
  check: { title: 'Inventory count variance', description: 'Count against expected quantity per item, priced at the unit cost. Flags big variances, counts that are a pack multiple of what was expected (likely the wrong unit), missing or negative counts and items with no cost, and adds up the shrink.' },
  args: files, required: ['counts'],
  sources: { counts: { label: 'Inventory count', args: ['counts'], fields: COUNT_FIELDS, profiles: COUNT_PROFILES } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    flag_amount: { type: 'number', minimum: 0, description: 'Flag a variance worth at least this much (default 40)' },
    flag_pct: { type: 'number', minimum: 0, description: '... and at least this % of expected (default 10)' },
    watch_amount: { type: 'number', minimum: 0, description: 'Watch a variance worth at least this much (default 10)' },
    watch_pct: { type: 'number', minimum: 0, description: 'Watch a variance of at least this % (default 5)' },
    unit_factors: { type: 'array', items: { type: 'number' }, description: 'Pack sizes that suggest a unit mistake when a count is that multiple of expected' },
  } } },
  run: ({ rows, settings }) => countVariance(rows, settings),
  key: { arg: 'item', field: 'item', label: 'counted item' },
  summary: (o) => `${o.totals.counted_items} item(s) counted: value ${money(o.totals.counted_value)} against ${money(o.totals.expected_value)} expected (${money(o.totals.variance_value)}), shrink ${money(o.totals.shrink_value)}. ${o.totals.recounts} to recount or fix.`,
  report: {
    title: 'Inventory count variance', base: 'cherry-count-variance',
    row: (i) => ({ location: i.location ?? '', area: i.area ?? '', item: i.item ?? '', unit: i.unit ?? '', counted_qty: i.counted_qty ?? '', expected_qty: i.expected_qty ?? '', variance_qty: i.variance_qty ?? '', variance_pct: i.variance_pct ?? '', unit_cost: i.unit_cost ?? '', variance_cost: i.variance_cost ?? '' }),
    htmlColumns: ['area', 'item', 'unit', 'counted_qty', 'expected_qty', 'variance_pct', 'variance_cost'],
    sections: (o) => [{ title: 'By category', rows: [...new Set(o.items.map((i) => i.area))].sort().map((a) => ({ category: a || '(none)', count: o.items.filter((i) => i.area === a).length, amount: r2(o.items.filter((i) => i.area === a).reduce((t, i) => t + (i.variance_cost || 0), 0)) })), columns: ['category', 'count', 'amount'] }],
  },
  draft: {
    noun: 'recount_list', verb: 'send', actor: 'the kitchen manager',
    description: 'Write drafts/recount_list-<location>.md: the items to recount before the count is closed, grouped by storage area, with what was counted and what was expected. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Restaurant name for the heading' }, to: { type: 'string', description: 'Who recounts (kitchen manager)' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const list = o.items.filter((i) => i.status === 'flag' || i.status === 'review').sort((x, y) => (x.area < y.area ? -1 : x.area > y.area ? 1 : 0));
      return { id: a.location || 'restaurant', to: a.to, text: letter({ title: `Recount list${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Recount before the count is closed',
        intro: 'Please recount these items before we close the count. Write the unit you counted in.',
        rows: list.map((i) => ({ area: i.area, item: i.item, unit: i.unit, counted: i.counted_qty ?? '(blank)', expected: i.expected_qty ?? '', why: i.findings.map((f) => f.code).join(' ') })), columns: ['area', 'item', 'unit', 'counted', 'expected', 'why'],
        closing: ['Recount done by: [TO CONFIRM: name and time]'] }) };
    },
  },
  refused: [REFUSE.ledger, REFUSE.order, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name a count sheet uses for an item, e.g. {"name": "Chx Brst", "means": "Chicken Breast"}.', effect: 'reads that name as the item, so its lines are added together', fields: { counts: ['item'] } },
});
