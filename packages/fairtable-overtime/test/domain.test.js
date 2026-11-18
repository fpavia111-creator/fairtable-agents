// Overtime: weekly and daily rules, double time, split shifts, spread, clopens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overtime, DEFAULTS } from '../src/index.js';

const sh = (day, a, b, brk = 0, emp = 'A', rate = 20) => ({ employee: emp, role: 'Cook', clock_in: `${day}T${a}`, clock_out: b.includes('T') ? b : `${day}T${b}`, break_minutes: brk, rate });
const week = (h) => ['02', '03', '04', '05', '06'].map((d) => sh(`2026-11-${d}`, '08:00', `${String(8 + h).padStart(2, '0')}:00`));
const one = (r) => r.items[0];

test('forty hours in a week is no overtime', () => {
  const r = overtime({ timecards: week(8) }, DEFAULTS);
  assert.equal(one(r).overtime_hours, 0); assert.equal(one(r).status, 'ok');
});

test('weekly overtime is priced as the half-time premium', () => {
  const r = overtime({ timecards: week(9) }, DEFAULTS);
  assert.equal(one(r).overtime_hours, 5); assert.equal(one(r).premium_cost, 50); assert.equal(one(r).status, 'flag');
});

test('with daily overtime, an hour is never counted twice', () => {
  const r = overtime({ timecards: week(9) }, { ...DEFAULTS, daily_ot_after: 8 });
  assert.equal(one(r).overtime_hours, 5); assert.equal(one(r).regular_hours, 40);
});

test('double time after twelve hours in a day', () => {
  const r = overtime({ timecards: [sh('2026-11-02', '06:00', '20:00')] }, { ...DEFAULTS, daily_ot_after: 8, daily_dt_after: 12 });
  assert.equal(one(r).double_time_hours, 2); assert.equal(one(r).overtime_hours, 4); assert.equal(one(r).premium_cost, 80);
});

test('an overnight shift is counted to its clock-out the next day', () => {
  const r = overtime({ timecards: [sh('2026-11-02', '18:00', '2026-11-03T02:00')] }, DEFAULTS);
  assert.equal(one(r).hours, 8);
});

test('two shifts with a long gap are a split shift; a short break is not', () => {
  const split = overtime({ timecards: [sh('2026-11-02', '07:00', '11:00'), sh('2026-11-02', '16:00', '20:00')] }, DEFAULTS);
  assert.ok(one(split).findings.some((f) => f.code === 'split_shift'));
  const lunch = overtime({ timecards: [sh('2026-11-02', '07:00', '11:00'), sh('2026-11-02', '11:30', '15:00')] }, DEFAULTS);
  assert.ok(!one(lunch).findings.some((f) => f.code === 'split_shift'));
});

test('closing late and opening early is a clopen', () => {
  const r = overtime({ timecards: [sh('2026-11-02', '16:00', '2026-11-03T00:30'), sh('2026-11-03', '07:00', '12:00')] }, DEFAULTS);
  assert.ok(one(r).findings.some((f) => f.code === 'clopen'));
});
