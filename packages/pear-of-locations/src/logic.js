// Multi-unit comparison: each location's measures against the group median, so a location
// is compared with its sister restaurants rather than with a textbook number.
import { str, num, round2, nameKey, pct, median, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ points: { food_pct: 2, labor_pct: 3, prime_pct: 3, void_pct: 0.5, comp_pct: 0.5, discount_pct: 1 }, avg_check_drop_pct: 15 });
const MEASURES = { food_pct: 'food and beverage cost', labor_pct: 'labor', prime_pct: 'prime cost', void_pct: 'voids', comp_pct: 'comps', discount_pct: 'discounts' };
const LEVELS = { food_pct_high: 'flag', labor_pct_high: 'flag', prime_pct_high: 'flag', void_pct_high: 'flag', comp_pct_high: 'watch', discount_pct_high: 'watch', avg_check_low: 'watch', missing_sales: 'review' };

export function locations({ locations: rows = [] }, s = DEFAULTS) {
  const by = new Map();
  for (const r of rows) { if (!str(r.location)) continue; const k = nameKey(r.location); const e = by.get(k) || { location: str(r.location), sales: 0, food: 0, bev: 0, labor: 0, voids: 0, comps: 0, discounts: 0, checks: 0 }; for (const [f, key] of [['net_sales', 'sales'], ['food_cost', 'food'], ['beverage_cost', 'bev'], ['labor_cost', 'labor'], ['voids', 'voids'], ['comps', 'comps'], ['discounts', 'discounts'], ['checks', 'checks']]) e[key] += num(r[f]) || 0; by.set(k, e); }
  const list = [...by.values()].sort((a, b) => cmp(nameKey(a.location), nameKey(b.location)));
  const m = (e) => ({ food_pct: pct(e.food + e.bev, e.sales), labor_pct: pct(e.labor, e.sales), prime_pct: pct(e.food + e.bev + e.labor, e.sales), void_pct: pct(e.voids, e.sales), comp_pct: pct(e.comps, e.sales), discount_pct: pct(e.discounts, e.sales), avg_check: e.checks ? round2(e.sales / e.checks) : null });
  const vals = list.map((e) => ({ e, v: m(e) }));
  const med = Object.fromEntries([...Object.keys(MEASURES), 'avg_check'].map((k) => [k, median(vals.filter((x) => x.e.sales > 0).map((x) => x.v[k]).filter((x) => x !== null))]));
  const pts = { ...DEFAULTS.points, ...(s.points || {}) };
  const items = [];
  for (const { e, v } of vals) {
    const f = [];
    if (!e.sales) f.push(finding('missing_sales', `${e.location} has no sales in the file, so its shares cannot be compared.`));
    else {
      for (const [k, label] of Object.entries(MEASURES)) if (v[k] !== null && med[k] !== null && v[k] > med[k] + pts[k]) f.push(finding(`${k}_high`, `${e.location}: ${label} ${v[k]}% of sales against a group median of ${round2(med[k])}% (+${round2(v[k] - med[k])} points, about ${round2(((v[k] - med[k]) / 100) * e.sales)}).`, ((v[k] - med[k]) / 100) * e.sales));
      if (v.avg_check !== null && med.avg_check && v.avg_check < med.avg_check * (1 - s.avg_check_drop_pct / 100)) f.push(finding('avg_check_low', `${e.location}: average check ${v.avg_check} against a group median of ${round2(med.avg_check)}.`));
    }
    items.push({ location: e.location, net_sales: round2(e.sales), ...v, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { locations: items.length, group_sales: round2(list.reduce((t, e) => t + e.sales, 0)) }, extra: { group_median: Object.fromEntries(Object.entries(med).map(([k, x]) => [k, x === null ? null : round2(x)])) } };
}
