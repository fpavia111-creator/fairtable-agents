// Marketing fees: attribution to campaigns, opt-in, budgets, return and share.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { marketingFees, DEFAULTS } from '../src/index.js';

const l = (date, mkt, promo = 0, sub = 50, platform = 'DoorDash', id = date) => ({ platform, order_id: id, date, subtotal: sub, marketing_fee: mkt, promo_funded: promo });
const c = (extra) => ({ platform: 'DoorDash', campaign: 'Ads', type: 'ads', start: '2026-11-01', end: '2026-11-07', budget: 10, opted_in: 'yes', ...extra });
const find = (r, name) => r.items.find((i) => i.campaign === name);

test('ad fees inside an opted-in campaign within budget are clean', () => {
  const r = marketingFees({ statements: [l('2026-11-02', 3), l('2026-11-03', 3)], campaigns: [c({})] }, { ...DEFAULTS, target_share_pct: 50 });
  assert.equal(find(r, 'Ads').status, 'ok'); assert.equal(find(r, 'Ads').spend, 6);
});

test('ad fees after the campaign ended have no campaign behind them', () => {
  const r = marketingFees({ statements: [l('2026-11-09', 3)], campaigns: [c({})] }, { ...DEFAULTS, target_share_pct: 50 });
  assert.equal(r.items.find((i) => i.findings.some((f) => f.code === 'fee_outside_campaign')).spend, 3);
});

test('a promotion the restaurant never opted into is flagged in full', () => {
  const r = marketingFees({ statements: [l('2026-11-02', 0, 6)], campaigns: [c({ campaign: 'BOGO', type: 'promo', opted_in: 'no' })] }, { ...DEFAULTS, target_share_pct: 50 });
  assert.equal(find(r, 'BOGO').findings[0].code, 'not_opted_in');
});

test('spend over budget is flagged by the excess', () => {
  const r = marketingFees({ statements: [l('2026-11-02', 6), l('2026-11-03', 6)], campaigns: [c({})] }, { ...DEFAULTS, target_share_pct: 50 });
  assert.equal(find(r, 'Ads').findings[0].amount, 2);
});

test('ads and promotions are attributed to campaigns of their own type', () => {
  const r = marketingFees({ statements: [l('2026-11-02', 3, 5)], campaigns: [c({}), c({ campaign: 'Promo', type: 'promo', budget: 50 })] }, { ...DEFAULTS, target_share_pct: 50 });
  assert.equal(find(r, 'Ads').spend, 3); assert.equal(find(r, 'Promo').spend, 5);
});

test('a platform spending over the target share of its sales is watched', () => {
  const r = marketingFees({ statements: [l('2026-11-02', 10, 0, 50)], campaigns: [c({ budget: 100 })] }, DEFAULTS);
  assert.ok(r.items.some((i) => i.findings.some((f) => f.code === 'marketing_share_high')));
});
