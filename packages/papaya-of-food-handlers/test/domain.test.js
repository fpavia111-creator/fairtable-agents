// Food handler cards: grace period, expiries, managers per location, alcohol servers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foodHandlers, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, as_of: '2026-11-15', manager_per_location: false };
const p = (extra) => ({ employee: 'Ana Rivera', role: 'Cook', location: 'A', hire_date: '2025-01-01', status: 'active', ...extra });
const c = (type, expires, extra) => ({ employee: 'Ana Rivera', cert_type: type, number: 'X1', expires, ...extra });
const one = (r) => r.items[0];

test('a current card is clean', () => {
  assert.equal(one(foodHandlers({ roster: [p({})], certificates: [c('Food handler', '2027-05-01')] }, s)).status, 'ok');
});

test('a new hire inside the grace period is watched; after it, flagged', () => {
  assert.equal(one(foodHandlers({ roster: [p({ hire_date: '2026-11-01' })], certificates: [] }, s)).findings[0].code, 'in_grace_period');
  assert.equal(one(foodHandlers({ roster: [p({ hire_date: '2026-09-01' })], certificates: [] }, s)).findings[0].code, 'missing_card');
});

test('the latest card counts when there are several, and names match across orders', () => {
  const r = foodHandlers({ roster: [p({})], certificates: [c('Food handler', '2025-01-01'), c('Food handler', '2028-01-01', { employee: 'Rivera, Ana' })] }, s);
  assert.equal(one(r).status, 'ok');
});

test('expired and expiring certificates', () => {
  assert.equal(one(foodHandlers({ roster: [p({})], certificates: [c('Food handler', '2026-10-01')] }, s)).findings[0].code, 'expired');
  assert.equal(one(foodHandlers({ roster: [p({})], certificates: [c('Food handler', '2026-12-01')] }, s)).findings[0].code, 'expiring_soon');
});

test('a location with no current certified manager is flagged', () => {
  const r = foodHandlers({ roster: [p({})], certificates: [c('Food handler', '2027-05-01'), c('Food protection manager', '2026-01-01')] }, { ...s, manager_per_location: true });
  assert.ok(r.items.some((i) => i.findings.some((f) => f.code === 'no_certified_manager')));
});

test('inactive staff are ignored and bartenders need an alcohol certificate', () => {
  const r = foodHandlers({ roster: [p({ status: 'inactive' }), p({ employee: 'Bo Lin', role: 'Bartender' })], certificates: [c('Food handler', '2027-05-01', { employee: 'Bo Lin' })] }, s);
  assert.equal(r.items.length, 1); assert.equal(one(r).findings[0].code, 'alcohol_cert_missing');
});
