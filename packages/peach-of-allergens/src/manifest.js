import { readFileSync } from 'node:fs';
import { tableAgent, RECIPE_FIELDS, REFUSE, letter } from 'fairtable-core';
import { allergens, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const INGREDIENT_FIELDS = {
  ingredient: { aliases: ['Ingredient', 'Item', 'Product', 'Inventory Item'], required: true },
  allergens: { aliases: ['Allergens', 'Contains', 'Allergen List', 'Allergen'] },
};
const MATRIX_FIELDS = {
  item: { aliases: ['Item', 'Menu Item', 'Dish', 'Recipe'], required: true },
  allergens: { aliases: ['Allergens', 'Contains', 'Declared Allergens'] },
  free_from: { aliases: ['Free From', 'Claims', 'Dietary', 'Labels'] },
};
const files = {
  recipes: { type: 'string', description: 'Recipes under --root: menu item and ingredient (quantities are not needed here)' },
  ingredients: { type: 'string', description: 'Ingredient allergen data from supplier specification sheets: ingredient, allergens separated by ; or ,' },
  matrix: { type: 'string', description: 'Your menu allergen matrix: menu item, declared allergens, free-from claims (gluten-free, dairy-free, nut-free, vegan)' },
};
export const DEMO = { title: 'Peach of Allergens', files: { recipes: 'recipes.csv', ingredients: 'ingredients.csv', matrix: 'matrix.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Gluten-Free Pasta' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'peach',
  description: 'Checks the menu allergen matrix against the recipes and each ingredient\'s allergens: allergens in a dish the matrix does not declare, free-from claims a recipe breaks, declarations no ingredient explains, ingredients with no allergen data, and dishes missing from one side. Writes a worklist and a correction memo draft for the chef. Never changes the menu.',
  check: { title: 'Allergen matrix against recipes', description: 'For each menu item: the allergens its ingredients contain against those the matrix declares and the free-from claims it makes. Flags undeclared allergens and broken claims; lists declarations no ingredient explains, ingredients with no data, recipes not on the matrix and matrix items with no recipe.' },
  args: files, required: ['recipes', 'ingredients', 'matrix'],
  sources: {
    recipes: { label: 'Recipes', args: ['recipes'], fields: RECIPE_FIELDS },
    ingredients: { label: 'Ingredient allergens', args: ['ingredients'], fields: INGREDIENT_FIELDS },
    matrix: { label: 'Allergen matrix', args: ['matrix'], fields: MATRIX_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    allergens: { type: 'array', items: { type: 'string' }, description: 'The allergens you track (default: the nine major US allergens; other countries list more, e.g. the 14 EU allergens)' },
    synonyms: { type: 'object', additionalProperties: { type: 'string' }, description: 'Other words for an allergen, e.g. {"gluten": "wheat"}' },
    free_from_rules: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } }, description: 'What each free-from claim rules out, e.g. {"gluten-free": ["wheat"]}' },
  } } },
  run: ({ rows, settings }) => allergens(rows, settings),
  key: { arg: 'item', field: 'item', label: 'menu item' },
  summary: (o) => `${o.totals.menu_items} menu item(s): ${o.totals.undeclared} undeclared allergen(s), ${o.totals.broken_claims} broken free-from claim(s). ${o.items.filter((i) => i.status === 'flag').length} dish(es) flagged, ${o.items.filter((i) => i.status === 'review').length} to review.`,
  report: {
    title: 'Allergen matrix against recipes', base: 'peach-allergens',
    row: (i) => ({ item: i.item ?? '', declared: i.declared ?? '', contains: i.contains ?? '', free_from: i.free_from ?? '' }),
    htmlColumns: ['item', 'declared', 'contains', 'free_from'],
    sections: () => [],
    limits: ['Reads only the files you give it. It knows only the allergens on your ingredient data; it cannot see cross-contact in the kitchen or a supplier changing a product.', 'The allergen list and claim rules are settings; labelling law differs by country and state.', 'Not food-safety or legal advice. The chef and the owner decide what the menu says.'],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/memo-<location>.md: the dishes whose allergen declarations or claims need correcting, for the chef. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Chef' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, text: letter({ title: `Allergen matrix corrections${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Dishes whose declarations do not match the recipes',
      intro: 'Please check these dishes before the matrix and the menu are reprinted. Until then, servers should tell guests about the allergens listed under "contains".',
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ dish: i.item, declared: i.declared || '-', contains: i.contains || '-', issue: i.findings.map((f) => f.code).join(' ') })), columns: ['dish', 'declared', 'contains', 'issue'],
      closing: ['Corrected matrix approved by the chef on: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name a supplier sheet or the matrix uses for a recipe ingredient or dish, e.g. {"name": "Mayo house", "means": "House Sauce"}.', effect: 'reads that name as the ingredient or dish', fields: { ingredients: ['ingredient'], matrix: ['item'] } },
});
