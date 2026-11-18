// Utilities: usage per day, rates, estimated reads, duplicates and late fees.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { utilities, DEFAULTS } from '../src/index.js';

const b = (start, end, usage, amount, extra) => ({ account: 'E1', utility: 'Electric', period_start: start, period_end: end, usage, unit: 'kWh', amount, read_type: 'actual', ...extra });
const steady = [b('2026-06-01', '2026-06-30', 3000, 450), b('2026-07-01', '2026-07-30', 3000, 450), b('2026-08-01', '2026-08-30', 3000, 450)];
const last = (r) => r.items.find((i) => i.period_start === '2026-09-01');

test('a bill in line with the account history is clean', () => {
  assert.equal(last(utilities({ bills: [...steady, b('2026-09-01', '2026-09-30', 3100, 465)] }, DEFAULTS)).status, 'ok');
});

test('usage per day well over the median is a spike, even in a longer month', () => {
  const r = utilities({ bills: [...steady, b('2026-09-01', '2026-09-30', 4500, 675)] }, DEFAULTS);
  assert.equal(last(r).findings[0].code, 'usage_spike');
  const longer = utilities({ bills: [...steady, b('2026-09-01', '2026-10-05', 3500, 525)] }, DEFAULTS);
  assert.equal(last(longer).status, 'ok');
});

test('a higher price per unit is a rate jump', () => {
  const r = utilities({ bills: [...steady, b('2026-09-01', '2026-09-30', 3000, 600)] }, DEFAULTS);
  assert.equal(last(r).findings[0].code, 'rate_jump');
});

test('the same period twice is a duplicate', () => {
  const r = utilities({ bills: [...steady, b('2026-08-01', '2026-08-30', 3000, 450)] }, DEFAULTS);
  assert.ok(r.items.some((i) => i.findings.some((f) => f.code === 'duplicate_bill')));
});

test('two estimated reads in a row need an actual read', () => {
  const r = utilities({ bills: [steady[0], b('2026-07-01', '2026-07-30', 3000, 450, { read_type: 'Estimated' }), b('2026-08-01', '2026-08-30', 3000, 450, { read_type: 'estimated' })] }, DEFAULTS);
  assert.ok(r.items.some((i) => i.findings.some((f) => f.code === 'estimated_twice')));
});

test('a late fee is listed and left out of the price per unit', () => {
  const r = utilities({ bills: [...steady, b('2026-09-01', '2026-09-30', 3000, 485, { late_fee: 35 })] }, DEFAULTS);
  assert.deepEqual(last(r).findings.map((f) => f.code), ['late_fee']); assert.equal(last(r).rate, 0.15);
});
