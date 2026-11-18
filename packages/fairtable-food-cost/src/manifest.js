import { readFileSync } from 'node:fs';
import { tableAgent, ITEM_SALES_FIELDS, ITEM_SALES_PROFILES, RECIPE_FIELDS, COUNT_FIELDS, COUNT_PROFILES, INVOICE_LINE_FIELDS, INVOICE_LINE_PROFILES, REFUSE, letter, money, pctText } from 'fairtable-core';
import { foodCost, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  sales: { type: 'string', description: 'POS item sales (product mix) for the period under --root: Toast, Square, Clover, Lightspeed or Revel export, CSV or Excel' },
  recipes: { type: 'string', description: 'Recipes: one row per menu item and ingredient with the portion quantity, unit and optional yield %' },
  counts: { type: 'string', description: 'Inventory counts: the opening and the closing count of the period (count date, item, quantity, unit, unit cost)' },
  purchases: { type: 'string', description: 'Optional invoice lines received in the period (MarginEdge, R365, xtraCHEF, Sysco or US Foods export)' },
};
const n = (x) => (x === null || x === undefined ? 'n/a' : x);

export const DEMO = { title: 'Fairtable Food Cost', files: { sales: 'sales.csv', recipes: 'recipes.csv', counts: 'counts.csv', purchases: 'purchases.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Chicken Breast' }, draft: { location: 'Main Street (fictional)' } };

export const manifest = tableAgent({
  pkg, prefix: 'food_cost',
  description: 'Actual against theoretical food cost: POS item sales x recipes give what the kitchen should have used; opening count + purchases - closing count gives what it did use. Lists every ingredient used beyond the recipes with the cost of the gap. Writes a worklist and a memo draft. Never changes the POS or recipes, never sends.',
  check: { title: 'Actual against theoretical food cost', description: 'Compare what the recipes say the kitchen used (sales x recipe portions / yield) with what it did use (opening count + purchases - closing count), per ingredient, priced at the latest unit cost. Flags over-usage, under-usage, menu items sold without a recipe, unit mismatches, missing counts and invoice lines that match no ingredient.' },
  args: files, required: ['sales', 'recipes', 'counts'],
  sources: {
    sales: { label: 'POS item sales', args: ['sales'], fields: ITEM_SALES_FIELDS, profiles: ITEM_SALES_PROFILES },
    recipes: { label: 'Recipes', args: ['recipes'], fields: RECIPE_FIELDS },
    counts: { label: 'Inventory counts', args: ['counts'], fields: COUNT_FIELDS, profiles: COUNT_PROFILES },
    purchases: { label: 'Invoice lines', args: ['purchases'], fields: INVOICE_LINE_FIELDS, profiles: INVOICE_LINE_PROFILES },
  },
  settings: {
    defaults: DEFAULTS,
    schema: { type: 'object', additionalProperties: false, properties: {
      flag_amount: { type: 'number', minimum: 0, description: 'Flag an ingredient when its gap costs at least this much (default 50)' },
      flag_pct: { type: 'number', minimum: 0, description: '... and is at least this % of theoretical use (default 10)' },
      watch_amount: { type: 'number', minimum: 0, description: 'Watch an ingredient whose gap costs at least this much (default 25)' },
      watch_pct: { type: 'number', minimum: 0, description: 'Watch an ingredient whose gap is at least this % (default 5)' },
      target_food_cost_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Your food cost target, shown next to the result (default 30)' },
      period_start: { type: ['string', 'null'], description: 'Opening count date (default: the earliest count date)' },
      period_end: { type: ['string', 'null'], description: 'Closing count date (default: the latest count date)' },
    } },
  },
  run: ({ rows, settings }) => foodCost(rows, settings),
  key: { arg: 'item', field: 'item', label: 'ingredient or menu item' },
  summary: (o) => `Period ${n(o.extra.period.start)} to ${n(o.extra.period.end)}: net sales ${money(o.totals.net_sales)}, theoretical food cost ${money(o.totals.theoretical_cost)} (${pctText(o.totals.theoretical_food_cost_pct)}), actual ${money(o.totals.actual_cost)} (${pctText(o.totals.actual_food_cost_pct)}), gap ${money(o.totals.gap_cost)}. ${o.items.filter((i) => i.status === 'flag').length} ingredient(s) flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Actual against theoretical food cost', base: 'food-cost',
    row: (i) => ({ item: i.item, kind: i.kind, unit: i.unit ?? '', open: i.open ?? '', purchased: i.purchased ?? '', close: i.close ?? '', actual_qty: i.actual_qty ?? '', theoretical_qty: i.theoretical_qty ?? '', variance_qty: i.variance_qty ?? '', variance_pct: i.variance_pct ?? '', unit_cost: i.unit_cost ?? '', variance_cost: i.variance_cost ?? '' }),
    htmlColumns: ['item', 'unit', 'actual_qty', 'theoretical_qty', 'variance_pct', 'variance_cost'],
    sections: (o) => [{ title: 'Totals', rows: [{ net_sales: o.totals.net_sales, theoretical_cost: o.totals.theoretical_cost, actual_cost: o.totals.actual_cost, theoretical_pct: o.totals.theoretical_food_cost_pct, actual_pct: o.totals.actual_food_cost_pct, target_pct: o.extra.target_food_cost_pct }], columns: ['net_sales', 'theoretical_cost', 'actual_cost', 'theoretical_pct', 'actual_pct', 'target_pct'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/memo-<location>.md: a short memo to the kitchen manager with the period food cost, the ingredients used beyond the recipes and the gap in money, for a person to review and send. Marked DRAFT; open items are [TO CONFIRM].',
    args: { location: { type: 'string', description: 'Restaurant name for the memo heading' }, to: { type: 'string', description: 'Who receives the memo (kitchen manager)' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const over = o.items.filter((i) => i.variance_cost > 0 && (i.status === 'flag' || i.status === 'watch')).sort((x, y) => y.variance_cost - x.variance_cost);
      return { id: a.location || 'restaurant', to: a.to, amount: o.totals.gap_cost, text: letter({
        title: `Food cost, ${o.extra.period.start} to ${o.extra.period.end}${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Ingredients used beyond the recipes',
        intro: `Actual food cost was ${money(o.totals.actual_cost)} (${pctText(o.totals.actual_food_cost_pct)} of net sales) against a theoretical ${money(o.totals.theoretical_cost)} (${pctText(o.totals.theoretical_food_cost_pct)}); our target is ${o.extra.target_food_cost_pct}%. These ingredients were used beyond what the recipes and the POS sales explain:`,
        rows: over.map((i) => ({ ingredient: i.item, used: `${i.actual_qty} ${i.unit}`, recipes_say: `${i.theoretical_qty} ${i.unit}`, gap: `${i.variance_pct}%`, cost: money(i.variance_cost) })), columns: ['ingredient', 'used', 'recipes_say', 'gap', 'cost'],
        closing: ['Please check portioning, the waste log and the counts for these items before the next count. [TO CONFIRM: date of the next count]'],
      }) };
    },
  },
  refused: [REFUSE.pos, REFUSE.order, REFUSE.email],
  memory: { kind: 'item_alias', description: 'An invoice or count name for an ingredient, e.g. {"name": "LEMON 165CT", "means": "Lemons"}.', effect: 'reads that name as the ingredient in invoices, counts and recipes, so its purchases count toward actual use', fields: { purchases: ['item'], counts: ['item'], recipes: ['ingredient'] } },
});
