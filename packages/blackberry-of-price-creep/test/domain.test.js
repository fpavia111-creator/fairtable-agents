// Price creep: price per base unit through pack sizes, bids, creep and pack changes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceCreep, DEFAULTS } from '../src/index.js';

const l = (date, price, pack = '1/10 LB', qty = 1, item = 'Beef', vendor = 'V') => ({ vendor, item, pack, unit_price: price, qty, invoice_date: date, invoice_number: date });
const one = (r) => r.items[0];

test('a steady price is clean', () => {
  const r = priceCreep({ invoices: [l('2026-10-01', 50), l('2026-11-01', 50)] }, DEFAULTS);
  assert.equal(one(r).status, 'ok'); assert.equal(one(r).extra_paid, 0);
});

test('extra paid is the rise per pound times the pounds bought after the first price', () => {
  const r = priceCreep({ invoices: [l('2026-10-01', 50), l('2026-10-08', 55, '1/10 LB', 10)] }, DEFAULTS);
  assert.equal(one(r).extra_paid, 50); assert.equal(one(r).status, 'flag');
});

test('a rise below the money threshold is only watched', () => {
  const r = priceCreep({ invoices: [l('2026-10-01', 50), l('2026-10-08', 55)] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'small_price_up'); assert.equal(one(r).status, 'watch');
});

test('a smaller pack at the same case price is a rise per pound', () => {
  const r = priceCreep({ invoices: [l('2026-10-01', 90, '1/10 LB', 3), l('2026-10-08', 90, '1/9 LB', 3)] }, DEFAULTS);
  assert.ok(one(r).findings.some((f) => f.code === 'pack_changed')); assert.equal(one(r).change_pct, 11.1);
});

test('a price over the bid inside its dates is flagged; an expired bid is ignored', () => {
  const bid = { vendor: 'V', item: 'Beef', pack: '1/10 LB', price: 50, valid_from: '2026-09-01', valid_to: '2026-12-31' };
  const r = priceCreep({ invoices: [l('2026-10-01', 52)], contracts: [bid] }, DEFAULTS);
  assert.equal(one(r).findings[0].code, 'over_contract'); assert.equal(one(r).findings[0].amount, 2);
  const old = priceCreep({ invoices: [l('2026-10-01', 52)], contracts: [{ ...bid, valid_to: '2026-09-30' }] }, DEFAULTS);
  assert.equal(one(old).status, 'ok');
});

test('three rises in a row are steady creep', () => {
  const r = priceCreep({ invoices: [l('2026-10-01', 50), l('2026-10-08', 50.5), l('2026-10-15', 51), l('2026-10-22', 51.5)] }, DEFAULTS);
  assert.ok(one(r).findings.some((f) => f.code === 'steady_creep'));
});

test('the same item from two vendors is followed separately', () => {
  const r = priceCreep({ invoices: [l('2026-10-01', 50, '1/10 LB', 1, 'Beef', 'A'), l('2026-10-08', 60, '1/10 LB', 1, 'Beef', 'B')] }, DEFAULTS);
  assert.equal(r.items.length, 2); assert.ok(r.items.every((i) => i.status === 'ok'));
});

test('a pack that cannot be read is reviewed, not guessed', () => {
  const r = priceCreep({ invoices: [l('2026-10-01', 50, 'CASE')] }, DEFAULTS);
  assert.equal(one(r).status, 'review'); assert.equal(one(r).last_price, null);
});
