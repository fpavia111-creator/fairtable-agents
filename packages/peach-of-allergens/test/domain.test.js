// Allergens: union of ingredient allergens, declarations, claims, synonyms and gaps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allergens, DEFAULTS } from '../src/index.js';

const rec = (dish, ...ings) => ings.map((i) => ({ recipe: dish, ingredient: i }));
const ing = (name, a) => ({ ingredient: name, allergens: a });
const one = (r, item) => r.items.find((i) => i.item === item);

test('a dish whose matrix declares everything its ingredients contain is clean', () => {
  const r = allergens({ recipes: rec('Toast', 'Bread', 'Butter'), ingredients: [ing('Bread', 'wheat'), ing('Butter', 'milk')], matrix: [{ item: 'Toast', allergens: 'wheat; milk' }] }, DEFAULTS);
  assert.equal(one(r, 'Toast').status, 'ok');
});

test('an allergen in an ingredient and not on the matrix is flagged', () => {
  const r = allergens({ recipes: rec('Toast', 'Bread', 'Butter'), ingredients: [ing('Bread', 'wheat'), ing('Butter', 'milk')], matrix: [{ item: 'Toast', allergens: 'wheat' }] }, DEFAULTS);
  assert.equal(one(r, 'Toast').findings[0].code, 'undeclared_allergen');
});

test('synonyms read gluten as wheat and dairy as milk', () => {
  const r = allergens({ recipes: rec('Toast', 'Bread', 'Butter'), ingredients: [ing('Bread', 'gluten'), ing('Butter', 'dairy')], matrix: [{ item: 'Toast', allergens: 'wheat, milk' }] }, DEFAULTS);
  assert.equal(one(r, 'Toast').status, 'ok');
});

test('a free-from claim broken by an ingredient is flagged', () => {
  const r = allergens({ recipes: rec('Salad', 'Croutons'), ingredients: [ing('Croutons', 'wheat')], matrix: [{ item: 'Salad', allergens: 'wheat', free_from: 'Gluten-Free' }] }, DEFAULTS);
  assert.equal(one(r, 'Salad').findings[0].code, 'free_from_broken');
});

test('missing ingredient data and dishes on only one side are reviewed', () => {
  const r = allergens({ recipes: [...rec('Soup', 'Stock'), ...rec('Stew', 'Beef')], ingredients: [ing('Beef', '')], matrix: [{ item: 'Soup', allergens: '' }, { item: 'Pie', allergens: 'wheat' }] }, DEFAULTS);
  assert.equal(one(r, 'Soup').findings[0].code, 'ingredient_no_data');
  assert.equal(one(r, 'Pie').findings[0].code, 'no_recipe'); assert.equal(one(r, 'Stew').findings[0].code, 'not_on_matrix');
});

test('an allergen name outside the list is reported once', () => {
  const r = allergens({ recipes: rec('Dish', 'Celery salt'), ingredients: [ing('Celery salt', 'celery')], matrix: [{ item: 'Dish', allergens: 'celery' }] }, DEFAULTS);
  assert.ok(r.items.some((i) => i.findings.some((f) => f.code === 'unknown_allergen')));
});
