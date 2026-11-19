// Stockouts: hours off, lost sales estimate, repeats, early outages, missing times back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stockouts, DEFAULTS } from '../src/index.js';

const e = (date, out, back, item = 'Rib') => ({ date, item, out_at: out, back_at: back });
const sales = [{ date: '2026-11-02', item: 'Rib', net_sales: 1100 }];
const one = (r) => r.items[0];

test('hours off and the lost sales estimate', () => {
  const r = stockouts({ eighty_six: [e('2026-11-03', '20:00', '22:00')], sales }, DEFAULTS);
  assert.equal(one(r).hours_out, 2); assert.equal(one(r).sales_per_open_hour, 100); assert.equal(one(r).lost_sales_estimate, 200);
});

test('three outages in the period are repeated', () => {
  const r = stockouts({ eighty_six: [e('2026-11-03', '21:00', '22:00'), e('2026-11-04', '21:00', '22:00'), e('2026-11-05', '21:00', '22:00')], sales }, DEFAULTS);
  assert.ok(one(r).findings.some((f) => f.code === 'repeated_86'));
});

test('an item out before the rush is watched', () => {
  const r = stockouts({ eighty_six: [e('2026-11-03', '17:30', '18:30')], sales }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'early_86');
});

test('an item back before the rush is not watched', () => {
  const r = stockouts({ eighty_six: [e('2026-11-03', '14:00', '15:00')], sales }, DEFAULTS);
  assert.equal(one(r).findings.length, 0); assert.equal(one(r).status, 'ok');
});

test('no time back counts until closing and is reviewed', () => {
  const r = stockouts({ eighty_six: [e('2026-11-03', '21:00', '')], sales }, DEFAULTS);
  assert.equal(one(r).hours_out, 1); assert.ok(one(r).findings.some((f) => f.code === 'never_returned'));
});

test('a long outage is flagged', () => {
  const r = stockouts({ eighty_six: [e('2026-11-03', '18:00', '22:00')], sales }, DEFAULTS);
  assert.equal(one(r).status, 'flag');
});

test('an item with no sales history gets no estimate', () => {
  const r = stockouts({ eighty_six: [e('2026-11-03', '21:00', '22:00', 'Pie')], sales }, DEFAULTS);
  assert.equal(one(r).lost_sales_estimate, null); assert.equal(one(r).findings[0].code, 'no_sales_history');
});
