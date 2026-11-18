// Schedule against actual: minutes early and late, no-shows, unscheduled shifts, extra hours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schedules, DEFAULTS } from '../src/index.js';

const s = (day, a, b, emp = 'A') => ({ employee: emp, role: 'Cook', start: `${day}T${a}`, end: `${day}T${b}` });
const p = (day, a, b, emp = 'A', rate = 20) => ({ employee: emp, role: 'Cook', clock_in: `${day}T${a}`, clock_out: b ? `${day}T${b}` : '', rate });
const one = (r) => r.items[0];

test('punches inside the grace minutes are clean', () => {
  const r = schedules({ schedule: [s('2026-11-03', '10:00', '18:00')], timecards: [p('2026-11-03', '09:55', '18:05')] }, DEFAULTS);
  assert.equal(one(r).status, 'ok');
});

test('early in and late out are counted in minutes and priced', () => {
  const r = schedules({ schedule: [s('2026-11-03', '10:00', '18:00')], timecards: [p('2026-11-03', '09:30', '18:30')] }, DEFAULTS);
  assert.equal(one(r).early_minutes, 30); assert.equal(one(r).late_out_minutes, 30);
  assert.equal(one(r).findings.find((f) => f.code === 'early_clock_in').amount, 10);
});

test('a scheduled shift with no punch is a no-show; a punch with no shift is unscheduled', () => {
  const r = schedules({ schedule: [s('2026-11-03', '10:00', '18:00')], timecards: [p('2026-11-04', '10:00', '18:00')] }, DEFAULTS);
  assert.deepEqual(one(r).findings.map((f) => f.code).sort(), ['no_show', 'unscheduled_shift']);
});

test('a week well over schedule is flagged with the cost of the extra hours', () => {
  const r = schedules({ schedule: [s('2026-11-03', '10:00', '14:00')], timecards: [p('2026-11-03', '10:00', '17:00')] }, DEFAULTS);
  assert.equal(one(r).extra_hours, 3); assert.equal(one(r).findings.find((f) => f.code === 'over_schedule').amount, 60);
});

test('people are matched across name orders', () => {
  const r = schedules({ schedule: [s('2026-11-03', '10:00', '18:00', 'Lee, Jordan')], timecards: [p('2026-11-03', '10:00', '18:00', 'Jordan Lee')] }, DEFAULTS);
  assert.equal(r.items.length, 1); assert.equal(one(r).status, 'ok');
});

test('late arrival is watched', () => {
  const r = schedules({ schedule: [s('2026-11-03', '10:00', '18:00')], timecards: [p('2026-11-03', '10:25', '18:00')] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'late_arrival');
});
