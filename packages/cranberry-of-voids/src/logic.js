// Voids and comps by employee, against each employee's sales.
import { str, num, round2, isoDate, personKey, displayName, minutesOf, pct, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ flag_rate_pct: 3, watch_rate_pct: 1.5, approval_limit: 20, full_check_pct: 90 });
const LEVELS = { self_approved: 'flag', after_close: 'flag', high_void_rate: 'flag', some_void_rate: 'watch', no_reason: 'review', no_approver: 'review', full_check_void: 'watch' };
const isComp = (t) => /comp|house|promo/i.test(str(t));

export function voids({ checks = [], server_sales = [] }, s = DEFAULTS) {
  const sales = new Map(); for (const r of server_sales) { const k = personKey(r.employee); if (k) sales.set(k, (sales.get(k) || 0) + (num(r.net_sales) || 0)); }
  const emp = new Map();
  for (const c of checks) {
    const k = personKey(c.employee) || '(no employee)';
    const e = emp.get(k) || { employee: displayName(c.employee) || '(no employee)', voids: 0, comps: 0, void_amount: 0, comp_amount: 0, self: [], after: [], noReason: 0, noApprover: [], full: [] };
    const amt = num(c.amount) || 0; const comp = isComp(c.type);
    if (comp) { e.comps++; e.comp_amount += amt; } else { e.voids++; e.void_amount += amt; }
    if (str(c.approver) && personKey(c.approver) === personKey(c.employee)) e.self.push({ check: str(c.check), amount: amt });
    const evt = isoDate(c.date) && minutesOf(c.time) !== null ? `${isoDate(c.date)}T${String(Math.floor(minutesOf(c.time) / 60)).padStart(2, '0')}:${String(minutesOf(c.time) % 60).padStart(2, '0')}` : null;
    const closed = str(c.closed_at) ? `${isoDate(c.closed_at)}T${String(Math.floor((minutesOf(c.closed_at) ?? 0) / 60)).padStart(2, '0')}:${String((minutesOf(c.closed_at) ?? 0) % 60).padStart(2, '0')}` : null;
    if (evt && closed && isoDate(c.closed_at) && evt > closed) e.after.push({ check: str(c.check), amount: amt, at: str(c.time), closed: str(c.closed_at) });
    if (!comp && !str(c.reason)) e.noReason++;
    if (amt > s.approval_limit && !str(c.approver)) e.noApprover.push({ check: str(c.check), amount: amt });
    const total = num(c.check_total);
    if (total && total >= 50 && amt >= (s.full_check_pct / 100) * total) e.full.push({ check: str(c.check), amount: amt, reason: str(c.reason) });
    emp.set(k, e);
  }
  const items = []; let va = 0, ca = 0, nv = 0, nc = 0;
  for (const [k, e] of [...emp.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const f = []; const sold = sales.get(k) ?? null; const total = e.void_amount + e.comp_amount; const rate = sold ? pct(total, sold) : null;
    if (e.self.length) f.push(finding('self_approved', `${e.employee} approved ${e.self.length} of their own void(s) on check(s) ${e.self.map((x) => x.check).join(', ')}.`, e.self.reduce((t, x) => t + x.amount, 0)));
    if (e.after.length) f.push(finding('after_close', `${e.employee} voided after the check was paid: ${e.after.map((x) => `check ${x.check} at ${x.at}, closed ${x.closed}`).join('; ')}. A void after payment can hide cash taken from a paid check.`, e.after.reduce((t, x) => t + x.amount, 0)));
    if (rate !== null && rate >= s.flag_rate_pct) f.push(finding('high_void_rate', `${e.employee}: voids and comps of ${round2(total)} are ${rate}% of their sales of ${round2(sold)}.`, total));
    else if (rate !== null && rate >= s.watch_rate_pct) f.push(finding('some_void_rate', `${e.employee}: voids and comps are ${rate}% of sales.`, total));
    if (e.noReason) f.push(finding('no_reason', `${e.employee}: ${e.noReason} void(s) with no reason.`));
    if (e.noApprover.length) f.push(finding('no_approver', `${e.employee}: ${e.noApprover.length} void(s) or comp(s) over ${s.approval_limit} with no manager approval (check ${e.noApprover.map((x) => x.check).join(', ')}).`, e.noApprover.reduce((t, x) => t + x.amount, 0)));
    if (e.full.length) f.push(finding('full_check_void', `${e.employee}: whole check(s) voided: ${e.full.map((x) => `${x.check} (${x.amount}${x.reason ? `, ${x.reason}` : ''})`).join('; ')}.`, e.full.reduce((t, x) => t + x.amount, 0)));
    va += e.void_amount; ca += e.comp_amount; nv += e.voids; nc += e.comps;
    items.push({ employee: e.employee, voids: e.voids, void_amount: round2(e.void_amount), comps: e.comps, comp_amount: round2(e.comp_amount), net_sales: sold === null ? null : round2(sold), void_comp_pct: rate, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { employees: items.length, void_count: nv, void_amount: round2(va), comp_count: nc, comp_amount: round2(ca) } };
}
