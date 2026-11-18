// Recipe costing: pack sizes, yields, latest price, targets and price at target.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipeCosts, DEFAULTS } from '../src/index.js';

const inv = (item, pack, price, date = '2026-11-03', n = 'A1') => ({ item, pack, unit_price: price, invoice_date: date, invoice_number: n });
const one = (r, name) => r.items.find((i) => i.recipe === name);

test('a case price is read per ounce through its pack size', () => {
  const r = recipeCosts({ recipes: [{ recipe: 'Burger', ingredient: 'Beef', qty: 8, unit: 'oz', menu_price: 10 }], invoices: [inv('Beef', '1/10 LB', 48)] }, DEFAULTS);
  assert.equal(one(r, 'Burger').plate_cost, 2.4); assert.equal(one(r, 'Burger').food_cost_pct, 24);
});

test('yield raises the cost of the usable portion', () => {
  const r = recipeCosts({ recipes: [{ recipe: 'Steak', ingredient: 'Ribeye', qty: 8, unit: 'oz', yield_pct: 80, menu_price: 30 }], invoices: [inv('Ribeye', '1/10 LB', 160)] }, DEFAULTS);
  assert.equal(one(r, 'Steak').plate_cost, 10);
});

test('the latest invoice price is used and the rise since the earliest is shown', () => {
  const r = recipeCosts({ recipes: [{ recipe: 'Steak', ingredient: 'Ribeye', qty: 16, unit: 'oz', menu_price: 60 }], invoices: [inv('Ribeye', '1/10 LB', 150, '2026-11-01', 'B'), inv('Ribeye', '1/10 LB', 100, '2026-10-01', 'A')] }, DEFAULTS);
  assert.equal(one(r, 'Steak').plate_cost, 15); assert.equal(one(r, 'Steak').earliest_plate_cost, 10);
  assert.ok(one(r, 'Steak').findings.some((f) => f.code === 'cost_rose'));
});

test('over target by more than the flag points is flagged with the price that would meet it', () => {
  const r = recipeCosts({ recipes: [{ recipe: 'Steak', ingredient: 'Ribeye', qty: 16, unit: 'oz', menu_price: 30 }], invoices: [inv('Ribeye', '1/10 LB', 120)] }, DEFAULTS);
  assert.equal(one(r, 'Steak').status, 'flag'); assert.equal(one(r, 'Steak').price_at_target, 40);
});

test('category targets win over the general target', () => {
  const s = { ...DEFAULTS, category_targets: { Steaks: 45 } };
  const r = recipeCosts({ recipes: [{ recipe: 'Steak', ingredient: 'Ribeye', qty: 16, unit: 'oz', menu_price: 30, category: 'Steaks' }], invoices: [inv('Ribeye', '1/10 LB', 120)] }, s);
  assert.equal(one(r, 'Steak').target_pct, 45); assert.equal(one(r, 'Steak').status, 'ok');
});

test('volume used but bought by weight is a unit mismatch, and a missing price is named', () => {
  const r = recipeCosts({ recipes: [{ recipe: 'Fries', ingredient: 'Oil', qty: 1, unit: 'floz', menu_price: 5 }, { recipe: 'Fries', ingredient: 'Salt', qty: 1, unit: 'g', menu_price: 5 }], invoices: [inv('Oil', '6/1 LB', 60)] }, DEFAULTS);
  assert.deepEqual(one(r, 'Fries').findings.map((f) => f.code).sort(), ['no_price', 'unit_mismatch']);
  assert.equal(one(r, 'Fries').status, 'review');
});

test('a recipe without a menu price is reviewed, not divided by zero', () => {
  const r = recipeCosts({ recipes: [{ recipe: 'Special', ingredient: 'Beef', qty: 8, unit: 'oz' }], invoices: [inv('Beef', '1/10 LB', 48)] }, DEFAULTS);
  assert.equal(one(r, 'Special').food_cost_pct, null); assert.equal(one(r, 'Special').findings[0].code, 'no_menu_price');
});
