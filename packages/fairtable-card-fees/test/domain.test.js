// Card fees: effective rate, agreed markup, allowed fees and caps, downgrades, trend.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardFees, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, markup_bps: 30, per_transaction_fee: 0.1, allowed_fees: { 'Monthly fee': 25 } };
const month = (m, markup, extra = []) => [
  { month: m, location: 'A', volume: 100000, transactions: 2000, fee_name: 'Interchange', fee_type: 'interchange', amount: 1800 },
  { month: m, location: 'A', fee_name: 'Processor markup', fee_type: 'markup', amount: markup },
  { month: m, location: 'A', fee_name: 'Monthly fee', fee_type: 'monthly', amount: 25 }, ...extra];
const one = (r, m) => r.items.find((i) => i.month === m);

test('the effective rate is all fees over card volume', () => {
  const r = cardFees({ statements: month('2026-09', 500) }, s);
  assert.equal(one(r, '2026-09').effective_rate_pct, 2.325); assert.equal(one(r, '2026-09').status, 'ok');
});

test('markup over basis points plus the per-transaction fee is flagged by the excess', () => {
  const r = cardFees({ statements: month('2026-09', 600) }, s);
  assert.equal(one(r, '2026-09').findings[0].code, 'markup_over_contract'); assert.equal(one(r, '2026-09').findings[0].amount, 100);
});

test('a fee not in the agreement is reviewed; an allowed fee over its cap is flagged', () => {
  const r = cardFees({ statements: month('2026-09', 500, [{ month: '2026-09', location: 'A', fee_name: 'Annual fee', fee_type: 'other', amount: 99 }]) }, s);
  assert.equal(one(r, '2026-09').findings[0].code, 'unexpected_fee');
  const cap = cardFees({ statements: [...month('2026-09', 500).slice(0, 2), { month: '2026-09', location: 'A', fee_name: 'Monthly fee', fee_type: 'monthly', amount: 40 }] }, s);
  assert.equal(one(cap, '2026-09').findings[0].code, 'fee_over_cap');
});

test('downgrade surcharges are listed, not counted as refundable', () => {
  const r = cardFees({ statements: month('2026-09', 500, [{ month: '2026-09', location: 'A', fee_name: 'Non-qualified surcharge', fee_type: 'other', amount: 80 }]) }, s);
  assert.equal(one(r, '2026-09').findings[0].code, 'downgrade_surcharge'); assert.equal(r.totals.to_recover, 0);
});

test('a jump in the effective rate from one month to the next is flagged', () => {
  const r = cardFees({ statements: [...month('2026-09', 500), ...month('2026-10', 500, [{ month: '2026-10', location: 'A', fee_name: 'Non-qualified surcharge', fee_type: 'other', amount: 300 }])] }, s);
  assert.ok(one(r, '2026-10').findings.some((f) => f.code === 'effective_rate_up'));
});

test('without an agreed markup the markup is not checked', () => {
  const r = cardFees({ statements: month('2026-09', 900) }, { ...s, markup_bps: null });
  assert.equal(one(r, '2026-09').status, 'ok');
});
