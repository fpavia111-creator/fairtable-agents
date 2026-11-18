// Discounts: dates, days and hours, caps, approvals, employee meals and unknown buttons.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discounts, DEFAULTS } from '../src/index.js';

const d = (item, extra) => ({ check: '1', date: '2026-11-03', time: '17:00', employee: 'A', item, amount: 5, check_total: 40, ...extra });
const p = (name, extra) => ({ name, start: '2026-01-01', end: '2026-12-31', ...extra });
const one = (r) => r.items[0];

test('a promotion used inside its rules is clean', () => {
  assert.equal(one(discounts({ discounts: [d('HH')], promos: [p('HH', { max_pct: 50, days: 'Mon-Fri', hours: '15:00-18:00' })] }, DEFAULTS)).status, 'ok');
});

test('a promotion used after it ended is flagged', () => {
  const r = discounts({ discounts: [d('Summer')], promos: [p('Summer', { end: '2026-09-30' })] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'expired_promo');
});

test('days and hours are checked, Saturday and 19:00 are outside Mon-Fri 15:00-18:00', () => {
  const promos = [p('HH', { days: 'Mon-Fri', hours: '15:00-18:00' })];
  assert.equal(one(discounts({ discounts: [d('HH', { date: '2026-11-07' })], promos }, DEFAULTS)).findings[0].code, 'outside_hours');
  assert.equal(one(discounts({ discounts: [d('HH', { time: '19:00' })], promos }, DEFAULTS)).findings[0].code, 'outside_hours');
});

test('the cap is the lower of the percent and the amount', () => {
  const r = discounts({ discounts: [d('Prix', { amount: 10, check_total: 100 })], promos: [p('Prix', { max_pct: 15, max_amount: 8 })] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'over_cap'); assert.equal(one(r).findings[0].amount, 2);
});

test('employee meals over the daily allowance are flagged per employee and day', () => {
  const promos = [p('Meal', { employee_only: 'yes', daily_allowance: 15 })];
  const r = discounts({ discounts: [d('Meal', { amount: 10 }), d('Meal', { amount: 10, check: '2' }), d('Meal', { amount: 10, employee: 'B' })], promos }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'employee_meal_over'); assert.equal(one(r).findings[0].amount, 5);
});

test('a discount that is not on the list is reviewed; an open one is watched', () => {
  const r = discounts({ discounts: [d('Industry Night'), d('Open Discount')], promos: [] }, DEFAULTS);
  assert.deepEqual(r.items.map((i) => i.findings[0].code).sort(), ['open_discount', 'unknown_discount']);
});

test('a discount that needs approval is reviewed without one', () => {
  const r = discounts({ discounts: [d('Comp', { approver: '' })], promos: [p('Comp', { needs_approval: 'yes' })] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'no_approver');
});
