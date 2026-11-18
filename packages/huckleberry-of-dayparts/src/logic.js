// Labor percentage by daypart: every timecard's minutes are spread over the dayparts they
// fall in (15-minute steps), priced at the person's rate plus the labor burden, and set
// against the sales rung in the same daypart.
import { str, num, round2, isoDate, minutesOf, daypartOf, hoursBetween, pct, cmp, finding, statusOf, clock } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ dayparts: [{ name: 'Breakfast', start: '06:00', end: '11:00', target_labor_pct: 30 }, { name: 'Lunch', start: '11:00', end: '16:00', target_labor_pct: 25 }, { name: 'Dinner', start: '16:00', end: '22:00', target_labor_pct: 22 }, { name: 'Late night', start: '22:00', end: '03:00', target_labor_pct: 25 }], flag_points: 3, min_sales_per_labor_hour: 60, labor_burden_pct: 0 });
const LEVELS = { labor_over_target: 'flag', labor_no_sales: 'review', low_splh: 'watch', sales_no_time: 'review', near_target: 'watch' };

export function dayparts({ sales = [], timecards = [] }, s = DEFAULTS) {
  const parts = s.dayparts || [];
  const slots = new Map(); const slot = (date, part) => { const k = `${date} ${part}`; if (!slots.has(k)) slots.set(k, { slot: k, date, daypart: part, sales: 0, hours: 0, cost: 0, people: new Set() }); return slots.get(k); };
  let untimed = 0, untimedCount = 0, totalSales = 0, totalCost = 0;
  for (const x of sales) {
    const v = num(x.net_sales) || 0; totalSales += v;
    const d = isoDate(x.date); const m = minutesOf(x.time);
    if (!d || m === null) { untimed += v; untimedCount++; continue; }
    slot(d, daypartOf(x.time, parts)).sales += v;
  }
  const burden = 1 + (Number(s.labor_burden_pct) || 0) / 100;
  for (const p of timecards) {
    const a = str(p.clock_in), b = str(p.clock_out); const d = isoDate(a); const h = hoursBetween(a, b); const rate = num(p.rate) || 0;
    if (!d || h === null || h <= 0) continue;
    const start = minutesOf(a); const paidH = Math.max(0, h - (num(p.break_minutes) || 0) / 60); const share = paidH / h;
    for (let t = 0; t < h * 60; t += 15) {
      const step = Math.min(15, h * 60 - t) / 60; const at = clock(start + t);
      const sl = slot(d, daypartOf(at, parts)); sl.hours += step * share; sl.cost += step * share * rate * burden; sl.people.add(str(p.employee));
    }
  }
  const items = [];
  for (const sl of [...slots.values()].sort((x, y) => cmp(x.slot, y.slot))) {
    const f = []; const part = parts.find((x) => x.name === sl.daypart); const target = part ? num(part.target_labor_pct) : null;
    const lp = pct(sl.cost, sl.sales); const splh = sl.hours ? round2(sl.sales / sl.hours) : null;
    totalCost += sl.cost;
    if (sl.cost > 0 && sl.sales === 0) f.push(finding('labor_no_sales', `${sl.slot}: ${round2(sl.hours)} labor hours (${round2(sl.cost)}) and no sales. Prep and opening time is real, but check it is planned.`, sl.cost));
    else if (lp !== null && target !== null && lp > target + s.flag_points) f.push(finding('labor_over_target', `${sl.slot}: labor ${round2(sl.cost)} on sales ${round2(sl.sales)} is ${lp}%, over the ${target}% target for ${sl.daypart}.`, sl.cost - (target / 100) * sl.sales));
    else if (lp !== null && target !== null && lp > target) f.push(finding('near_target', `${sl.slot}: labor ${lp}% against a ${target}% target.`));
    if (splh !== null && sl.sales > 0 && splh < s.min_sales_per_labor_hour) f.push(finding('low_splh', `${sl.slot}: ${splh} in sales per labor hour, under ${s.min_sales_per_labor_hour}.`));
    items.push({ slot: sl.slot, date: sl.date, daypart: sl.daypart, net_sales: round2(sl.sales), labor_hours: round2(sl.hours), labor_cost: round2(sl.cost), labor_pct: lp, target_pct: target, sales_per_labor_hour: splh, people: sl.people.size, status: statusOf(f, LEVELS), findings: f });
  }
  if (untimedCount) items.push({ slot: 'Sales with no time', date: null, daypart: '', net_sales: round2(untimed), labor_hours: 0, labor_cost: 0, labor_pct: null, target_pct: null, sales_per_labor_hour: null, people: 0, status: 'review', findings: [finding('sales_no_time', `${untimedCount} sale row(s) worth ${round2(untimed)} have no time, so they are in the day's total but in no daypart.`, untimed)] });
  return { items, totals: { slots: items.length, net_sales: round2(totalSales), labor_cost: round2(totalCost), labor_pct: pct(totalCost, totalSales), labor_hours: round2(items.reduce((t, i) => t + i.labor_hours, 0)) } };
}
