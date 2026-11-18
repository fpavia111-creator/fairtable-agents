// Breaks: missed, short and late meals, second meals, premiums, minors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breaks, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, minimum_wage: 16 };
const t = (a, b, brk, extra) => ({ employee: 'A', clock_in: `2026-11-03T${a}`, clock_out: `2026-11-03T${b}`, break_minutes: brk, rate: 20, age: 30, ...extra });
const one = (r) => r.items[0];

test('a long shift with a full meal break started in time is clean', () => {
  assert.equal(one(breaks({ timecards: [t('09:00', '17:30', 30, { break_start: '2026-11-03T13:00' })] }, s)).status, 'ok');
});

test('no meal on a long shift is flagged with an hour of pay', () => {
  const r = breaks({ timecards: [t('09:00', '17:00', 0)] }, s);
  assert.equal(one(r).findings[0].code, 'missed_meal_break'); assert.equal(one(r).premium, 20);
});

test('a short shift needs no meal', () => {
  assert.equal(one(breaks({ timecards: [t('09:00', '13:30', 0)] }, s)).status, 'ok');
});

test('a short break and a late meal', () => {
  assert.equal(one(breaks({ timecards: [t('09:00', '17:00', 15)] }, s)).findings[0].code, 'short_meal_break');
  assert.equal(one(breaks({ timecards: [t('09:00', '17:30', 30, { break_start: '2026-11-03T15:00' })] }, s)).findings[0].code, 'late_meal');
});

test('the premium uses the minimum wage for tipped staff', () => {
  assert.equal(one(breaks({ timecards: [t('09:00', '17:00', 0, { rate: 2.13 })] }, s)).premium, 16);
});

test('minors: too many hours and too late, by age band', () => {
  const r = breaks({ timecards: [t('16:00', '21:00', 30, { age: 15 })] }, s);
  assert.deepEqual(one(r).findings.map((f) => f.code).sort(), ['minor_late_shift', 'minor_over_hours']);
});
