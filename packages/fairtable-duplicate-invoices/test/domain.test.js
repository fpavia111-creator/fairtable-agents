// Invoices: duplicate numbers, near duplicates, line math, GL rules, missing numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invoices, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, gl_rules: [{ match: 'wine|beer', gl: '5100 Bev' }] };
const l = (extra) => ({ vendor: 'V', invoice_number: 'A1', invoice_date: '2026-11-03', item: 'Beef', qty: 2, unit_price: 10, extended: 20, gl_account: '5000 Food', ...extra });

test('a correct invoice is clean', () => {
  assert.equal(invoices({ invoices: [l({})] }, s).items[0].status, 'ok');
});

test('the same number from the same vendor on another date is a duplicate; from another vendor it is not', () => {
  const r = invoices({ invoices: [l({}), l({ invoice_date: '2026-11-09' }), l({ vendor: 'W' })] }, s);
  assert.equal(r.items.filter((i) => i.findings.some((f) => f.code === 'duplicate_number')).length, 1);
});

test('the same amount a few days apart under a new number is a possible duplicate', () => {
  const r = invoices({ invoices: [l({}), l({ invoice_number: 'A2', invoice_date: '2026-11-05' })] }, s);
  assert.ok(r.items.some((i) => i.findings.some((f) => f.code === 'possible_duplicate')));
  const far = invoices({ invoices: [l({}), l({ invoice_number: 'A2', invoice_date: '2026-11-20' })] }, s);
  assert.ok(!far.items.some((i) => i.findings.some((f) => f.code === 'possible_duplicate')));
});

test('quantity times price that is not the extended amount is flagged', () => {
  const r = invoices({ invoices: [l({ extended: 25 })] }, s);
  assert.equal(r.items[0].findings[0].code, 'line_math'); assert.equal(r.items[0].findings[0].amount, 5);
});

test('a line matching a GL rule but coded elsewhere is reviewed', () => {
  const r = invoices({ invoices: [l({ item: 'House Wine', gl_account: '5000 Food' })] }, s);
  assert.equal(r.items[0].findings[0].code, 'gl_miscoded');
});

test('a broken rule pattern is skipped, not crashed on', () => {
  const r = invoices({ invoices: [l({})] }, { ...s, gl_rules: [{ match: '(unclosed', gl: 'X' }] });
  assert.equal(r.items[0].status, 'ok');
});
