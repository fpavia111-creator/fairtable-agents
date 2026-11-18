// Drawers: expected cash, shorts and overs, deposits, receipts and repeats.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawers, DEFAULTS } from '../src/index.js';

const d = (extra) => ({ date: '2026-11-02', drawer: 'Bar 1', employee: 'Avery Stone', starting_bank: 300, cash_sales: 1000, paid_outs: 0, cash_tips_paid: 100, counted: 1200, deposit: 900, next_bank: 300, ...extra });
const one = (r) => r.items[0];

test('expected cash is bank + cash sales - paid-outs - tips paid; on the nose is clean', () => {
  const r = drawers({ drawers: [d({})] }, DEFAULTS);
  assert.equal(one(r).expected, 1200); assert.equal(one(r).status, 'ok');
});

test('a short over the threshold is flagged with its amount', () => {
  const r = drawers({ drawers: [d({ counted: 1190, deposit: 890 })] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'short'); assert.equal(one(r).findings[0].amount, 10);
});

test('an over is reviewed, a few cents are only watched', () => {
  assert.equal(one(drawers({ drawers: [d({ counted: 1210, deposit: 910 })] }, DEFAULTS)).findings[0].code, 'over');
  assert.equal(one(drawers({ drawers: [d({ counted: 1201.5, deposit: 901.5 })] }, DEFAULTS)).findings[0].code, 'small_difference');
});

test('a deposit that does not match the count is flagged', () => {
  const r = drawers({ drawers: [d({ deposit: 850 })] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'deposit_mismatch'); assert.equal(one(r).findings[0].amount, 50);
});

test('three shorts by the same person, written two ways, are a pattern', () => {
  const r = drawers({ drawers: [d({ counted: 1190, deposit: 890 }), d({ date: '2026-11-03', counted: 1190, deposit: 890, employee: 'Stone, Avery' }), d({ date: '2026-11-04', counted: 1190, deposit: 890 })] }, DEFAULTS);
  assert.ok(r.items.every((i) => i.findings.some((f) => f.code === 'repeat_shorts')));
});

test('a paid-out with no receipt and a drawer never counted are reviewed', () => {
  const r = drawers({ drawers: [d({ paid_outs: 20, counted: 1180, deposit: 880 }), d({ date: '2026-11-03', counted: '', deposit: '' })] }, DEFAULTS);
  assert.deepEqual(r.items.map((i) => i.findings[0].code).sort(), ['missing_count', 'paid_out_no_receipt']);
});
