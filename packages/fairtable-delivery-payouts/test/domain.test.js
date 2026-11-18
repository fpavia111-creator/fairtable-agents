// Delivery payouts: payout arithmetic, contract rates, refunds, duplicates, unpaid orders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deliveryPayouts, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, platforms: { DoorDash: { commission_pct: 15 } } };
const line = (extra) => ({ platform: 'DoorDash', order_id: 'A1', date: '2026-11-03', type: 'order', subtotal: 100, tax: 8, commission: 15, payout: 93, ...extra });
const one = (r) => r.items[0];

test('a line that adds up at the contract rate is clean', () => {
  assert.equal(one(deliveryPayouts({ statements: [line({})] }, s)).status, 'ok');
});

test('fees written as negative numbers read the same', () => {
  assert.equal(one(deliveryPayouts({ statements: [line({ commission: -15 })] }, s)).status, 'ok');
});

test('a commission over the contract rate is disputable by the difference', () => {
  const r = deliveryPayouts({ statements: [line({ commission: 20, payout: 88 })] }, s);
  assert.equal(one(r).findings[0].code, 'commission_over_rate'); assert.equal(one(r).disputable, 5);
});

test('a payout short of its own lines is flagged', () => {
  const r = deliveryPayouts({ statements: [line({ payout: 90 })] }, s);
  assert.equal(one(r).findings[0].code, 'payout_math'); assert.equal(one(r).disputable, 3);
});

test('an error charge is listed to dispute but not counted as an arithmetic error', () => {
  const r = deliveryPayouts({ statements: [line({ refund: 10, payout: 83 })] }, s);
  assert.deepEqual(one(r).findings.map((f) => f.code), ['error_charge']);
});

test('a POS order on no statement was never paid', () => {
  const r = deliveryPayouts({ statements: [line({})], pos_orders: [{ platform: 'DoorDash', order_id: 'A1', subtotal: 100 }, { platform: 'doordash', order_id: 'a2', subtotal: 40 }] }, s);
  assert.equal(r.items.find((i) => i.order_id === 'a2').findings[0].code, 'missing_from_statement');
});

test('the same order twice is a duplicate to expect back', () => {
  const r = deliveryPayouts({ statements: [line({}), line({})] }, s);
  assert.equal(one(r).findings[0].code, 'duplicate_order'); assert.equal(one(r).payout, 186);
});
