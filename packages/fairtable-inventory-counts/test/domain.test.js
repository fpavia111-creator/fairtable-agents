// Count variance: pricing, unit mistakes, blanks and negatives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countVariance, DEFAULTS } from '../src/index.js';

const c = (item, counted, expected, cost = 4, unit = 'lb') => ({ item, counted_qty: counted, expected_qty: expected, unit_cost: cost, unit, area: 'Walk-in', location: 'Main' });
const one = (r) => r.items[0];

test('a count on expectation is clean', () => {
  const r = countVariance({ counts: [c('Beef', 10, 10)] }, DEFAULTS);
  assert.equal(one(r).status, 'ok'); assert.equal(one(r).variance_cost, 0);
});

test('a big shortfall is flagged and priced; it counts as shrink', () => {
  const r = countVariance({ counts: [c('Beef', 10, 25)] }, DEFAULTS);
  assert.equal(one(r).status, 'flag'); assert.equal(one(r).variance_cost, -60); assert.equal(r.totals.shrink_value, -60);
});

test('a count that is a pack multiple of expected looks like the wrong unit and is not priced', () => {
  const r = countVariance({ counts: [c('Cream', 24, 2)] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'unit_suspect'); assert.equal(one(r).variance_cost, null);
  assert.equal(r.totals.counted_value, 0);
});

test('two lines for the same item in two areas are added before comparing', () => {
  const r = countVariance({ counts: [c('Beef', 6, 10), { ...c('Beef', 4, 10), area: 'Freezer' }] }, DEFAULTS);
  assert.equal(r.items.length, 1); assert.equal(one(r).counted_qty, 10); assert.equal(one(r).status, 'ok');
});

test('blank and negative counts are reviewed and kept out of the totals', () => {
  const r = countVariance({ counts: [c('Oil', '', 3), c('Gin', -1, 3)] }, DEFAULTS);
  assert.deepEqual(r.items.map((i) => i.findings[0].code).sort(), ['missing_count', 'negative_count']);
  assert.equal(r.totals.counted_value, 0);
});

test('thresholds come from the settings', () => {
  const r = countVariance({ counts: [c('Beef', 10, 25)] }, { ...DEFAULTS, flag_amount: 100 });
  assert.equal(one(r).status, 'watch');
});
