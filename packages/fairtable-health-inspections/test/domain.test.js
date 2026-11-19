// Inspections and permits: re-inspections, criticals, scores, routine estimate, expiries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspections, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, as_of: '2026-11-15' };
const i = (date, extra) => ({ location: 'A', date, type: 'Routine', score: 95, critical_violations: 0, ...extra });
const loc = (r) => r.items.find((x) => x.kind === 'inspections');

test('a clean recent inspection is ok', () => {
  assert.equal(loc(inspections({ inspections: [i('2026-10-01', {})] }, s)).status, 'ok');
});

test('a re-inspection due and not on file is flagged; one on file clears it', () => {
  const due = [i('2026-09-01', { critical_violations: 1, reinspection_due: '2026-09-15' })];
  assert.equal(loc(inspections({ inspections: due }, s)).status, 'flag');
  assert.equal(loc(inspections({ inspections: [...due, i('2026-09-14', { type: 'Re-inspection' })] }, s)).status, 'ok');
});

test('a drop in score is reviewed', () => {
  const r = inspections({ inspections: [i('2026-03-01', { score: 98 }), i('2026-10-01', { score: 90 })] }, s);
  assert.equal(loc(r).findings[0].code, 'score_drop');
});

test('the next routine visit is estimated from the last routine one', () => {
  const r = inspections({ inspections: [i('2026-06-01', {})] }, s);
  assert.equal(loc(r).next_date, '2026-11-28'); assert.equal(loc(r).findings[0].code, 'routine_due');
});

test('permits expired, expiring and undated', () => {
  const r = inspections({ inspections: [], permits: [{ location: 'A', permit: 'X', expires: '2026-11-01' }, { location: 'A', permit: 'Y', expires: '2026-12-01' }, { location: 'A', permit: 'Z', expires: '' }] }, s);
  assert.deepEqual(r.items.map((x) => x.findings[0].code).sort(), ['no_expiry', 'permit_expired', 'permit_expiring']);
});

test('locations are kept apart', () => {
  const r = inspections({ inspections: [i('2026-10-01', {}), i('2026-10-01', { location: 'B', critical_violations: 2 })] }, s);
  assert.equal(r.items.length, 2); assert.equal(r.items.find((x) => x.location === 'B').status, 'flag');
});

test('a score that counts violation points: a rise is the drop', () => {
  const s = { ...DEFAULTS, as_of: '2026-11-15', lower_score_is_better: true };
  const r = inspections({ inspections: [{ location: 'A', date: '2026-01-10', type: 'Cycle Inspection / Initial Inspection', score: 9, critical_violations: 0 }, { location: 'A', date: '2026-09-10', type: 'Cycle Inspection / Initial Inspection', score: 21, critical_violations: 0 }] }, s);
  assert.ok(r.items[0].findings.some((f) => f.code === 'score_drop' && /rose from 9 to 21/.test(f.detail)));
  const better = inspections({ inspections: [{ location: 'A', date: '2026-01-10', type: 'Routine', score: 21 }, { location: 'A', date: '2026-09-10', type: 'Routine', score: 9 }] }, s);
  assert.ok(!better.items[0].findings.some((f) => f.code === 'score_drop'));
});

test('New York City cycle inspections count as routine by default', () => {
  const r = inspections({ inspections: [{ location: 'A', date: '2025-12-01', type: 'Cycle Inspection / Initial Inspection', score: 10 }] }, { ...DEFAULTS, as_of: '2026-11-15' });
  assert.ok(r.items[0].findings.some((f) => f.code === 'routine_due'));
});

test('an inspection on the same day does not close or open a critical violation', () => {
  const rows = [{ location: 'A', date: '2026-01-08', type: 'Cycle Inspection / Initial Inspection', score: 10, critical_violations: 1 }, { location: 'A', date: '2026-01-08', type: 'Administrative Miscellaneous / Initial Inspection', score: '', critical_violations: 0 }];
  const a = inspections({ inspections: rows }, { ...DEFAULTS, as_of: '2026-11-15' });
  const b = inspections({ inspections: [rows[1], rows[0]] }, { ...DEFAULTS, as_of: '2026-11-15' });
  assert.deepEqual(a.items[0].findings.map((f) => f.code), b.items[0].findings.map((f) => f.code));
  assert.ok(a.items[0].findings.some((f) => f.code === 'critical_open'));
});

test('with a follow-up score, a critical violation at a passing score is not reported as open', () => {
  const s = { ...DEFAULTS, as_of: '2026-11-15', lower_score_is_better: true, followup_score: 14 };
  const pass = inspections({ inspections: [{ location: 'A', date: '2026-09-01', type: 'Cycle Inspection / Initial Inspection', score: 10, critical_violations: 1 }] }, s);
  assert.ok(!pass.items[0].findings.some((f) => f.code === 'critical_open'));
  const fail = inspections({ inspections: [{ location: 'A', date: '2026-09-01', type: 'Cycle Inspection / Initial Inspection', score: 27, critical_violations: 2 }] }, s);
  assert.ok(fail.items[0].findings.some((f) => f.code === 'critical_open'));
});
