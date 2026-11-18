// Utility bills per account: usage per day and price per unit against the account's own
// other bills (the median), estimated reads, duplicates, overlapping periods, late fees.
import { str, num, round2, round4, isoDate, daysBetween, nameKey, median, pct, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ spike_pct: 25, rate_jump_pct: 15, min_history: 2 });
const LEVELS = { usage_spike: 'flag', duplicate_bill: 'flag', rate_jump: 'review', estimated_twice: 'review', overlapping_period: 'review', late_fee: 'review', estimated_read: 'watch', no_period: 'review' };

export function utilities({ bills = [] }, s = DEFAULTS) {
  const acc = new Map();
  for (const b of bills) { if (!str(b.account)) continue; const k = nameKey(b.account); if (!acc.has(k)) acc.set(k, []); acc.get(k).push(b); }
  const items = []; let total = 0, flagged = 0;
  for (const [, list] of [...acc.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    list.sort((a, b) => cmp(isoDate(a.period_start) || '', isoDate(b.period_start) || '') || cmp(str(a.amount), str(b.amount)));
    const rows = list.map((b) => { const days = isoDate(b.period_start) && isoDate(b.period_end) ? daysBetween(b.period_start, b.period_end) + 1 : null; const u = num(b.usage), a = num(b.amount) || 0, fee = num(b.late_fee) || 0; return { b, days, perDay: u !== null && days ? u / days : null, rate: u ? (a - fee) / u : null, amount: a }; });
    const seen = new Map(); let prevEst = false, prevEnd = null;
    rows.forEach((r, i) => {
      const f = []; const b = r.b; const key = `${isoDate(b.period_start)}|${isoDate(b.period_end)}`;
      const others = rows.filter((x, j) => j !== i && `${isoDate(x.b.period_start)}|${isoDate(x.b.period_end)}` !== key);
      if (!r.days) f.push(finding('no_period', `${str(b.account)}: a bill with no service period.`));
      if (seen.has(key)) f.push(finding('duplicate_bill', `${str(b.account)} (${str(b.utility)}): the period ${isoDate(b.period_start)} to ${isoDate(b.period_end)} is billed twice.`, r.amount));
      else if (prevEnd && isoDate(b.period_start) && isoDate(b.period_start) <= prevEnd) f.push(finding('overlapping_period', `${str(b.account)}: this bill starts ${isoDate(b.period_start)}, before the previous one ended (${prevEnd}).`));
      seen.set(key, true);
      const usage = others.map((x) => x.perDay).filter((x) => x !== null); const rates = others.map((x) => x.rate).filter((x) => x !== null);
      if (usage.length >= s.min_history && r.perDay !== null) { const m = median(usage); const up = pct(r.perDay - m, m); if (up !== null && up >= s.spike_pct) f.push(finding('usage_spike', `${str(b.account)} (${str(b.utility)}), ${isoDate(b.period_start)} to ${isoDate(b.period_end)}: ${round2(r.perDay)} ${str(b.unit)} a day against a usual ${round2(m)} (+${up}%). Check equipment left on, a leak or a faulty meter.`, (r.perDay - m) * r.days * (r.rate || 0))); }
      if (rates.length >= s.min_history && r.rate !== null) { const m = median(rates); const up = pct(r.rate - m, m); if (up !== null && up >= s.rate_jump_pct) f.push(finding('rate_jump', `${str(b.account)}: ${round4(r.rate)} per ${str(b.unit)} against a usual ${round4(m)} (+${up}%). Check the tariff or a supplier contract that ended.`, (r.rate - m) * (num(b.usage) || 0))); }
      const est = /estim/i.test(str(b.read_type));
      if (est && prevEst) f.push(finding('estimated_twice', `${str(b.account)}: estimated meter read again; ask for an actual read before the estimate is trued up.`));
      else if (est) f.push(finding('estimated_read', `${str(b.account)}: estimated meter read for ${isoDate(b.period_start)} to ${isoDate(b.period_end)}.`));
      if ((num(b.late_fee) || 0) > 0) f.push(finding('late_fee', `${str(b.account)}: late fee of ${num(b.late_fee)} on this bill.`, num(b.late_fee)));
      prevEst = est; prevEnd = isoDate(b.period_end) || prevEnd;
      total += r.amount; const st = statusOf(f, LEVELS); if (st === 'flag') flagged++;
      items.push({ bill: `${str(b.account)} ${isoDate(b.period_start) || ''}`.trim(), sub: seen.size + '-' + i, account: str(b.account), utility: str(b.utility), location: str(b.location), period_start: isoDate(b.period_start), period_end: isoDate(b.period_end), usage: num(b.usage), unit: str(b.unit), amount: r.amount, usage_per_day: r.perDay === null ? null : round2(r.perDay), rate: r.rate === null ? null : round4(r.rate), status: st, findings: f });
    });
  }
  for (const i of items) delete i.sub;
  return { items, totals: { bills: items.length, accounts: acc.size, billed: round2(total), flagged_bills: flagged } };
}
