// Catering and private-event deposits and balances, against the bookings, as of a date.
import { str, num, round2, isoDate, daysBetween, nameKey, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ as_of: null, deposit_due_days_before: 30, balance_due_days_after: 3, full_refund_days_before: 14 });
const LEVELS = { deposit_missing: 'flag', balance_overdue: 'flag', overpaid: 'review', cancelled_refund_due: 'review', payment_no_event: 'review', no_total: 'review' };

export function catering({ events = [], payments = [] }, s = DEFAULTS) {
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const pay = new Map(); for (const p of payments) { if (!str(p.event_id)) continue; const k = nameKey(p.event_id); const e = pay.get(k) || { paid: 0, refunded: 0, rows: [] }; const a = num(p.amount) || 0; if (/refund/i.test(str(p.type)) || a < 0) e.refunded += Math.abs(a); else e.paid += a; e.rows.push(p); pay.set(k, e); }
  const items = []; let booked = 0, received = 0, owedToUs = 0, owedBack = 0; const known = new Set();
  for (const ev of [...events].sort((a, b) => cmp(nameKey(a.event_id), nameKey(b.event_id)))) {
    if (!str(ev.event_id)) continue; known.add(nameKey(ev.event_id));
    const f = []; const total = num(ev.total); const p = pay.get(nameKey(ev.event_id)) || { paid: 0, refunded: 0 }; const net = p.paid - p.refunded;
    const d = isoDate(ev.event_date); const until = d ? daysBetween(asOf, d) : null; const status = str(ev.status).toLowerCase();
    const depositReq = total !== null ? round2((total * (num(ev.deposit_pct) || 0)) / 100) : null;
    if (total === null) f.push(finding('no_total', `${str(ev.event_id)} has no total, so its deposit and balance cannot be checked.`));
    if (/cancel/.test(status)) {
      const lead = isoDate(ev.cancelled_date) && d ? daysBetween(ev.cancelled_date, d) : null;
      if (lead !== null && lead >= s.full_refund_days_before && net > 0) { f.push(finding('cancelled_refund_due', `${str(ev.event_id)} was cancelled ${lead} days before the event (policy: full refund from ${s.full_refund_days_before} days); ${round2(net)} received and not refunded.`, net)); owedBack += net; }
    } else if (total !== null) {
      booked += total;
      if (until !== null && until >= 0 && until <= s.deposit_due_days_before && net < depositReq - 0.005) { f.push(finding('deposit_missing', `${str(ev.event_id)} is ${until} days away; deposit required ${depositReq} (${num(ev.deposit_pct)}%), received ${round2(net)}.`, depositReq - net)); owedToUs += depositReq - net; }
      if (until !== null && until < -s.balance_due_days_after && net < total - 0.005) { f.push(finding('balance_overdue', `${str(ev.event_id)} took place ${-until} days ago; total ${total}, received ${round2(net)}; ${round2(total - net)} overdue.`, total - net)); owedToUs += total - net; }
      if (net > total + 0.005) { f.push(finding('overpaid', `${str(ev.event_id)}: received ${round2(net)} on a total of ${total}; ${round2(net - total)} may be owed back.`, net - total)); owedBack += net - total; }
    }
    received += net;
    items.push({ event_id: str(ev.event_id), client: str(ev.client), location: str(ev.location), event_date: d, days_until: until, booking_status: str(ev.status), total, deposit_required: depositReq, received: round2(net), balance: total === null ? null : round2(total - net), status: statusOf(f, LEVELS), findings: f });
  }
  for (const [k, p] of [...pay.entries()].sort((a, b) => cmp(a[0], b[0]))) if (!known.has(k)) {
    const f = [finding('payment_no_event', `${str(p.rows[0].event_id)}: ${round2(p.paid)} received (${p.rows.map((r) => `${isoDate(r.date)} ${str(r.method)}`).join(', ')}) for an event that is not in the bookings.`, p.paid)];
    received += p.paid;
    items.push({ event_id: str(p.rows[0].event_id), client: '', location: '', event_date: null, days_until: null, booking_status: '(not booked)', total: null, deposit_required: null, received: round2(p.paid), balance: null, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { events: events.filter((e) => str(e.event_id)).length, booked_total: round2(booked), received: round2(received), owed_to_us: round2(owedToUs), owed_back: round2(owedBack) }, extra: { as_of: asOf } };
}
