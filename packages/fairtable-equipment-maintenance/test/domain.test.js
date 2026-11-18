// Equipment: due dates from intervals, defaults by type, service log, repeated repairs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equipment, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, as_of: '2026-11-15', default_intervals: { Hood: 90 } };
const e = (extra) => ({ equipment: 'Hood', type: 'Hood', last_service: '2026-10-01', ...extra });
const one = (r) => r.items[0];

test('the due date is the last service plus the type default', () => {
  const r = equipment({ equipment: [e({})] }, s);
  assert.equal(one(r).due_date, '2026-12-30'); assert.equal(one(r).status, 'ok');
});

test('an interval on the list wins over the default', () => {
  const r = equipment({ equipment: [e({ interval_days: 30 })] }, s);
  assert.equal(one(r).due_date, '2026-10-31'); assert.equal(one(r).findings[0].code, 'overdue');
});

test('a later service in the log moves the due date', () => {
  const r = equipment({ equipment: [e({ last_service: '2026-06-01' })], service_log: [{ equipment: 'hood', date: '2026-10-01', kind: 'service' }] }, s);
  assert.equal(one(r).last_service, '2026-10-01'); assert.equal(one(r).status, 'ok');
});

test('due within the window is watched', () => {
  const r = equipment({ equipment: [e({ last_service: '2026-08-25' })] }, s);
  assert.equal(one(r).findings[0].code, 'due_soon'); assert.equal(one(r).days_left, 8);
});

test('no date and no interval are reviewed', () => {
  const r = equipment({ equipment: [e({ last_service: '' }), e({ equipment: 'Mixer', type: 'Mixer' })] }, s);
  assert.deepEqual(r.items.map((i) => i.findings[0].code).sort(), ['no_interval', 'no_last_service']);
});

test('three repairs in the window are listed with their cost; repairs do not reset the schedule', () => {
  const log = ['2026-09-01', '2026-10-01', '2026-11-01'].map((date) => ({ equipment: 'Hood', date, kind: 'repair', cost: 100 }));
  const r = equipment({ equipment: [e({ last_service: '2026-07-01' })], service_log: log }, s);
  assert.ok(one(r).findings.some((f) => f.code === 'repeat_repairs')); assert.equal(one(r).last_service, '2026-07-01');
});
