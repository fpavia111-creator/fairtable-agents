// Waste: pricing, repeats, missing data and days with no log.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wasteLog, DEFAULTS } from '../src/index.js';

const w = (item, qty, cost, reason = 'expired', date = '2026-11-02') => ({ item, qty, unit_cost: cost, reason, date, unit: 'lb' });
const one = (r, item) => r.items.find((i) => i.item === item);

test('waste is priced by quantity and unit cost, or by its value', () => {
  const r = wasteLog({ waste: [w('Beef', 2, 5), { item: 'Soup', value: 12, reason: 'old', date: '2026-11-02' }] }, DEFAULTS);
  assert.equal(r.totals.waste_value, 22);
});

test('an item over the money threshold is flagged', () => {
  const r = wasteLog({ waste: [w('Salmon', 4, 13)] }, DEFAULTS);
  assert.equal(one(r, 'Salmon').status, 'flag');
});

test('the same reason three times is a pattern to fix', () => {
  const r = wasteLog({ waste: [w('Fries', 1, 1, 'overproduction'), w('Fries', 1, 1, 'Overproduction', '2026-11-03'), w('Fries', 1, 1, 'overproduction', '2026-11-04')] }, DEFAULTS);
  assert.ok(one(r, 'Fries').findings.some((f) => f.code === 'repeat_reason'));
});

test('a day with sales and no waste entry is reviewed', () => {
  const r = wasteLog({ waste: [w('Beef', 1, 1)], sales: [{ date: '2026-11-02', net_sales: 100 }, { date: '2026-11-03', net_sales: 100 }] }, DEFAULTS);
  assert.equal(one(r, '2026-11-03').findings[0].code, 'unlogged_day');
});

test('waste over the target share of sales is flagged as a total', () => {
  const r = wasteLog({ waste: [w('Beef', 10, 5)], sales: [{ date: '2026-11-02', net_sales: 1000 }] }, DEFAULTS);
  assert.equal(r.totals.waste_pct_of_sales, 5); assert.equal(one(r, 'All waste').findings[0].code, 'waste_over_target');
});

test('entries with no cost or no reason are reviewed', () => {
  const r = wasteLog({ waste: [{ item: 'Bread', qty: 3, date: '2026-11-02' }] }, DEFAULTS);
  assert.deepEqual(one(r, 'Bread').findings.map((f) => f.code).sort(), ['no_reason', 'no_value']);
});
