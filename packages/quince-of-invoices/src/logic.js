// Vendor invoices before payment: duplicates (same number again, or the same amount from
// the same vendor a few days apart), line math, missing numbers and GL coding against the
// restaurant's own keyword rules.
import { str, num, round2, isoDate, daysBetween, nameKey, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ gl_rules: [], duplicate_window_days: 5, tolerance: 0.02 });
const LEVELS = { duplicate_number: 'flag', line_math: 'flag', possible_duplicate: 'review', gl_miscoded: 'review', missing_number: 'review' };

export function invoices({ invoices: lines = [] }, s = DEFAULTS) {
  const rules = (s.gl_rules || []).map((r) => { try { return { re: new RegExp(String(r.match).slice(0, 300), 'i'), gl: str(r.gl) }; } catch { return null; } }).filter(Boolean);
  const inv = new Map();
  for (const l of lines) { if (!str(l.item) && num(l.extended) === null) continue; const k = `${nameKey(l.vendor)}|${nameKey(l.invoice_number)}|${isoDate(l.invoice_date) || ''}`; const e = inv.get(k) || { vendor: str(l.vendor), number: str(l.invoice_number), date: isoDate(l.invoice_date), total: 0, lines: [] }; e.total += num(l.extended) ?? (num(l.qty) || 0) * (num(l.unit_price) || 0); e.lines.push(l); inv.set(k, e); }
  const list = [...inv.values()].sort((a, b) => cmp(`${nameKey(a.vendor)}|${a.date || ''}|${nameKey(a.number)}`, `${nameKey(b.vendor)}|${b.date || ''}|${nameKey(b.number)}`));
  const items = []; let total = 0, atRisk = 0;
  list.forEach((e, idx) => {
    const f = []; total += e.total;
    if (!e.number) f.push(finding('missing_number', `${e.vendor} invoice dated ${e.date} (${round2(e.total)}) has no invoice number, so a second copy could not be caught.`));
    const earlier = list.slice(0, idx).filter((x) => nameKey(x.vendor) === nameKey(e.vendor));
    const same = e.number && earlier.find((x) => nameKey(x.number) === nameKey(e.number));
    if (same) { f.push(finding('duplicate_number', `${e.vendor} invoice ${e.number} was already entered dated ${same.date} for ${round2(same.total)}; this copy is dated ${e.date} for ${round2(e.total)}.`, e.total)); atRisk += e.total; }
    else { const twin = earlier.find((x) => Math.abs(x.total - e.total) <= s.tolerance && x.date && e.date && Math.abs(daysBetween(x.date, e.date)) <= s.duplicate_window_days); if (twin) { f.push(finding('possible_duplicate', `${e.vendor} invoice ${e.number || '(no number)'} for ${round2(e.total)} matches invoice ${twin.number} of ${twin.date}, ${Math.abs(daysBetween(twin.date, e.date))} day(s) apart. Check it is a second delivery, not a second bill.`, e.total)); } }
    for (const l of e.lines) {
      const q = num(l.qty), p = num(l.unit_price), x = num(l.extended);
      if (q !== null && p !== null && x !== null && Math.abs(q * p - x) > s.tolerance) f.push(finding('line_math', `${e.vendor} ${e.number}: ${str(l.item)} ${q} x ${p} = ${round2(q * p)}, billed ${x}.`, x - q * p));
      const rule = rules.find((r) => r.re.test(str(l.item)));
      if (rule && str(l.gl_account) && nameKey(l.gl_account) !== nameKey(rule.gl)) f.push(finding('gl_miscoded', `${e.vendor} ${e.number}: "${str(l.item)}" is coded to ${str(l.gl_account)}; your rules put it in ${rule.gl}.`, x));
    }
    items.push({ invoice: `${e.vendor} ${e.number || '(no number)'} ${e.date || ''}`.trim(), vendor: e.vendor, invoice_number: e.number, invoice_date: e.date, lines: e.lines.length, total: round2(e.total), status: statusOf(f, LEVELS), findings: f });
  });
  return { items, totals: { invoices: items.length, invoiced: round2(total), duplicate_amount: round2(atRisk), miscoded_lines: items.reduce((t, i) => t + i.findings.filter((f) => f.code === 'gl_miscoded').length, 0) } };
}
