// Items 86ed and stockouts: how often each item ran out, for how long, and an estimate of
// the sales lost while it was off (its average sales per open hour on the days in the
// sales file x the hours it was off).
import { str, num, round2, isoDate, nameKey, minutesOf, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ open_hours_per_day: 11, close_time: '22:00', peak_start: '18:00', repeat_count: 3, long_hours: 3 });
const LEVELS = { repeated_86: 'flag', long_86: 'flag', early_86: 'watch', never_returned: 'review', no_sales_history: 'review' };

export function stockouts({ eighty_six = [], sales = [] }, s = DEFAULTS) {
  const hist = new Map();
  for (const x of sales) { if (!str(x.item)) continue; const k = nameKey(x.item); const e = hist.get(k) || { days: new Set(), sales: 0, qty: 0 }; if (isoDate(x.date)) e.days.add(isoDate(x.date)); e.sales += num(x.net_sales) || 0; e.qty += num(x.qty) || 0; hist.set(k, e); }
  const ev = new Map();
  for (const r of eighty_six) { if (!str(r.item)) continue; const k = nameKey(r.item); if (!ev.has(k)) ev.set(k, { item: str(r.item), list: [] }); ev.get(k).list.push(r); }
  const close = minutesOf(s.close_time) ?? 22 * 60; const peak = minutesOf(s.peak_start);
  const items = []; let lostAll = 0, hoursAll = 0;
  for (const [k, e] of [...ev.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const f = []; const h = hist.get(k); const perHour = h && h.days.size ? h.sales / (h.days.size * s.open_hours_per_day) : null;
    let hours = 0; const longOnes = [], early = [], open = [];
    for (const r of e.list.sort((a, b) => cmp(`${isoDate(a.date)} ${str(a.out_at)}`, `${isoDate(b.date)} ${str(b.out_at)}`))) {
      const out = minutesOf(r.out_at); let back = minutesOf(r.back_at);
      if (out === null) continue;
      if (back === null) { open.push(isoDate(r.date)); back = close; }
      const hrs = Math.max(0, (back - out) / 60); hours += hrs;
      if (hrs >= s.long_hours) longOnes.push(`${isoDate(r.date)} from ${str(r.out_at)} (${round2(hrs)} h)`);
      if (peak !== null && out < peak && back > peak) early.push(`${isoDate(r.date)} at ${str(r.out_at)}`);
    }
    const lost = perHour === null ? null : round2(perHour * hours);
    if (e.list.length >= s.repeat_count) f.push(finding('repeated_86', `${e.item} was 86ed ${e.list.length} times in this period: the par or the prep for it is too low.`, lost));
    if (longOnes.length) f.push(finding('long_86', `${e.item} was off for ${s.long_hours} hours or more: ${longOnes.join('; ')}.${perHour !== null ? ` At about ${round2(perHour)} an hour in sales, roughly ${lost} in lost sales over all its outages (an estimate).` : ''}`, lost));
    if (early.length) f.push(finding('early_86', `${e.item} ran out before the ${s.peak_start} rush and was still off when it started: ${early.join('; ')}.`));
    if (open.length) f.push(finding('never_returned', `${e.item} has no time back on ${open.join(', ')}; it is counted as off until ${s.close_time}. Check the item came back the next day.`));
    if (!h) f.push(finding('no_sales_history', `${e.item} is not in the sales file, so lost sales cannot be estimated.`));
    hoursAll += hours; if (lost) lostAll += lost;
    items.push({ item: e.item, times_86: e.list.length, hours_out: round2(hours), sales_per_open_hour: perHour === null ? null : round2(perHour), lost_sales_estimate: lost, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { items_86ed: items.length, events: eighty_six.filter((r) => str(r.item)).length, hours_out: round2(hoursAll), lost_sales_estimate: round2(lostAll) } };
}
