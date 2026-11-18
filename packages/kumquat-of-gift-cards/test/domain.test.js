// Gift cards: liability, balance arithmetic, dormancy, locations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { giftCards, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, as_of: '2026-11-15' };
const c = (extra) => ({ card: 'GC-1', issued_date: '2026-10-01', issued_location: 'A', issued_amount: 50, redeemed: 20, balance: 30, last_activity: '2026-10-10', last_location: 'A', ...extra });
const one = (r) => r.items[0];

test('a card whose numbers add up is clean and counts in the liability', () => {
  const r = giftCards({ cards: [c({})] }, s);
  assert.equal(one(r).status, 'ok'); assert.equal(r.totals.liability, 30);
});

test('a balance that is not issued minus redeemed is flagged', () => {
  assert.equal(one(giftCards({ cards: [c({ balance: 40 })] }, s)).findings[0].code, 'balance_math');
});

test('a negative balance is flagged and kept out of the liability', () => {
  const r = giftCards({ cards: [c({ redeemed: 60, balance: -10 })] }, s);
  assert.equal(one(r).findings[0].code, 'negative_balance'); assert.equal(r.totals.liability, 0);
});

test('dormancy follows the as-of date and the months in the settings', () => {
  const old = c({ last_activity: '2024-01-01' });
  assert.equal(one(giftCards({ cards: [old] }, s)).findings[0].code, 'dormant');
  assert.equal(one(giftCards({ cards: [old] }, { ...s, dormancy_months: 48 })).status, 'ok');
});

test('a card used at another location is listed for the inter-location settlement', () => {
  assert.equal(one(giftCards({ cards: [c({ last_location: 'B' })] }, s)).findings[0].code, 'cross_location');
});

test('liability is split by the selling location', () => {
  const r = giftCards({ cards: [c({}), c({ card: 'GC-2', issued_location: 'B', issued_amount: 100, redeemed: 0, balance: 100 })] }, s);
  assert.deepEqual(r.extra.by_location, { A: 30, B: 100 });
});
