// Vendor price creep: every vendor item's price per base unit (lb, each, litre) across
// the invoices, against its first price in the file and against the bid or contract price.
import { str, num, round2, round4, isoDate, nameKey, convertQty, packSize, pct, cmp, inWindow, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ flag_pct: 5, flag_amount: 25, contract_tolerance_pct: 1, creep_steps: 3 });
const LEVELS = { over_contract: 'flag', price_up: 'flag', small_price_up: 'watch', steady_creep: 'watch', pack_changed: 'review', no_pack: 'review' };
const BASE = { weight: 'lb', volume: 'l', count: 'ea' };

/** Price per base unit for a line, with the unit, or null when the pack cannot be read. */
function perBase(line, priceField = 'unit_price') {
  const p = num(line[priceField]); const pk = packSize(line.pack);
  if (p === null || !pk) return null;
  const fam = { g: 'weight', kg: 'weight', oz: 'weight', lb: 'weight', ml: 'volume', l: 'volume', floz: 'volume', cup: 'volume', tbsp: 'volume', tsp: 'volume', pt: 'volume', qt: 'volume', gal: 'volume', ea: 'count', dz: 'count' }[pk.unit];
  const unit = BASE[fam]; const q = convertQty(pk.total, pk.unit, unit);
  return q ? { price: p / q, unit, units: (num(line.qty) || 1) * q } : null;
}

export function priceCreep({ invoices = [], contracts = [] }, s = DEFAULTS) {
  const groups = new Map();
  for (const l of invoices) { if (!str(l.item)) continue; const k = `${nameKey(l.vendor)}|${nameKey(l.item)}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(l); }
  const items = []; let extraTotal = 0;
  // Bids indexed once by vendor and item (a lookup per group, not a scan of every bid).
  const bids = new Map(); for (const c of contracts) { const k = `${nameKey(c.vendor)}|${nameKey(c.item)}`; if (!bids.has(k)) bids.set(k, []); bids.get(k).push(c); }
  for (const [gk, lines] of groups) {
    lines.sort((a, b) => cmp(isoDate(a.invoice_date) || '', isoDate(b.invoice_date) || '') || cmp(str(a.invoice_number), str(b.invoice_number)));
    const vendor = str(lines[0].vendor), item = str(lines[0].item); const f = [];
    const pts = lines.map((l) => ({ l, b: perBase(l) }));
    const ok = pts.filter((p) => p.b);
    if (ok.length < pts.length) f.push(finding('no_pack', `${item} from ${vendor}: ${pts.length - ok.length} line(s) have no readable pack size, so the price per unit is unknown there.`));
    const packs = [...new Set(lines.map((l) => str(l.pack).toUpperCase()).filter(Boolean))];
    if (packs.length > 1) f.push(finding('pack_changed', `${item} from ${vendor} came as ${packs.join(' then ')}; compare the price per ${ok[0] ? ok[0].b.unit : 'unit'}, not per case.`));
    let first = null, last = null, extra = 0, up = 0, run = 0, maxRun = 0;
    if (ok.length) {
      first = ok[0]; last = ok.at(-1);
      for (let i = 1; i < ok.length; i++) {
        const d = ok[i].b.price - ok[i - 1].b.price;
        if (d > 1e-9) { run++; maxRun = Math.max(maxRun, run); } else if (d < -1e-9) run = 0;
        const over = ok[i].b.price - first.b.price; if (over > 0) extra += over * ok[i].b.units;
      }
      up = pct(last.b.price - first.b.price, first.b.price);
      const unit = last.b.unit;
      const text = `${item} from ${vendor}: ${round4(first.b.price)} per ${unit} on ${isoDate(first.l.invoice_date)}, ${round4(last.b.price)} on ${isoDate(last.l.invoice_date)} (${up > 0 ? '+' : ''}${up}%). Paid ${round2(extra)} more than at the first price.`;
      if (up >= s.flag_pct) f.push(finding(extra >= s.flag_amount ? 'price_up' : 'small_price_up', text, extra));
      if (maxRun >= s.creep_steps) f.push(finding('steady_creep', `${item} from ${vendor} went up ${maxRun} invoices in a row.`));
      const c = (bids.get(gk) || []).find((x) => inWindow(last.l.invoice_date, x.valid_from, x.valid_to));
      if (c) {
        const cb = perBase({ ...c, unit_price: c.price, qty: 1 });
        if (cb && last.b.unit === cb.unit && last.b.price > cb.price * (1 + s.contract_tolerance_pct / 100)) {
          const over = ok.filter((p) => inWindow(p.l.invoice_date, c.valid_from, c.valid_to)).reduce((t, p) => t + Math.max(0, p.b.price - cb.price) * p.b.units, 0);
          f.push(finding('over_contract', `${item} from ${vendor}: bid price ${round4(cb.price)} per ${cb.unit} (valid ${isoDate(c.valid_from) || '?'} to ${isoDate(c.valid_to) || '?'}), last invoiced ${round4(last.b.price)}. Over the bid by ${round2(over)} on the invoices in the bid period.`, over));
        }
      }
    }
    extraTotal += extra;
    items.push({ item, sub: vendor, vendor, invoices: lines.length, unit: last ? last.b.unit : null, first_price: first ? round4(first.b.price) : null, last_price: last ? round4(last.b.price) : null, change_pct: ok.length ? up : null, extra_paid: round2(extra), status: statusOf(f, LEVELS), findings: f });
  }
  const vendors = [...new Set(items.map((i) => i.vendor))].sort();
  return { items, totals: { vendor_items: items.length, vendors: vendors.length, extra_paid: round2(extraTotal), over_contract: items.filter((i) => i.findings.some((f) => f.code === 'over_contract')).length } };
}
