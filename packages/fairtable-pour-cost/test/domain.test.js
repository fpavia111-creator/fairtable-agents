// Pours: oz as fluid ounces, bottle sizes, cases of bottles, variance and pour cost.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pours, DEFAULTS } from '../src/index.js';

const counts = (item, open, close, cost = 20, size = 750) => [{ count_date: '2026-11-01', item, counted_qty: open, size_ml: size, unit_cost: cost }, { count_date: '2026-11-08', item, counted_qty: close, size_ml: size, unit_cost: cost }];
const one = (r, item) => r.items.find((i) => i.item === item);

test('a bar oz is a fluid ounce: 50 drinks of 1.5 oz is about 3 bottles of 750 ml', () => {
  const r = pours({ sales: [{ item: 'Gimlet', qty: 50, net_sales: 500 }], recipes: [{ recipe: 'Gimlet', ingredient: 'Gin', qty: 1.5, unit: 'oz' }], counts: counts('Gin', 4, 1) }, DEFAULTS);
  assert.equal(one(r, 'Gin').theoretical_bottles, 2.96); assert.equal(one(r, 'Gin').status, 'ok');
});

test('a case of 12/750ML adds twelve bottles', () => {
  const r = pours({ sales: [], recipes: [{ recipe: 'X', ingredient: 'Gin', qty: 1, unit: 'oz' }], counts: counts('Gin', 0, 12), purchases: [{ item: 'Gin', pack: '12/750ML', qty: 1 }] }, DEFAULTS);
  assert.equal(one(r, 'Gin').bought, 12);
});

test('liter bottles are counted at their own size', () => {
  const r = pours({ sales: [{ item: 'Soda', qty: 100, net_sales: 800 }], recipes: [{ recipe: 'Soda', ingredient: 'Vodka', qty: 30, unit: 'ml' }], counts: counts('Vodka', 5, 2, 14, 1000) }, DEFAULTS);
  assert.equal(one(r, 'Vodka').theoretical_bottles, 3); assert.equal(one(r, 'Vodka').status, 'ok');
});

test('heavy over-pouring is flagged and priced per bottle', () => {
  const r = pours({ sales: [{ item: 'Gimlet', qty: 50, net_sales: 500 }], recipes: [{ recipe: 'Gimlet', ingredient: 'Gin', qty: 1.5, unit: 'oz' }], counts: counts('Gin', 6, 0) }, DEFAULTS);
  assert.equal(one(r, 'Gin').status, 'flag'); assert.equal(one(r, 'Gin').variance_cost, 60.85);
});

test('centiliters are read as a volume', () => {
  const r = pours({ sales: [{ item: 'Spritz', qty: 75, net_sales: 600 }], recipes: [{ recipe: 'Spritz', ingredient: 'Aperitivo', qty: 6, unit: 'cl' }], counts: counts('Aperitivo', 7, 1) }, DEFAULTS);
  assert.equal(one(r, 'Aperitivo').theoretical_bottles, 6);
});

test('pour cost over target is flagged as a total', () => {
  const r = pours({ sales: [{ item: 'Gimlet', qty: 10, net_sales: 80 }], recipes: [{ recipe: 'Gimlet', ingredient: 'Gin', qty: 1.5, unit: 'oz' }], counts: counts('Gin', 2, 1) }, DEFAULTS);
  assert.equal(one(r, 'Pour cost').findings[0].code, 'pour_cost_over_target');
});
