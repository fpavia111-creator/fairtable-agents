// Dayparts: spreading shifts over dayparts, labor %, SPLH, overnight dayparts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayparts, DEFAULTS } from '../src/index.js';

const parts = [{ name: 'Lunch', start: '11:00', end: '15:00', target_labor_pct: 20 }, { name: 'Dinner', start: '15:00', end: '23:00', target_labor_pct: 20 }, { name: 'Late', start: '23:00', end: '03:00', target_labor_pct: 25 }];
const s = { ...DEFAULTS, dayparts: parts, labor_burden_pct: 0 };
const sale = (time, v) => ({ date: '2026-11-03', time, net_sales: v });
const tc = (a, b, rate = 20) => ({ employee: 'A', clock_in: `2026-11-03T${a}`, clock_out: b.includes('T') ? b : `2026-11-03T${b}`, rate });
const slot = (r, name) => r.items.find((i) => i.daypart === name);

test('a shift across two dayparts is split by the minutes in each', () => {
  const r = dayparts({ sales: [sale('12:00', 1000), sale('16:00', 1000)], timecards: [tc('13:00', '17:00')] }, s);
  assert.equal(slot(r, 'Lunch').labor_hours, 2); assert.equal(slot(r, 'Dinner').labor_hours, 2);
});

test('labor % over the daypart target plus the points is flagged', () => {
  const r = dayparts({ sales: [sale('12:00', 100)], timecards: [tc('11:00', '13:00')] }, s);
  assert.equal(slot(r, 'Lunch').labor_pct, 40); assert.equal(slot(r, 'Lunch').status, 'flag');
});

test('a late-night daypart that crosses midnight takes the hours after 23:00', () => {
  const r = dayparts({ sales: [sale('23:30', 400)], timecards: [tc('22:00', '2026-11-04T02:00')] }, s);
  assert.equal(slot(r, 'Late').labor_hours, 3);
});

test('labor burden raises the cost', () => {
  const r = dayparts({ sales: [sale('12:00', 1000)], timecards: [tc('11:00', '13:00')] }, { ...s, labor_burden_pct: 10 });
  assert.equal(slot(r, 'Lunch').labor_cost, 44);
});

test('hours with no sales and sales with no time are reviewed', () => {
  const r = dayparts({ sales: [{ date: '2026-11-03', net_sales: 50 }], timecards: [tc('11:00', '12:00')] }, s);
  assert.deepEqual(r.items.map((i) => i.findings[0].code).sort(), ['labor_no_sales', 'sales_no_time']);
});

test('sales per labor hour under the bar is watched', () => {
  const r = dayparts({ sales: [sale('12:00', 50)], timecards: [tc('11:00', '12:00', 1)] }, { ...s, min_sales_per_labor_hour: 60 });
  assert.ok(slot(r, 'Lunch').findings.some((f) => f.code === 'low_splh'));
});
