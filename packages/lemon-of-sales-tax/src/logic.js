// Sales tax collected in the POS against the rates in the settings, per location and menu
// category. Delivery-marketplace orders are kept apart: where the marketplace collects and
// remits the tax, tax on those orders in the POS may be remitted twice.
import { str, num, round2, nameKey, readYesNo, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ locations: {}, marketplace_channels: ['DoorDash', 'Uber Eats', 'Grubhub'], tolerance_pct: 0.5, tolerance_amount: 2 });
const LEVELS = { under_collected: 'flag', over_collected: 'review', marketplace_tax_in_pos: 'review', unknown_location: 'review', exempt_sales: 'watch' };

export function salesTax({ sales = [] }, s = DEFAULTS) {
  const loc = (l) => { const e = Object.entries(s.locations || {}).find(([k]) => nameKey(k) === nameKey(l)); return e ? e[1] : null; };
  const isMarket = (c) => (s.marketplace_channels || []).some((m) => nameKey(m) === nameKey(c));
  const lines = new Map();
  for (const r of sales) {
    const market = isMarket(r.channel); const exempt = readYesNo(r.tax_exempt) === true;
    const k = `${str(r.location)} | ${str(r.category) || '(no category)'}${market ? ' | marketplace' : ''}${exempt ? ' | exempt' : ''}`;
    const e = lines.get(k) || { line: k, location: str(r.location), category: str(r.category) || '(no category)', market, exempt, channels: new Set(), net: 0, tax: 0 };
    e.net += num(r.net_sales) || 0; e.tax += num(r.tax) || 0; if (str(r.channel)) e.channels.add(str(r.channel)); lines.set(k, e);
  }
  const items = []; let net = 0, collected = 0, expectedAll = 0, under = 0, over = 0;
  for (const e of [...lines.values()].sort((a, b) => cmp(a.line, b.line))) {
    const f = []; const L = loc(e.location);
    const rate = L ? (L.category_rates && Object.entries(L.category_rates).find(([c]) => nameKey(c) === nameKey(e.category)) ? Number(Object.entries(L.category_rates).find(([c]) => nameKey(c) === nameKey(e.category))[1]) : Number(L.rate_pct)) : null;
    let expected = null;
    net += e.net; collected += e.tax;
    if (e.market) { expected = 0; if (e.tax > s.tolerance_amount) f.push(finding('marketplace_tax_in_pos', `${e.line}: ${round2(e.tax)} of tax recorded in the POS on ${[...e.channels].join(', ')} orders. Where the marketplace collects and remits the tax, remitting this too would pay it twice; check how the POS records these orders.`, e.tax)); }
    else if (e.exempt) { expected = 0; f.push(finding('exempt_sales', `${e.line}: ${round2(e.net)} of sales marked tax-exempt. Keep the exemption certificate for each one.`, e.net)); }
    else if (rate === null) f.push(finding('unknown_location', `${e.location} has no tax rate in the settings, so ${round2(e.net)} of sales were not checked.`));
    else {
      expected = round2((e.net * rate) / 100); const diff = round2(e.tax - expected);
      const tol = Math.max(s.tolerance_amount, (Math.abs(expected) * s.tolerance_pct) / 100);
      if (diff < -tol) { f.push(finding('under_collected', `${e.line}: collected ${round2(e.tax)} on ${round2(e.net)} (${round2((e.tax / e.net) * 100)}%), the settings say ${rate}% = ${expected}; ${-diff} under.`, -diff)); under += -diff; }
      else if (diff > tol) { f.push(finding('over_collected', `${e.line}: collected ${round2(e.tax)}, the settings say ${rate}% = ${expected}; ${diff} over. Over-collected tax is usually owed to the state, not kept.`, diff)); over += diff; }
    }
    if (expected !== null) expectedAll += expected;
    items.push({ line: e.line, location: e.location, jurisdiction: L ? str(L.jurisdiction) : '', category: e.category, channel: [...e.channels].sort().join(', '), net_sales: round2(e.net), tax_collected: round2(e.tax), rate_pct: e.market || e.exempt ? 0 : rate, tax_expected: expected, difference: expected === null ? null : round2(e.tax - expected), status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { lines: items.length, net_sales: round2(net), tax_collected: round2(collected), tax_expected: round2(expectedAll), under_collected: round2(under), over_collected: round2(over) } };
}
