// Deliveries: invoiced against received, refused at the door, credited.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deliveries, DEFAULTS } from '../src/index.js';

const inv = (item, qty, price, n = 'I1') => ({ vendor: 'V', invoice_number: n, item, qty, unit_price: price });
const rec = (item, qty, rejected = 0, note = '', n = 'I1') => ({ vendor: 'V', invoice_number: n, item, qty_received: qty, qty_rejected: rejected, note });
const one = (r, item) => r.items.find((i) => i.item === item);

test('received in full and invoiced is clean', () => {
  const r = deliveries({ invoices: [inv('Beef', 4, 50)], receiving: [rec('Beef', 4)] }, DEFAULTS);
  assert.equal(one(r, 'Beef').status, 'ok'); assert.equal(r.totals.credit_due, 0);
});

test('a short with no credit is owed at the invoice price', () => {
  const r = deliveries({ invoices: [inv('Beef', 4, 50)], receiving: [rec('Beef', 3)] }, DEFAULTS);
  assert.equal(one(r, 'Beef').findings[0].code, 'short_not_credited'); assert.equal(one(r, 'Beef').credit_due, 50);
});

test('a short credited in full is clean; a partial credit leaves the rest owed', () => {
  const full = deliveries({ invoices: [inv('Beef', 4, 50)], receiving: [rec('Beef', 3)], credits: [{ invoice_number: 'I1', item: 'Beef', amount: 50 }] }, DEFAULTS);
  assert.equal(one(full, 'Beef').status, 'ok');
  const part = deliveries({ invoices: [inv('Beef', 4, 50)], receiving: [rec('Beef', 3)], credits: [{ invoice_number: 'I1', item: 'Beef', amount: 20 }] }, DEFAULTS);
  assert.equal(one(part, 'Beef').credit_due, 30);
});

test('cases refused at the door count even when they were delivered', () => {
  const r = deliveries({ invoices: [inv('Fish', 2, 100)], receiving: [rec('Fish', 2, 1, 'arrived warm')] }, DEFAULTS);
  assert.equal(one(r, 'Fish').findings[0].code, 'rejected_not_credited'); assert.equal(one(r, 'Fish').credit_due, 100);
});

test('more credit than the short is reviewed', () => {
  const r = deliveries({ invoices: [inv('Beef', 4, 50)], receiving: [rec('Beef', 3)], credits: [{ invoice_number: 'I1', item: 'Beef', amount: 100 }] }, DEFAULTS);
  assert.equal(one(r, 'Beef').findings[0].code, 'over_credited');
});

test('a substitute received but not invoiced, and an invoice nobody received, are both reviewed', () => {
  const r = deliveries({ invoices: [inv('Beef', 4, 50), inv('Avocado', 1, 60, 'I2')], receiving: [rec('Beef', 4), rec('Bison', 1, 0, 'substitute')] }, DEFAULTS);
  assert.equal(one(r, 'Bison').findings[0].code, 'received_not_invoiced');
  assert.equal(one(r, 'Avocado').findings[0].code, 'no_receiving_record');
});

test('the tolerance absorbs a few cents', () => {
  const r = deliveries({ invoices: [inv('Beef', 4, 50)], receiving: [rec('Beef', 3)], credits: [{ invoice_number: 'I1', item: 'Beef', amount: 49.5 }] }, DEFAULTS);
  assert.equal(one(r, 'Beef').status, 'ok');
});
