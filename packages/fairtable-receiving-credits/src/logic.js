// Three-way match for a restaurant's deliveries: invoice line, what the receiving log says
// arrived (and what was rejected at the door), and the credit memos the vendor issued.
import { str, num, round2, nameKey, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ tolerance: 1, rejected_words: ['reject', 'damag', 'warm', 'temp', 'spoil', 'broken'] });
const LEVELS = { short_not_credited: 'flag', rejected_not_credited: 'flag', over_credited: 'review', received_not_invoiced: 'review', no_receiving_record: 'review', received_more: 'watch' };
const key = (inv, item) => `${nameKey(inv)}|${nameKey(item)}`;

export function deliveries({ invoices = [], receiving = [], credits = [] }, s = DEFAULTS) {
  const rec = new Map(); const recInvoices = new Set();
  for (const r of receiving) { if (!str(r.invoice_number)) continue; recInvoices.add(nameKey(r.invoice_number)); const k = key(r.invoice_number, r.item); const e = rec.get(k) || { qty: 0, rejected: 0, notes: [], used: false, row: r }; e.qty += num(r.qty_received) || 0; e.rejected += num(r.qty_rejected) || 0; if (str(r.note)) e.notes.push(str(r.note)); rec.set(k, e); }
  const cred = new Map();
  for (const c of credits) { const k = key(c.invoice_number, c.item); const e = cred.get(k) || { amount: 0, numbers: [] }; e.amount += num(c.amount) || 0; if (str(c.credit_number)) e.numbers.push(str(c.credit_number)); cred.set(k, e); }
  const words = (s.rejected_words || []).map((w) => String(w).toLowerCase());
  const items = []; let due = 0, expectedAll = 0, creditedAll = 0;
  const lines = new Map();
  for (const l of invoices) { if (!str(l.item) || !str(l.invoice_number)) continue; const k = key(l.invoice_number, l.item); const e = lines.get(k) || { ...l, qty: 0, extended: 0 }; e.qty += num(l.qty) || 0; e.extended += num(l.extended) ?? (num(l.qty) || 0) * (num(l.unit_price) || 0); lines.set(k, e); }
  for (const [k, l] of lines) {
    const f = []; const price = num(l.unit_price) ?? (l.qty ? l.extended / l.qty : 0);
    const r = rec.get(k); const c = cred.get(k) || { amount: 0, numbers: [] };
    let expected = 0;
    if (!r) {
      if (!recInvoices.has(nameKey(l.invoice_number))) f.push(finding('no_receiving_record', `Invoice ${str(l.invoice_number)} from ${str(l.vendor)} has no receiving record; nobody signed for ${str(l.item)}.`));
      else { expected = l.qty * price; f.push(finding('short_not_credited', `${str(l.item)} is on invoice ${str(l.invoice_number)} (${l.qty}) but not in the receiving log for that delivery.`, expected - c.amount)); }
    } else {
      r.used = true;
      const short = Math.max(0, l.qty - r.qty); const rejectedNote = r.notes.some((n) => words.some((w) => n.toLowerCase().includes(w)));
      const rejected = r.rejected > 0 ? r.rejected : 0;
      expected = (short + rejected) * price;
      if (r.qty > l.qty) f.push(finding('received_more', `${str(l.item)}: received ${r.qty}, invoiced ${l.qty}; the next invoice may bill the extra.`));
      const gap = expected - c.amount;
      if (gap > s.tolerance) {
        if (rejected > 0 || (rejectedNote && short === 0)) f.push(finding('rejected_not_credited', `${str(l.item)} on ${str(l.invoice_number)}: ${rejected} rejected at delivery (${r.notes.join('; ')}); credit expected ${round2(expected)}, credited ${round2(c.amount)}.`, gap));
        else f.push(finding('short_not_credited', `${str(l.item)} on ${str(l.invoice_number)}: invoiced ${l.qty}, received ${r.qty}; credit expected ${round2(expected)}, credited ${round2(c.amount)}${c.numbers.length ? ` (${c.numbers.join(', ')})` : ''}.`, gap));
      } else if (c.amount - expected > s.tolerance) f.push(finding('over_credited', `${str(l.item)} on ${str(l.invoice_number)}: credited ${round2(c.amount)} but only ${round2(expected)} was short or rejected; check the credit before relying on it.`, c.amount - expected));
    }
    const owed = Math.max(0, expected - c.amount); due += f.some((x) => x.code === 'short_not_credited' || x.code === 'rejected_not_credited') ? owed : 0;
    expectedAll += expected; creditedAll += c.amount;
    items.push({ item: str(l.item), sub: str(l.invoice_number), vendor: str(l.vendor), invoice_number: str(l.invoice_number), invoiced_qty: l.qty, received_qty: r ? r.qty : null, rejected_qty: r ? r.rejected : null, unit_price: round2(price), credit_expected: round2(expected), credited: round2(c.amount), credit_due: round2(owed), status: statusOf(f, LEVELS), findings: f });
  }
  for (const [k, r] of rec) if (!r.used) {
    const f = [finding('received_not_invoiced', `${str(r.row.item)} was received on ${str(r.row.invoice_number)} (${r.qty}${r.notes.length ? `, "${r.notes.join('; ')}"` : ''}) but is not on the invoice: a substitute or a missing line. Check the price on the next invoice.`)];
    items.push({ item: str(r.row.item), sub: str(r.row.invoice_number), vendor: str(r.row.vendor), invoice_number: str(r.row.invoice_number), invoiced_qty: 0, received_qty: r.qty, rejected_qty: r.rejected, unit_price: null, credit_expected: 0, credited: 0, credit_due: 0, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { lines: items.length, invoices: new Set(items.map((i) => nameKey(i.invoice_number))).size, credit_expected: round2(expectedAll), credited: round2(creditedAll), credit_due: round2(due) } };
}
