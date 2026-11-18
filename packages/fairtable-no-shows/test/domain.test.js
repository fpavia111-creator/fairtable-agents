// No-shows: guest matching, repeats, deposits, fees, rate and masking.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noShows, DEFAULTS } from '../src/index.js';

const r = (extra) => ({ guest: 'Ana Rivera', phone: '555-0100-1111', date: '2026-11-04', party_size: 2, status: 'Seated', deposit: 0, fee_charged: 0, ...extra });
const s = { ...DEFAULTS, flag_rate_pct: 100 };

test('seated guests are not listed', () => {
  assert.equal(noShows({ reservations: [r({})] }, s).items.length, 0);
});

test('the same phone under two name orders is one guest who no-showed twice', () => {
  const x = noShows({ reservations: [r({ status: 'No Show' }), r({ guest: 'Rivera, Ana', status: 'no-show', date: '2026-11-06' })] }, s);
  assert.equal(x.items.length, 1); assert.equal(x.items[0].findings[0].code, 'repeat_no_show');
});

test('a large party with no deposit is reviewed', () => {
  const x = noShows({ reservations: [r({ status: 'No Show', party_size: 8 })] }, s);
  assert.ok(x.items[0].findings.some((f) => f.code === 'large_party_no_deposit'));
});

test('a fee is only expected when the policy has one and a card was held', () => {
  const held = r({ status: 'No Show', party_size: 4, deposit: 50 });
  assert.ok(!noShows({ reservations: [held] }, s).items[0].findings.some((f) => f.code === 'fee_not_charged'));
  assert.equal(noShows({ reservations: [held] }, { ...s, no_show_fee_per_guest: 25 }).totals.fees_not_charged, 100);
});

test('cancellations are not no-shows, and the rate is no-shows over reservations', () => {
  const x = noShows({ reservations: [r({ status: 'Cancelled' }), r({ status: 'No Show', phone: '555-0100-2222' }), r({}), r({})] }, s);
  assert.equal(x.totals.no_shows, 1); assert.equal(x.totals.no_show_rate, 25);
});

test('sales lost are covers times the average check', () => {
  const x = noShows({ reservations: [r({ status: 'No Show', party_size: 3 })] }, { ...s, average_check_per_cover: 50 });
  assert.equal(x.totals.sales_lost_estimate, 150);
});
