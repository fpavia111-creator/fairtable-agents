// Catering: deposit window, overdue balances, overpayment, cancellations, stray payments.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catering, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, as_of: '2026-11-15' };
const ev = (extra) => ({ event_id: 'E1', client: 'Client A', event_date: '2026-12-31', total: 1000, deposit_pct: 25, status: 'booked', ...extra });
const pay = (amount, extra) => ({ event_id: 'E1', date: '2026-10-01', amount, type: 'deposit', ...extra });
const one = (r) => r.items[0];

test('a deposit paid in full is clean', () => {
  assert.equal(one(catering({ events: [ev({ event_date: '2026-11-30' })], payments: [pay(250)] }, s)).status, 'ok');
});

test('a short deposit only matters inside the deposit window', () => {
  assert.equal(one(catering({ events: [ev({})], payments: [pay(100)] }, s)).status, 'ok');
  const r = catering({ events: [ev({ event_date: '2026-11-30' })], payments: [pay(100)] }, s);
  assert.equal(one(r).findings[0].code, 'deposit_missing'); assert.equal(one(r).findings[0].amount, 150);
});

test('an open balance after the grace days is overdue', () => {
  const r = catering({ events: [ev({ event_date: '2026-11-05', status: 'completed' })], payments: [pay(250)] }, s);
  assert.equal(one(r).findings[0].code, 'balance_overdue'); assert.equal(one(r).findings[0].amount, 750);
});

test('a refund recorded reduces what was received', () => {
  const r = catering({ events: [ev({ event_date: '2026-11-05', status: 'completed' })], payments: [pay(1100), pay(-100, { type: 'refund' })] }, s);
  assert.equal(one(r).received, 1000); assert.equal(one(r).status, 'ok');
});

test('an early cancellation owes the deposit back; a late one does not', () => {
  const early = catering({ events: [ev({ status: 'cancelled', cancelled_date: '2026-11-01', event_date: '2026-12-01' })], payments: [pay(250)] }, s);
  assert.equal(one(early).findings[0].code, 'cancelled_refund_due');
  const late = catering({ events: [ev({ status: 'cancelled', cancelled_date: '2026-11-25', event_date: '2026-12-01' })], payments: [pay(250)] }, s);
  assert.equal(one(late).status, 'ok');
});

test('a payment for an event that is not booked is reviewed', () => {
  const r = catering({ events: [], payments: [pay(300, { event_id: 'E9' })] }, s);
  assert.equal(one(r).findings[0].code, 'payment_no_event');
});
