// Delivery-app marketing fees and restaurant-funded promotions against the campaigns the
// restaurant opted into: what each campaign cost, what it brought in, and charges with
// no campaign behind them.
import { str, num, round2, isoDate, nameKey, inWindow, readYesNo, pct, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ min_return: 4, target_share_pct: 10, tolerance: 0.05 });
const LEVELS = { fee_outside_campaign: 'flag', not_opted_in: 'flag', over_budget: 'flag', low_return: 'watch', marketing_share_high: 'watch' };
const isAd = (t) => /ad|sponsor|search|listing/i.test(str(t));

export function marketingFees({ statements = [], campaigns = [] }, s = DEFAULTS) {
  const camp = campaigns.filter((c) => str(c.campaign)).map((c) => ({ c, key: `${str(c.platform)}|${str(c.campaign)}`, pk: nameKey(c.platform), ad: isAd(c.type), spend: 0, sales: 0, orders: 0 }));
  // Campaigns indexed once by platform and type, so each charge looks at its own platform's campaigns only.
  const byPlat = new Map(); for (const x of camp) { const k = `${x.pk}|${x.ad}`; if (!byPlat.has(k)) byPlat.set(k, []); byPlat.get(k).push(x); }
  const loose = new Map(); const plat = new Map();
  for (const l of statements) {
    const p = str(l.platform); const d = isoDate(l.date); const sub = num(l.subtotal) || 0;
    const pe = plat.get(nameKey(p)) || { platform: p, sales: 0, spend: 0 }; pe.sales += sub; plat.set(nameKey(p), pe);
    for (const [field, ad] of [['marketing_fee', true], ['promo_funded', false]]) {
      const amt = Math.abs(num(l[field]) || 0); if (!amt) continue; pe.spend += amt;
      const hit = (byPlat.get(`${nameKey(p)}|${ad}`) || []).find((x) => inWindow(d, x.c.start, x.c.end));
      if (hit) { hit.spend += amt; hit.sales += sub; hit.orders++; }
      else { const k = `${nameKey(p)}|${ad ? 'ads' : 'promo'}`; const e = loose.get(k) || { platform: p, kind: ad ? 'ad fees' : 'promotions', spend: 0, sales: 0, orders: [], dates: [] }; e.spend += amt; e.sales += sub; e.orders.push(str(l.order_id)); e.dates.push(d); loose.set(k, e); }
    }
  }
  const items = []; let spend = 0, unexplained = 0;
  for (const x of camp.sort((a, b) => cmp(a.key, b.key))) {
    const f = []; const budget = num(x.c.budget); const ret = x.spend ? round2(x.sales / x.spend) : null; const opted = readYesNo(x.c.opted_in);
    if (x.spend > 0 && opted === false) { f.push(finding('not_opted_in', `${str(x.c.platform)} charged ${round2(x.spend)} for "${str(x.c.campaign)}", which the campaign list says was not opted into.`, x.spend)); unexplained += x.spend; }
    if (budget !== null && x.spend > budget + s.tolerance) f.push(finding('over_budget', `"${str(x.c.campaign)}" cost ${round2(x.spend)} against a budget of ${budget}.`, x.spend - budget));
    if (ret !== null && ret < s.min_return && opted !== false) f.push(finding('low_return', `"${str(x.c.campaign)}": ${round2(x.sales)} of orders for ${round2(x.spend)} spent, ${ret} in sales for each 1 spent (under ${s.min_return}).`));
    spend += x.spend;
    items.push({ campaign: str(x.c.campaign), platform: str(x.c.platform), type: str(x.c.type), window: `${isoDate(x.c.start) || ''} to ${isoDate(x.c.end) || ''}`, budget, spend: round2(x.spend), orders: x.orders, order_sales: round2(x.sales), sales_per_dollar: ret, status: statusOf(f, LEVELS), findings: f });
  }
  for (const e of [...loose.values()].sort((a, b) => cmp(`${a.platform}|${a.kind}`, `${b.platform}|${b.kind}`))) {
    const f = [finding('fee_outside_campaign', `${e.platform} charged ${round2(e.spend)} in ${e.kind} on ${e.orders.length} order(s) (${e.orders.join(', ')}) on dates no opted-in campaign covers (${[...new Set(e.dates)].sort().join(', ')}).`, e.spend)];
    spend += e.spend; unexplained += e.spend;
    items.push({ campaign: `(no campaign) ${e.platform} ${e.kind}`, platform: e.platform, type: e.kind, window: '', budget: null, spend: round2(e.spend), orders: e.orders.length, order_sales: round2(e.sales), sales_per_dollar: null, status: statusOf(f, LEVELS), findings: f });
  }
  for (const pe of [...plat.values()].sort((a, b) => cmp(a.platform, b.platform))) {
    const share = pct(pe.spend, pe.sales);
    if (share !== null && share > s.target_share_pct) items.push({ campaign: `${pe.platform} marketing share`, platform: pe.platform, type: 'total', window: '', budget: null, spend: round2(pe.spend), orders: null, order_sales: round2(pe.sales), sales_per_dollar: pe.spend ? round2(pe.sales / pe.spend) : null, status: 'watch', findings: [finding('marketing_share_high', `${pe.platform}: marketing and promotions are ${share}% of its sales (${round2(pe.spend)} of ${round2(pe.sales)}), over the ${s.target_share_pct}% target.`, pe.spend)] });
  }
  return { items, totals: { campaigns: camp.length, marketing_spend: round2(spend), unexplained_spend: round2(unexplained), platforms: plat.size } };
}
