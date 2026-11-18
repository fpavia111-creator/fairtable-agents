// Discounts and promotions rung in the POS against the restaurant's own promotion list:
// dates, days, hours, caps, approvals and employee meal allowances.
import { str, num, round2, isoDate, nameKey, personKey, minutesOf, dayName, inWindow, readYesNo, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ tolerance: 0.5, open_words: ['open', 'custom', 'manual'] });
const LEVELS = { expired_promo: 'flag', outside_hours: 'flag', over_cap: 'flag', employee_meal_over: 'flag', no_approver: 'review', unknown_discount: 'review', open_discount: 'watch' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayAllowed(spec, d) {
  const s = str(spec); if (!s || !d) return true;
  return s.split(/[,;]\s*/).some((part) => {
    const m = /^([A-Za-z]{3})\w*\s*-\s*([A-Za-z]{3})\w*$/.exec(part.trim());
    if (m) { const a = DAYS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase()), b = DAYS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase()), i = DAYS.indexOf(d); return a >= 0 && b >= 0 && (a <= b ? i >= a && i <= b : i >= a || i <= b); }
    return part.trim().slice(0, 3).toLowerCase() === d.toLowerCase();
  });
}
function hoursAllowed(spec, time) {
  const m = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(str(spec)); const t = minutesOf(time);
  if (!m || t === null) return true;
  const a = minutesOf(m[1]), b = minutesOf(m[2]);
  return a <= b ? t >= a && t < b : t >= a || t < b;
}

export function discounts({ discounts: lines = [], promos = [] }, s = DEFAULTS) {
  const promo = new Map(promos.filter((p) => str(p.name)).map((p) => [nameKey(p.name), p]));
  const groups = new Map();
  for (const l of lines) { if (!str(l.item)) continue; const k = nameKey(l.item); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(l); }
  const items = []; let total = 0;
  for (const [k, list] of [...groups.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const name = str(list[0].item); const p = promo.get(k); const f = []; let amount = 0;
    const bad = { expired: [], hours: [], cap: [], approve: [] };
    for (const l of list) {
      const amt = num(l.amount) || 0; amount += amt; const d = isoDate(l.date);
      if (!p) continue;
      if (d && !inWindow(d, p.start, p.end)) bad.expired.push(l);
      else if (!dayAllowed(p.days, dayName(d)) || !hoursAllowed(p.hours, l.time)) bad.hours.push(l);
      const tot = num(l.check_total); const maxPct = num(p.max_pct), maxAmt = num(p.max_amount);
      const capPct = maxPct !== null && tot ? (maxPct / 100) * tot : null;
      const cap = [capPct, maxAmt].filter((x) => x !== null).reduce((m, x) => Math.min(m, x), Infinity);
      if (Number.isFinite(cap) && amt > cap + s.tolerance) bad.cap.push({ l, over: amt - cap });
      if (readYesNo(p.needs_approval) === true && !str(l.approver)) bad.approve.push(l);
    }
    total += amount;
    const sumOf = (xs) => xs.reduce((t, l) => t + (num(l.amount) || 0), 0);
    if (!p) {
      if ((s.open_words || []).some((w) => name.toLowerCase().includes(String(w).toLowerCase()))) f.push(finding('open_discount', `"${name}" is an open discount not on the promotion list.`, amount));
      else f.push(finding('unknown_discount', `"${name}" is not on the promotion list: ${list.length} use(s), ${round2(amount)}. Add it to the list or remove the button.`, amount));
    } else {
      if (bad.expired.length) f.push(finding('expired_promo', `"${name}" runs ${isoDate(p.start) || '?'} to ${isoDate(p.end) || '?'} but was used ${bad.expired.length} time(s) outside those dates (check ${bad.expired.map((l) => str(l.check)).join(', ')}).`, sumOf(bad.expired)));
      if (bad.hours.length) f.push(finding('outside_hours', `"${name}" is for ${str(p.days) || 'any day'} ${str(p.hours) || ''} but was rung ${bad.hours.map((l) => `${dayName(l.date)} ${str(l.time)} (check ${str(l.check)})`).join(', ')}.`.replace('  ', ' '), sumOf(bad.hours)));
      if (bad.cap.length) f.push(finding('over_cap', `"${name}" went over its cap on ${bad.cap.length} check(s): ${bad.cap.map((x) => `${str(x.l.check)} by ${round2(x.over)}`).join(', ')}.`, bad.cap.reduce((t, x) => t + x.over, 0)));
      if (bad.approve.length) f.push(finding('no_approver', `"${name}" needs a manager approval; ${bad.approve.length} use(s) had none (check ${bad.approve.map((l) => str(l.check)).join(', ')}).`, sumOf(bad.approve)));
      if (readYesNo(p.employee_only) === true && num(p.daily_allowance) !== null) {
        const per = new Map(); for (const l of list) { const kk = `${personKey(l.employee)}|${isoDate(l.date)}`; per.set(kk, (per.get(kk) || 0) + (num(l.amount) || 0)); }
        const over = [...per.entries()].filter(([, v]) => v > num(p.daily_allowance) + s.tolerance);
        if (over.length) f.push(finding('employee_meal_over', `"${name}": ${over.length} employee-day(s) over the ${num(p.daily_allowance)} daily allowance.`, over.reduce((t, [, v]) => t + v - num(p.daily_allowance), 0)));
      }
    }
    items.push({ discount: name, uses: list.length, amount: round2(amount), on_promo_list: !!p, window: p ? `${isoDate(p.start) || ''} to ${isoDate(p.end) || ''}` : '', status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { discounts: items.length, uses: lines.length, discount_amount: round2(total), not_on_list: items.filter((i) => !i.on_promo_list).length } };
}
