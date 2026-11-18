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
