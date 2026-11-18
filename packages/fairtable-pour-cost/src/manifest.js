import { readFileSync } from 'node:fs';
import { tableAgent, ITEM_SALES_FIELDS, ITEM_SALES_PROFILES, RECIPE_FIELDS, COUNT_FIELDS, COUNT_PROFILES, INVOICE_LINE_FIELDS, INVOICE_LINE_PROFILES, REFUSE, letter, money, pctText } from 'fairtable-core';
import { pours, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const LIQUOR_COUNT_FIELDS = { ...COUNT_FIELDS, size_ml: { aliases: ['Size (ml)', 'Bottle Size', 'Bottle ml', 'ML', 'Size ml'], type: 'number', unit: false } };
const files = {
  sales: { type: 'string', description: 'POS item sales for the bar (drinks sold and net sales) under --root' },
  recipes: { type: 'string', description: 'Drink recipes: drink, spirit, pour quantity and unit (oz, ml, cl)' },
  counts: { type: 'string', description: 'Liquor counts: opening and closing count per bottle in tenths, bottle size in ml, cost per bottle' },
  purchases: { type: 'string', description: 'Optional liquor invoice lines with pack (e.g. 12/750ML) and case price' },
};
export const DEMO = { title: 'Fairtable Pour Cost', files: { sales: 'sales.csv', recipes: 'recipes.csv', counts: 'counts.csv', purchases: 'purchases.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Bourbon' }, draft: { location: 'Main Street bar' } };

export const manifest = tableAgent({
  pkg, prefix: 'pour_cost',
  description: 'Bar pour cost and liquor variance: drinks sold x recipe pours against bottles used (opening count + bottles bought - closing count) per spirit, priced per bottle, with pour cost against the target. Writes a worklist and a memo draft for the bar manager. Never changes the POS.',
  check: { title: 'Bar pour cost and liquor variance', description: 'Per spirit: bottles the recipes say were poured against bottles actually used, priced per bottle; pour cost % against target. Flags over-pouring, spirits used with no drink recipe, drinks sold with no recipe and missing counts.' },
  args: files, required: ['sales', 'recipes', 'counts'],
  sources: {
    sales: { label: 'POS drink sales', args: ['sales'], fields: ITEM_SALES_FIELDS, profiles: ITEM_SALES_PROFILES },
    recipes: { label: 'Drink recipes', args: ['recipes'], fields: RECIPE_FIELDS },
    counts: { label: 'Liquor counts', args: ['counts'], fields: LIQUOR_COUNT_FIELDS, profiles: COUNT_PROFILES },
    purchases: { label: 'Liquor invoice lines', args: ['purchases'], fields: INVOICE_LINE_FIELDS, profiles: INVOICE_LINE_PROFILES },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    flag_amount: { type: 'number', minimum: 0, description: 'Flag a spirit whose gap costs at least this much (default 30)' },
    flag_pct: { type: 'number', minimum: 0, description: '... and is at least this % (default 10)' },
    watch_amount: { type: 'number', minimum: 0, description: 'Watch from this amount (default 10)' },
    watch_pct: { type: 'number', minimum: 0, description: 'Watch from this % (default 5)' },
    target_pour_cost_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Pour cost target % (default 20)' },
    default_bottle_ml: { type: 'number', minimum: 1, description: 'Bottle size when the count does not say (default 750)' },
  } } },
  run: ({ rows, settings }) => pours(rows, settings),
  key: { arg: 'item', field: 'item', label: 'spirit or drink' },
  summary: (o) => `Bar sales ${money(o.totals.bar_sales)}: liquor used ${money(o.totals.liquor_cost_actual)} (pour cost ${pctText(o.totals.pour_cost_pct)}), recipes say ${money(o.totals.liquor_cost_theoretical)} (${pctText(o.totals.theoretical_pour_cost_pct)}); gap ${money(o.totals.variance_cost)}. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Bar pour cost and liquor variance', base: 'pour-cost',
    row: (i) => ({ item: i.item ?? '', kind: i.sub ?? '', bottle_ml: i.bottle_ml ?? '', open: i.open ?? '', bought: i.bought ?? '', close: i.close ?? '', actual_bottles: i.actual_bottles ?? '', theoretical_bottles: i.theoretical_bottles ?? '', variance_pct: i.variance_pct ?? '', variance_cost: i.variance_cost ?? '' }),
    htmlColumns: ['item', 'actual_bottles', 'theoretical_bottles', 'variance_pct', 'variance_cost'],
    sections: (o) => [{ title: 'Totals', rows: [{ bar_sales: o.totals.bar_sales, liquor_used: o.totals.liquor_cost_actual, pour_cost_pct: o.totals.pour_cost_pct, theoretical_pct: o.totals.theoretical_pour_cost_pct, target_pct: o.extra.target_pour_cost_pct }], columns: ['bar_sales', 'liquor_used', 'pour_cost_pct', 'theoretical_pct', 'target_pct'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/memo-<location>.md: pour cost for the period and the spirits poured beyond the recipes, for the bar manager. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Bar or restaurant name' }, to: { type: 'string', description: 'Bar manager' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'bar', to: a.to, amount: o.totals.variance_cost, text: letter({ title: `Pour cost ${o.extra.period.start} to ${o.extra.period.end}${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Spirits poured beyond the recipes',
      intro: `Pour cost was ${pctText(o.totals.pour_cost_pct)} against a ${o.extra.target_pour_cost_pct}% target; the recipes alone would give ${pctText(o.totals.theoretical_pour_cost_pct)}.`,
      rows: o.items.filter((i) => i.variance_cost > 0).sort((x, y) => y.variance_cost - x.variance_cost).map((i) => ({ spirit: i.item, used: i.actual_bottles, pours_say: i.theoretical_bottles, gap: `${i.variance_pct}%`, cost: money(i.variance_cost) })), columns: ['spirit', 'used', 'pours_say', 'gap', 'cost'],
      closing: ['Please check jiggers, comps and drinks rung under the wrong button before the next count. Next count date: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.order, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name for a spirit on invoices or the count sheet, e.g. {"name": "BOURBON WELL 750", "means": "Bourbon"}.', effect: 'reads that name as the spirit in counts, invoices and recipes', fields: { counts: ['item'], purchases: ['item'], recipes: ['ingredient'] } },
});
