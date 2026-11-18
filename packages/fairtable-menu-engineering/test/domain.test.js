// Menu engineering: thresholds, weighted margin, quadrants, categories.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { menuMix, DEFAULTS } from '../src/index.js';

const sale = (item, qty, price, category = 'Mains') => ({ item, qty, net_sales: qty * price, category });
const q = (r, item) => r.items.find((i) => i.item === item).quadrant;
const sales = [sale('A', 100, 20), sale('B', 100, 15), sale('C', 10, 30), sale('D', 10, 12)];
const costs = [{ item: 'A', plate_cost: 5 }, { item: 'B', plate_cost: 6 }, { item: 'C', plate_cost: 8 }, { item: 'D', plate_cost: 6 }];

test('the four quadrants come from popularity and margin', () => {
  const r = menuMix({ sales, costs }, DEFAULTS);
  assert.deepEqual(['A', 'B', 'C', 'D'].map((x) => q(r, x)), ['star', 'plowhorse', 'puzzle', 'dog']);
});

test('the popularity bar is 70% of an even share', () => {
  const r = menuMix({ sales, costs }, DEFAULTS);
  assert.equal(r.items[0].popularity_bar_pct, 17.5);
});

test('the average margin is weighted by quantity sold', () => {
  const r = menuMix({ sales, costs }, DEFAULTS);
  assert.equal(r.items[0].category_average_margin, 12.18);
});

test('items are compared within their own category', () => {
  const r = menuMix({ sales: [...sales, sale('S1', 5, 8, 'Sides'), sale('S2', 50, 6, 'Sides')], costs: [...costs, { item: 'S1', plate_cost: 1 }, { item: 'S2', plate_cost: 2 }] }, DEFAULTS);
  assert.equal(q(r, 'S2'), 'plowhorse'); assert.equal(q(r, 'S1'), 'puzzle');
});

test('an item with no plate cost is reviewed and left out of the average', () => {
  const r = menuMix({ sales: [...sales, sale('E', 50, 50)], costs }, DEFAULTS);
  assert.equal(r.items.find((i) => i.item === 'E').findings[0].code, 'no_cost');
  assert.equal(r.items.find((i) => i.item === 'A').category_average_margin, 12.18);
});

test('a lower popularity factor makes more items popular', () => {
  const r = menuMix({ sales, costs }, { ...DEFAULTS, popularity_factor: 0.15 });
  assert.equal(q(r, 'C'), 'star');
});
