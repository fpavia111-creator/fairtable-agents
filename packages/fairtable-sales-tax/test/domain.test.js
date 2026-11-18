// Sales tax: rates by location and category, marketplace orders, exemptions, tolerance.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salesTax, DEFAULTS } from '../src/index.js';

const s = { ...DEFAULTS, locations: { Main: { jurisdiction: 'X', rate_pct: 8, category_rates: { Alcohol: 10 } } } };
const r = (extra) => ({ location: 'Main', channel: 'Dine-in', category: 'Food', net_sales: 1000, tax: 80, ...extra });
const one = (x) => x.items[0];

test('tax at the location rate is clean', () => {
  assert.equal(one(salesTax({ sales: [r({})] }, s)).status, 'ok');
});

test('a category rate wins over the location rate', () => {
  const x = salesTax({ sales: [r({ category: 'Alcohol', tax: 80 })] }, s);
  assert.equal(one(x).tax_expected, 100); assert.equal(one(x).findings[0].code, 'under_collected');
});

test('over-collection is reviewed, not kept', () => {
  assert.equal(one(salesTax({ sales: [r({ tax: 95 })] }, s)).findings[0].code, 'over_collected');
});

test('a few cents of rounding are within the tolerance', () => {
  assert.equal(one(salesTax({ sales: [r({ tax: 79.5 })] }, s)).status, 'ok');
});

test('marketplace orders expect no tax in the POS and are kept apart', () => {
  const x = salesTax({ sales: [r({}), r({ channel: 'DoorDash', tax: 8 })] }, s);
  assert.equal(x.items.length, 2); assert.ok(x.items.some((i) => i.findings.some((f) => f.code === 'marketplace_tax_in_pos')));
});

test('exempt sales are listed for their certificates; an unknown location is reviewed', () => {
  const x = salesTax({ sales: [r({ tax_exempt: 'yes', tax: 0 }), r({ location: 'Kiosk' })] }, s);
  assert.deepEqual(x.items.map((i) => i.findings[0].code).sort(), ['exempt_sales', 'unknown_location']);
});
