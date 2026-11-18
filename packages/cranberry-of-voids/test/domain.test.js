// Voids and comps: self approval, after close, rates, approvals, whole checks, masking.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentRuntime } from 'fairtable-core';
import { manifest, voids, DEFAULTS } from '../src/index.js';

const v = (extra) => ({ check: '1', date: '2026-11-06', time: '19:00', employee: 'Avery Stone', approver: 'Morgan Blake', type: 'void', amount: 10, reason: 'wrong item', check_total: 40, closed_at: '2026-11-06T20:00', ...extra });
const one = (r) => r.items[0];

test('a void approved by a manager, with a reason, before close, is clean', () => {
  assert.equal(one(voids({ checks: [v({})] }, DEFAULTS)).status, 'ok');
});

test('approving your own void is flagged whatever the name order', () => {
  const r = voids({ checks: [v({ approver: 'Stone, Avery' })] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'self_approved');
});

test('a void after the check closed is flagged', () => {
  const r = voids({ checks: [v({ time: '20:30' })] }, DEFAULTS);
  assert.ok(one(r).findings.some((f) => f.code === 'after_close'));
});

test('the void rate is measured against the employee\'s own sales', () => {
  const r = voids({ checks: [v({ amount: 40 })], server_sales: [{ employee: 'Avery Stone', net_sales: 1000 }] }, DEFAULTS);
  assert.equal(one(r).void_comp_pct, 4); assert.ok(one(r).findings.some((f) => f.code === 'high_void_rate'));
});

test('a comp over the limit with no approver is reviewed', () => {
  const r = voids({ checks: [v({ type: 'comp', amount: 25, approver: '' })] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'no_approver');
});

test('names never reach the model, but the report file keeps them', async () => {
  const root = mkdtempSync(join(tmpdir(), 'cranberry-')); cpSync(fileURLToPath(new URL('../fixtures', import.meta.url)), root, { recursive: true });
  const rt = new AgentRuntime(manifest, { root, audit: false });
  const c = await rt.call('cranberry_check', { checks: 'checks.csv', server_sales: 'server_sales.csv' });
  assert.doesNotMatch(JSON.stringify(c), /Avery|Ortiz|Patel|Chen|Blake/);
  const r = await rt.call('cranberry_write_report', { checks: 'checks.csv', server_sales: 'server_sales.csv' });
  assert.doesNotMatch(JSON.stringify(r), /Avery/);
  assert.match(readFileSync(join(root, r.result.files[0]), 'utf8'), /Avery Stone/);
});
