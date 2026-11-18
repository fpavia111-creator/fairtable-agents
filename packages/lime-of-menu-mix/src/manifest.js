import { readFileSync } from 'node:fs';
import { tableAgent, ITEM_SALES_FIELDS, ITEM_SALES_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { menuMix, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const COST_FIELDS = {
  item: { aliases: ['Item', 'Menu Item', 'Recipe', 'Dish'], required: true },
  plate_cost: { aliases: ['Plate Cost', 'Cost', 'Recipe Cost', 'Food Cost', 'Theoretical Cost'], type: 'money' },
};
const files = {
  sales: { type: 'string', description: 'POS item sales (product mix) for the period under --root: item, category, quantity, net sales' },
  costs: { type: 'string', description: 'Plate cost per menu item (from your recipe costing, e.g. the banana-of-recipe-costs report)' },
};
export const DEMO = { title: 'Lime of Menu Mix', files: { sales: 'sales.csv', costs: 'costs.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Steak Frites' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'lime',
  description: 'Menu engineering from POS item sales and plate costs: each item\'s popularity and contribution margin within its category, sorted into stars, plowhorses, puzzles and dogs, with what each usually calls for. Writes a worklist and a menu proposal draft for the owner. Never changes the menu or prices in the POS.',
  check: { title: 'Menu engineering', description: 'For each category: every item\'s share of the count against 70% of an even share, and its contribution margin (average price - plate cost) against the category\'s weighted average. Sorts items into stars, plowhorses, puzzles and dogs and lists items with no plate cost.' },
  args: files, required: ['sales', 'costs'],
  sources: {
    sales: { label: 'POS item sales', args: ['sales'], fields: ITEM_SALES_FIELDS, profiles: ITEM_SALES_PROFILES },
    costs: { label: 'Plate costs', args: ['costs'], fields: COST_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    popularity_factor: { type: 'number', minimum: 0.1, maximum: 1, description: 'Share of an even split that counts as popular (default 0.7)' },
    by_category: { type: 'boolean', description: 'Compare items within their category (default true) or across the whole menu' },
  } } },
  run: ({ rows, settings }) => menuMix(rows, settings),
  key: { arg: 'item', field: 'item', label: 'menu item' },
  summary: (o) => `${o.totals.menu_items} item(s), total margin ${money(o.totals.total_margin)}: ${o.totals.stars} star(s), ${o.totals.plowhorses} plowhorse(s), ${o.totals.puzzles} puzzle(s), ${o.totals.dogs} dog(s). ${o.items.filter((i) => i.status === 'review').length} to review.`,
  report: {
    title: 'Menu engineering', base: 'lime-menu-engineering',
    row: (i) => ({ category: i.category ?? '', item: i.item ?? '', qty: i.qty ?? '', mix_pct: i.mix_pct ?? '', average_price: i.average_price ?? '', plate_cost: i.plate_cost ?? '', contribution_margin: i.contribution_margin ?? '', total_margin: i.total_margin ?? '', quadrant: i.quadrant ?? '' }),
    htmlColumns: ['category', 'item', 'qty', 'mix_pct', 'contribution_margin', 'quadrant'],
    sections: (o) => [{ title: 'By quadrant', rows: ['star', 'plowhorse', 'puzzle', 'dog'].map((q) => ({ quadrant: q, count: o.items.filter((i) => i.quadrant === q).length, items: o.items.filter((i) => i.quadrant === q).map((i) => i.item).join(', ') })), columns: ['quadrant', 'count', 'items'] }],
  },
  draft: {
    noun: 'menu_proposal', verb: 'approve', category: 'go_live', actor: 'the owner',
    description: 'Write drafts/menu_proposal-<location>.md: the plowhorses, puzzles and dogs with a proposed action each, for the owner and chef. Marked DRAFT; approving records the decision, and a manager changes the menu in the POS.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Owner and chef' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, text: letter({ title: `Menu proposal${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'What the menu mix says',
      intro: 'From last period\'s item sales and plate costs. For each item: keep, re-cost, reposition, reprice or replace.',
      rows: o.items.filter((i) => i.quadrant && i.quadrant !== 'star').map((i) => ({ item: i.item, category: i.category, quadrant: i.quadrant, sold: i.qty, margin: money(i.contribution_margin), decision: '[TO CONFIRM]' })), columns: ['item', 'category', 'quadrant', 'sold', 'margin', 'decision'],
      closing: ['Next menu print date: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name the cost sheet uses for a POS menu item, e.g. {"name": "Burger - Classic", "means": "Classic Burger"}.', effect: 'reads that name as the POS menu item', fields: { costs: ['item'], sales: ['item'] } },
});
