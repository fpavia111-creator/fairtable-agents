import { readFileSync } from 'node:fs';
import { tableAgent, RECIPE_FIELDS, INVOICE_LINE_FIELDS, INVOICE_LINE_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { recipeCosts, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  recipes: { type: 'string', description: 'Recipes under --root: one row per menu item and ingredient with quantity, unit, optional yield %, menu price and category' },
  invoices: { type: 'string', description: 'Invoice lines (MarginEdge, R365, xtraCHEF, Sysco or US Foods export) with pack size and case price; the latest price per item is used' },
};
export const DEMO = { title: 'Banana of Recipe Costs', files: { recipes: 'recipes.csv', invoices: 'invoices.csv', settings: 'settings.json' }, explain: { arg: 'recipe', value: 'Steak Frites' }, draft: { location: 'Main Street (fictional)' } };

export const manifest = tableAgent({
  pkg, prefix: 'banana',
  description: 'Costs every recipe at the latest invoice prices (pack sizes, units, yields), shows each plate\'s food cost % against the target, the menu price that would meet it, and which plates got dearer since the earliest price. Writes a worklist and a menu price proposal draft. Never changes prices in the POS.',
  check: { title: 'Recipe costs at latest invoice prices', description: 'Cost every recipe from its ingredients at the latest invoice price per unit, read through the pack size ("6/5 LB") and the yield. Flags plates over the food cost target, plates whose cost rose, ingredients with no price or a unit that cannot be converted, and recipes with no menu price.' },
  args: files, required: ['recipes', 'invoices'],
  sources: {
    recipes: { label: 'Recipes', args: ['recipes'], fields: RECIPE_FIELDS },
    invoices: { label: 'Invoice lines', args: ['invoices'], fields: INVOICE_LINE_FIELDS, profiles: INVOICE_LINE_PROFILES },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    target_food_cost_pct: { type: 'number', minimum: 1, maximum: 100, description: 'Food cost target % (default 30)' },
    category_targets: { type: 'object', additionalProperties: { type: 'number' }, description: 'Targets by menu category, e.g. {"Entrees": 32}' },
    flag_points: { type: 'number', minimum: 0, description: 'Flag a plate this many points over its target (default 3)' },
    rise_pct: { type: 'number', minimum: 0, description: 'Watch a plate whose cost rose at least this % (default 8)' },
    price_step: { type: 'number', minimum: 0.01, description: 'Round the price at target up to this step (default 0.25)' },
  } } },
  run: ({ rows, settings }) => recipeCosts(rows, settings),
  key: { arg: 'recipe', field: 'recipe', label: 'recipe' },
  summary: (o) => `${o.totals.recipes} recipe(s) costed at the latest invoice prices; average food cost ${o.totals.average_food_cost_pct ?? 'n/a'}%. ${o.items.filter((i) => i.status === 'flag').length} over target, ${o.items.filter((i) => i.status === 'review').length} need review, ${o.items.filter((i) => i.findings.some((f) => f.code === 'cost_rose')).length} got dearer.`,
  report: {
    title: 'Recipe costs at latest invoice prices', base: 'banana-recipe-costs',
    row: (i) => ({ recipe: i.recipe, category: i.category ?? '', menu_price: i.menu_price ?? '', plate_cost: i.plate_cost ?? '', food_cost_pct: i.food_cost_pct ?? '', target_pct: i.target_pct ?? '', price_at_target: i.price_at_target ?? '', earliest_plate_cost: i.earliest_plate_cost ?? '', cost_change_pct: i.cost_change_pct ?? '' }),
    htmlColumns: ['recipe', 'menu_price', 'plate_cost', 'food_cost_pct', 'target_pct', 'price_at_target'],
    sections: (o) => [{ title: 'By category', rows: [...new Set(o.items.map((i) => i.category))].sort().map((c) => { const l = o.items.filter((i) => i.category === c && i.food_cost_pct !== null); return { category: c || '(none)', count: l.length, food_cost_pct: l.length ? round(l.reduce((t, i) => t + i.food_cost_pct, 0) / l.length) : '' }; }), columns: ['category', 'count', 'food_cost_pct'] }],
  },
  draft: {
    noun: 'price_proposal', verb: 'approve', category: 'go_live', actor: 'the owner',
    description: 'Write drafts/price_proposal-<location>.md: the plates over target with their plate cost, current price and the price at target, for the owner to decide. Marked DRAFT; approving it records the decision; a manager changes prices in the POS.',
    args: { location: { type: 'string', description: 'Restaurant name for the heading' }, to: { type: 'string', description: 'Who decides (owner)' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const over = o.items.filter((i) => i.findings.some((f) => f.code === 'over_target' || f.code === 'near_target')).sort((x, y) => y.food_cost_pct - x.food_cost_pct);
      return { id: a.location || 'restaurant', to: a.to, text: letter({ title: `Menu price proposal${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Plates over the food cost target at the latest invoice prices',
        intro: 'At the latest invoice prices these plates cost more than our target share of their menu price. For each: keep the price and accept the margin, change the recipe, or change the price.',
        rows: over.map((i) => ({ plate: i.recipe, plate_cost: money(i.plate_cost), price: money(i.menu_price), food_cost: `${i.food_cost_pct}%`, target: `${i.target_pct}%`, price_at_target: money(i.price_at_target) })), columns: ['plate', 'plate_cost', 'price', 'food_cost', 'target', 'price_at_target'],
        closing: ['Decision for each plate: [TO CONFIRM: keep / re-cost / reprice]'] }) };
    },
  },
  refused: [REFUSE.pos, REFUSE.order, REFUSE.email],
  memory: { kind: 'item_alias', description: 'An invoice name for a recipe ingredient, e.g. {"name": "BEEF GRND 80/20 FRSH", "means": "Ground Beef 80/20"}.', effect: 'reads that invoice name as the ingredient, so the recipe is costed at its price', fields: { invoices: ['item'], recipes: ['ingredient'] } },
});
function round(n) { return Math.round(n * 10) / 10; }
