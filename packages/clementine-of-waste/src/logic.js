// Waste log against sales: what was thrown out, priced, by item, reason and day, and the
// days with sales but nothing logged (a log that is not kept looks like no waste).
import { str, num, round2, isoDate, nameKey, pct, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ flag_amount: 40, watch_amount: 15, repeat_count: 3, target_waste_pct: 1.5 });
const LEVELS = { high_waste: 'flag', waste_over_target: 'flag', repeat_reason: 'watch', some_waste: 'watch', no_value: 'review', no_reason: 'review', unlogged_day: 'review' };

export function wasteLog({ waste = [], sales = [] }, s = DEFAULTS) {
  const byItem = new Map(); const days = new Set(); let total = 0;
  for (const w of waste) {
    if (!str(w.item)) continue;
    const d = isoDate(w.date); if (d) days.add(d);
    const k = nameKey(w.item); const e = byItem.get(k) || { item: str(w.item), qty: 0, unit: str(w.unit), value: 0, unpriced: 0, noReason: 0, reasons: new Map(), entries: 0 };
    const q = num(w.qty) || 0; const v = num(w.value) ?? (num(w.unit_cost) !== null ? q * num(w.unit_cost) : null);
    e.qty += q; e.entries++;
    if (v === null) e.unpriced++; else { e.value += v; total += v; }
    const r = str(w.reason).toLowerCase(); if (!r) e.noReason++; else e.reasons.set(r, (e.reasons.get(r) || 0) + 1);
    byItem.set(k, e);
  }
  const salesByDay = new Map(); let net = 0;
  for (const x of sales) { const d = isoDate(x.date); const v = num(x.net_sales) || 0; net += v; if (d) salesByDay.set(d, (salesByDay.get(d) || 0) + v); }
  const items = [];
  for (const e of byItem.values()) {
    const f = [];
    if (e.value >= s.flag_amount) f.push(finding('high_waste', `${e.item}: ${round2(e.qty)} ${e.unit} thrown out in ${e.entries} entr${e.entries === 1 ? 'y' : 'ies'}, worth ${round2(e.value)}.`, e.value));
    else if (e.value >= s.watch_amount) f.push(finding('some_waste', `${e.item}: worth ${round2(e.value)} thrown out.`, e.value));
    for (const [r, n] of [...e.reasons.entries()].sort((a, b) => cmp(a[0], b[0]))) if (n >= s.repeat_count) f.push(finding('repeat_reason', `${e.item} was logged as "${r}" ${n} times: a prep par or a rotation problem to fix at the source.`));
    if (e.unpriced) f.push(finding('no_value', `${e.item}: ${e.unpriced} entr${e.unpriced === 1 ? 'y has' : 'ies have'} no cost or value, so the total is understated.`));
    if (e.noReason) f.push(finding('no_reason', `${e.item}: ${e.noReason} entr${e.noReason === 1 ? 'y has' : 'ies have'} no reason.`));
    items.push({ item: e.item, sub: 'item', qty: round2(e.qty), unit: e.unit, value: round2(e.value), entries: e.entries, top_reason: [...e.reasons.entries()].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))[0]?.[0] || '', status: statusOf(f, LEVELS), findings: f });
  }
  for (const [d, v] of [...salesByDay.entries()].sort((a, b) => cmp(a[0], b[0]))) if (v > 0 && !days.has(d)) {
    const f = [finding('unlogged_day', `${d}: sales of ${round2(v)} and no waste logged. A day with no entries usually means the log was not kept, not that nothing was wasted.`)];
    items.push({ item: d, sub: 'day', qty: null, unit: '', value: 0, entries: 0, top_reason: '', status: statusOf(f, LEVELS), findings: f });
  }
  const wp = net ? pct(total, net) : null;
  if (wp !== null && wp > s.target_waste_pct) items.push({ item: 'All waste', sub: 'total', qty: null, unit: '', value: round2(total), entries: waste.length, top_reason: '', status: 'flag', findings: [finding('waste_over_target', `Logged waste is ${round2(total)}, ${wp}% of net sales of ${round2(net)}, over the ${s.target_waste_pct}% target.`, total)] });
  return { items, totals: { waste_value: round2(total), net_sales: round2(net), waste_pct_of_sales: wp, days_logged: days.size, days_with_sales: [...salesByDay.values()].filter((v) => v > 0).length } };
}
