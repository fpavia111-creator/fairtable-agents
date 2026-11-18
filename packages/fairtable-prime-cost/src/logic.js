// Prime cost per location and week: food + beverage cost + labor (wages plus payroll taxes
// and benefits) as a share of net sales, against the targets in the settings.
import { str, num, round2, isoDate, nameKey, pct, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ target_prime_pct: 62, target_cogs_pct: 33, target_labor_pct: 30, flag_points: 2, trend_weeks: 3 });
const LEVELS = { prime_over_target: 'flag', cogs_over_target: 'watch', labor_over_target: 'watch', rising_prime: 'watch', missing_data: 'review' };

export function primeCost({ weeks = [] }, s = DEFAULTS) {
  const byLoc = new Map();
  for (const w of weeks) { if (!isoDate(w.week)) continue; const k = nameKey(w.location) || '(none)'; if (!byLoc.has(k)) byLoc.set(k, new Map()); const m = byLoc.get(k); const wk = isoDate(w.week); const e = m.get(wk) || { location: str(w.location), week: wk, sales: null, food: null, bev: null, labor: null, burden: null }; for (const [f, key] of [['net_sales', 'sales'], ['food_cost', 'food'], ['beverage_cost', 'bev'], ['labor_cost', 'labor'], ['labor_burden', 'burden']]) { const v = num(w[f]); if (v !== null) e[key] = (e[key] || 0) + v; } m.set(wk, e); }
  const items = []; let sales = 0, prime = 0;
  for (const [, m] of [...byLoc.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    let run = 0, prev = null;
    for (const e of [...m.values()].sort((a, b) => cmp(a.week, b.week))) {
      const f = []; const cogs = (e.food || 0) + (e.bev || 0); const labor = e.labor === null ? null : e.labor + (e.burden || 0);
      const missing = [['net sales', e.sales], ['food cost', e.food], ['labor', e.labor]].filter(([, v]) => v === null).map(([n]) => n);
      let pp = null, cp = null, lp = null;
      if (missing.length) { f.push(finding('missing_data', `${e.location}, week of ${e.week}: no ${missing.join(' or ')}, so prime cost cannot be worked out.`)); run = 0; prev = null; }
      else {
        const p = cogs + labor; pp = pct(p, e.sales); cp = pct(cogs, e.sales); lp = pct(labor, e.sales);
        if (pp > s.target_prime_pct + s.flag_points) f.push(finding('prime_over_target', `${e.location}, week of ${e.week}: prime cost ${round2(p)} is ${pp}% of sales ${round2(e.sales)}, over the ${s.target_prime_pct}% target.`, p - (s.target_prime_pct / 100) * e.sales));
        if (cp > s.target_cogs_pct) f.push(finding('cogs_over_target', `Food and beverage cost ${cp}% against a ${s.target_cogs_pct}% target.`, cogs - (s.target_cogs_pct / 100) * e.sales));
        if (lp > s.target_labor_pct) f.push(finding('labor_over_target', `Labor with taxes and benefits ${lp}% against a ${s.target_labor_pct}% target.`, labor - (s.target_labor_pct / 100) * e.sales));
        run = prev !== null && pp > prev ? run + 1 : 0; prev = pp;
        if (run >= s.trend_weeks - 1 && run > 0) f.push(finding('rising_prime', `${e.location}: prime cost has risen ${run + 1} weeks in a row, to ${pp}%.`));
        sales += e.sales; prime += p;
      }
      items.push({ line: `${e.location} ${e.week}`, location: e.location, week: e.week, net_sales: e.sales, cogs: round2(cogs), labor: labor === null ? null : round2(labor), prime_cost: pp === null ? null : round2(cogs + labor), prime_pct: pp, cogs_pct: cp, labor_pct: lp, status: statusOf(f, LEVELS), findings: f });
    }
  }
  return { items, totals: { location_weeks: items.length, net_sales: round2(sales), prime_cost: round2(prime), prime_pct: pct(prime, sales) }, extra: { target_prime_pct: s.target_prime_pct } };
}
