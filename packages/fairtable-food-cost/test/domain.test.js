// Food cost: recipes x sales against counts and purchases, units, yields and thresholds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentRuntime } from 'fairtable-core';
import { manifest, foodCost, DEFAULTS } from '../src/index.js';

const fixtures = fileURLToPath(new URL('../fixtures', import.meta.url));
const f = { sales: 'sales.csv', recipes: 'recipes.csv', counts: 'counts.csv', purchases: 'purchases.csv' };
const counts = (item, open, close, unit = 'lb', cost = 4) => [{ count_date: '2026-11-01', item, counted_qty: open, unit, unit_cost: cost }, { count_date: '2026-11-08', item, counted_qty: close, unit, unit_cost: cost }];
const one = (name) => (r) => r.items.find((i) => i.item === name);

test('usage that matches the recipes is clean', () => {
  const r = foodCost({ sales: [{ item: 'Burger', qty: 32, net_sales: 400 }], recipes: [{ recipe: 'Burger', ingredient: 'Beef', qty: 4, unit: 'oz' }], counts: counts('Beef', 10, 2) }, DEFAULTS);
  assert.equal(one('Beef')(r).status, 'ok'); assert.equal(one('Beef')(r).variance_qty, 0);
});

test('yield raises theoretical use: 4 oz at 80% yield is 5 oz of raw product', () => {
  const r = foodCost({ sales: [{ item: 'Salad', qty: 16, net_sales: 160 }], recipes: [{ recipe: 'Salad', ingredient: 'Romaine', qty: 4, unit: 'oz', yield_pct: 80 }], counts: counts('Romaine', 10, 5) }, DEFAULTS);
  assert.equal(one('Romaine')(r).theoretical_qty, 5); assert.equal(one('Romaine')(r).status, 'ok');
});

test('cases on an invoice are read through the pack size into the count unit', () => {
  const r = foodCost({ sales: [{ item: 'Wrap', qty: 96, net_sales: 960 }], recipes: [{ recipe: 'Wrap', ingredient: 'Tortilla', qty: 1, unit: 'ea' }], counts: counts('Tortilla', 0, 0, 'ea', 0.1), purchases: [{ item: 'Tortilla', pack: '8/12 CT', qty: 1, invoice_date: '2026-11-03' }] }, DEFAULTS);
  assert.equal(one('Tortilla')(r).purchased, 96); assert.equal(one('Tortilla')(r).status, 'ok');
});

test('weight in the recipe and each on the count sheet is a mismatch, not a guess', () => {
  const r = foodCost({ sales: [{ item: 'Salad', qty: 10 }], recipes: [{ recipe: 'Salad', ingredient: 'Paste', qty: 1, unit: 'oz' }], counts: counts('Paste', 5, 4, 'ea', 3) }, DEFAULTS);
  assert.equal(one('Paste')(r).status, 'review'); assert.equal(one('Paste')(r).variance_cost, null);
  assert.equal(one('Paste')(r).findings[0].code, 'unit_mismatch');
});

test('a big gap in money and percent is flagged; a small one is watched', () => {
  const big = foodCost({ sales: [{ item: 'Wings', qty: 16, net_sales: 200 }], recipes: [{ recipe: 'Wings', ingredient: 'Wings', qty: 16, unit: 'oz' }], counts: counts('Wings', 40, 0, 'lb', 4) }, DEFAULTS);
  assert.equal(one('Wings')(big).status, 'flag'); assert.equal(one('Wings')(big).variance_cost, 96);
  const small = foodCost({ sales: [{ item: 'Wings', qty: 16, net_sales: 200 }], recipes: [{ recipe: 'Wings', ingredient: 'Wings', qty: 16, unit: 'oz' }], counts: counts('Wings', 17.5, 0, 'lb', 4) }, DEFAULTS);
  assert.equal(one('Wings')(small).status, 'watch');
});

test('a menu item sold with no recipe is listed with its sales', () => {
  const r = foodCost({ sales: [{ item: 'Soup', qty: 5, net_sales: 40 }], recipes: [], counts: [] }, DEFAULTS);
  assert.equal(one('Soup')(r).findings[0].code, 'item_sold_no_recipe'); assert.equal(r.totals.net_sales, 40);
});

test('the period comes from the count dates, and sales outside it are left out', () => {
  const r = foodCost({ sales: [{ item: 'Burger', qty: 32, net_sales: 400, date: '2026-11-03' }, { item: 'Burger', qty: 99, net_sales: 999, date: '2026-10-20' }], recipes: [{ recipe: 'Burger', ingredient: 'Beef', qty: 4, unit: 'oz' }], counts: counts('Beef', 10, 2) }, DEFAULTS);
  assert.equal(r.totals.net_sales, 400); assert.deepEqual(r.extra.period, { start: '2026-11-01', end: '2026-11-08' });
});

test('a learned invoice name counts its purchases once a person accepts it', async () => {
  const root = mkdtempSync(join(tmpdir(), 'food-cost-')); cpSync(fixtures, root, { recursive: true });
  const rt = new AgentRuntime(manifest, { root, audit: false });
  const before = await rt.call('food_cost_check', f);
  assert.ok(before.result.by_finding.purchase_not_matched);
  const l = await rt.call('food_cost_learn', { kind: 'item_alias', value: { name: 'LEMON 165CT', means: 'Lemons' } });
  const ask = await rt.call('food_cost_accept_learning', { id: l.result.fact.id, decision: 'accept' });
  assert.equal(ask.status, 'needs_approval');
  rt.approvals.approve(ask.approval_id, 'Pat Example');
  assert.equal((await rt.call('food_cost_accept_learning', { id: l.result.fact.id, decision: 'accept' })).status, 'executed');
  const after = await rt.call('food_cost_check', f);
  assert.equal(after.result.by_finding.purchase_not_matched, undefined);
  assert.equal(after.result.learned_facts.used.length, 1);
  const lemons = after.result.items.find((i) => i.item === 'Lemons');
  assert.equal(lemons.purchased, 165);
});

test('the report CSV has one row per item and blank owner and decision columns', async () => {
  const root = mkdtempSync(join(tmpdir(), 'food-cost-')); cpSync(fixtures, root, { recursive: true });
  const r = await new AgentRuntime(manifest, { root, audit: false }).call('food_cost_write_report', f);
  const csv = readFileSync(join(root, r.result.files[0]), 'utf8').trim().split(/\r?\n/);
  assert.equal(csv.length, 15); assert.match(csv[0], /owner,decision$/);
});
