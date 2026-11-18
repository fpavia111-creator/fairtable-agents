// Prime cost: shares of sales, burden, targets, trends and missing numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { primeCost, DEFAULTS } from '../src/index.js';

const w = (week, extra) => ({ week, location: 'A', net_sales: 10000, food_cost: 2500, beverage_cost: 500, labor_cost: 2500, labor_burden: 300, ...extra });
const one = (r) => r.items[0];

test('prime cost is food + beverage + labor + burden over sales', () => {
  const r = primeCost({ weeks: [w('2026-11-02', {})] }, DEFAULTS);
  assert.equal(one(r).prime_pct, 58); assert.equal(one(r).status, 'ok');
});

test('over the target plus the points is flagged with the amount over', () => {
  const r = primeCost({ weeks: [w('2026-11-02', { food_cost: 3500 })] }, DEFAULTS);
  assert.equal(one(r).prime_pct, 68); assert.equal(one(r).findings[0].code, 'prime_over_target'); assert.equal(one(r).findings[0].amount, 600);
});

test('three rising weeks in a row are a trend', () => {
  const r = primeCost({ weeks: [w('2026-10-19', {}), w('2026-10-26', { food_cost: 2600 }), w('2026-11-02', { food_cost: 2700 })] }, DEFAULTS);
  assert.ok(r.items.find((i) => i.week === '2026-11-02').findings.some((f) => f.code === 'rising_prime'));
});

test('a week with no labor is reviewed and left out of the totals', () => {
  const r = primeCost({ weeks: [w('2026-11-02', { labor_cost: '' }), w('2026-11-09', {})] }, DEFAULTS);
  assert.equal(r.items.find((i) => i.week === '2026-11-02').findings[0].code, 'missing_data'); assert.equal(r.totals.net_sales, 10000);
});

test('locations are kept apart', () => {
  const r = primeCost({ weeks: [w('2026-11-02', {}), w('2026-11-02', { location: 'B', food_cost: 5000 })] }, DEFAULTS);
  assert.equal(r.items.length, 2); assert.equal(r.items.find((i) => i.location === 'B').status, 'flag');
});

test('two rows for one location and week are added together', () => {
  const r = primeCost({ weeks: [w('2026-11-02', {}), w('2026-11-02', { net_sales: 0, food_cost: 0, beverage_cost: 0, labor_cost: 1000, labor_burden: 0 })] }, DEFAULTS);
  assert.equal(r.items.length, 1); assert.equal(one(r).labor, 3800);
});
