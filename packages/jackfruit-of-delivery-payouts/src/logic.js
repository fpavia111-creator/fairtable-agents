// Delivery-app payouts against orders. Each statement line is checked against its own
// arithmetic (subtotal + tax - fees - refunds + adjustments = payout) and against the
// commission rate in the restaurant's contract settings; statement orders are matched with
// the POS orders for that platform.
import { str, num, round2, isoDate, nameKey, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ platforms: {}, tolerance: 0.05 });
const LEVELS = { commission_over_rate: 'flag', processing_over_rate: 'flag', payout_math: 'flag', missing_from_statement: 'flag', error_charge: 'review', duplicate_order: 'review', not_in_pos: 'review', no_terms: 'watch' };
const abs = (v) => Math.abs(num(v) || 0);

export function deliveryPayouts({ statements = [], pos_orders = [] }, s = DEFAULTS) {
  const terms = (p) => { const e = Object.entries(s.platforms || {}).find(([k]) => nameKey(k) === nameKey(p)); return e ? e[1] : null; };
  const orders = new Map();
  for (const l of statements) { if (!str(l.order_id)) continue; const k = `${nameKey(l.platform)}|${nameKey(l.order_id)}`; if (!orders.has(k)) orders.set(k, []); orders.get(k).push(l); }
  const pos = new Map(); for (const o of pos_orders) if (str(o.order_id)) pos.set(`${nameKey(o.platform)}|${nameKey(o.order_id)}`, o);
  const items = []; let gross = 0, fees = 0, refunds = 0, paid = 0, disputable = 0;
  for (const [k, lines] of [...orders.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const first = lines[0]; const f = []; const t = terms(first.platform); let disp = 0;
    const orderLines = lines.filter((l) => !/adjust|refund|error/i.test(str(l.type)));
    if (orderLines.length > 1) f.push(finding('duplicate_order', `${str(first.platform)} order ${str(first.order_id)} appears ${orderLines.length} times on the statements; expect the platform to take the extra payment back.`, (orderLines.length - 1) * (num(orderLines[1].payout) || 0)));
    for (const l of lines) {
      const sub = num(l.subtotal) || 0, tax = num(l.tax) || 0, com = abs(l.commission), proc = abs(l.processing_fee), mkt = abs(l.marketing_fee), promo = abs(l.promo_funded), ref = abs(l.refund), adj = num(l.adjustment) || 0;
      const expected = round2(sub + tax - com - proc - mkt - promo - ref + adj); const got = num(l.payout);
      gross += sub; fees += com + proc + mkt + promo; refunds += ref; paid += got || 0;
      if (got !== null && Math.abs(expected - got) > s.tolerance) { f.push(finding('payout_math', `${str(l.platform)} order ${str(l.order_id)}: subtotal ${sub} + tax ${tax} - commission ${com} - fees ${round2(proc + mkt)} - promotions ${promo} - refunds ${ref} + adjustments ${adj} = ${expected}, but the payout is ${got}.`, expected - got)); if (expected > got) disp += expected - got; }
      if (t && num(t.commission_pct) !== null && com > (sub * num(t.commission_pct)) / 100 + s.tolerance) { const over = com - (sub * num(t.commission_pct)) / 100; f.push(finding('commission_over_rate', `${str(l.platform)} order ${str(l.order_id)}: commission ${com} on ${sub} is ${round2((com / sub) * 100)}%, over the ${num(t.commission_pct)}% contract rate by ${round2(over)}.`, over)); disp += over; }
      if (t && num(t.processing_pct) !== null && proc > (sub * num(t.processing_pct)) / 100 + s.tolerance) { const over = proc - (sub * num(t.processing_pct)) / 100; f.push(finding('processing_over_rate', `${str(l.platform)} order ${str(l.order_id)}: processing fee ${proc} is over ${num(t.processing_pct)}% of ${sub}.`, over)); disp += over; }
      if (ref > 0) f.push(finding('error_charge', `${str(l.platform)} order ${str(l.order_id)}: ${ref} charged back as a refund or error charge. Check the ticket and dispute it in the platform's window if the food went out right.`, ref));
    }
    if (!t) f.push(finding('no_terms', `No contract terms for ${str(first.platform)} in the settings, so its commission was not checked.`));
    if (pos_orders.length && !pos.has(k)) f.push(finding('not_in_pos', `${str(first.platform)} order ${str(first.order_id)} is on the statement but not in the POS orders.`));
    disputable += disp;
    items.push({ order_id: str(first.order_id), platform: str(first.platform), date: isoDate(first.date), subtotal: round2(num(first.subtotal) || 0), commission: round2(abs(first.commission)), refund: round2(lines.reduce((t2, l) => t2 + abs(l.refund), 0)), payout: round2(lines.reduce((t2, l) => t2 + (num(l.payout) || 0), 0)), lines: lines.length, disputable: round2(disp), status: statusOf(f, LEVELS), findings: f });
  }
  for (const [k, o] of [...pos.entries()].sort((a, b) => cmp(a[0], b[0]))) if (!orders.has(k)) {
    const sub = num(o.subtotal) || 0;
    const f = [finding('missing_from_statement', `${str(o.platform)} order ${str(o.order_id)} (${isoDate(o.date)}, subtotal ${sub}) is in the POS but on no statement: it was never paid out.`, sub)];
    disputable += sub;
    items.push({ order_id: str(o.order_id), platform: str(o.platform), date: isoDate(o.date), subtotal: round2(sub), commission: null, refund: 0, payout: 0, lines: 0, disputable: round2(sub), status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { orders: items.length, subtotal: round2(gross), platform_fees: round2(fees), refunds: round2(refunds), payouts: round2(paid), disputable: round2(disputable) } };
}
