// Location comparison: shares of sales, group median, points, average check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locations, DEFAULTS } from '../src/index.js';

const l = (location, extra) => ({ location, net_sales: 100000, food_cost: 28000, beverage_cost: 4000, labor_cost: 30000, voids: 800, comps: 1000, discounts: 2000, checks: 2500, ...extra });
const one = (r, n) => r.items.find((i) => i.location === n);
const group = [l('A', {}), l('B', {}), l('C', {})];

test('a group of identical locations is all clean', () => {
  const r = locations({ locations: group }, DEFAULTS);
  assert.ok(r.items.every((i) => i.status === 'ok')); assert.equal(r.extra.group_median.prime_pct, 62);
});

test('a location over the median by more than the points is flagged with the money', () => {
  const r = locations({ locations: [...group, l('D', { food_cost: 33000 })] }, DEFAULTS);
  const f = one(r, 'D').findings.find((x) => x.code === 'food_pct_high');
  assert.ok(f); assert.equal(f.amount, 5000);
});

test('within the points is clean', () => {
  const r = locations({ locations: [...group, l('D', { food_cost: 29500 })] }, DEFAULTS);
  assert.equal(one(r, 'D').status, 'ok');
});

test('a much lower average check is watched', () => {
  const r = locations({ locations: [...group, l('K', { checks: 5000 })] }, DEFAULTS);
  assert.equal(one(r, 'K').findings[0].code, 'avg_check_low');
});

test('rows for the same location are added before comparing', () => {
  const r = locations({ locations: [l('A', { net_sales: 50000, food_cost: 14000, beverage_cost: 2000, labor_cost: 15000 }), l('A', { net_sales: 50000, food_cost: 14000, beverage_cost: 2000, labor_cost: 15000 }), l('B', {})] }, DEFAULTS);
  assert.equal(r.items.length, 2); assert.equal(one(r, 'A').net_sales, 100000);
});

test('a location with no sales is reviewed and left out of the median', () => {
  const r = locations({ locations: [...group, l('New', { net_sales: 0 })] }, DEFAULTS);
  assert.equal(one(r, 'New').findings[0].code, 'missing_sales'); assert.equal(r.extra.group_median.prime_pct, 62);
});
