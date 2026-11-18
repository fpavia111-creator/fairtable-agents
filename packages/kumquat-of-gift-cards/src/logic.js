// Gift card liability: what is still owed on cards sold, by location, with cards whose
// numbers do not add up, dormant cards and cards spent at another location.
import { str, num, round2, isoDate, daysBetween, nameKey, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ as_of: null, dormancy_months: 24, large_balance: 250, tolerance: 0.01 });
const LEVELS = { negative_balance: 'flag', balance_math: 'flag', dormant: 'watch', large_balance: 'review', cross_location: 'watch', no_balance: 'review' };

export function giftCards({ cards = [] }, s = DEFAULTS) {
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const items = []; let liability = 0, dormantL = 0; const byLoc = new Map();
  for (const c of cards) {
    if (!str(c.card)) continue;
    const f = []; const issued = num(c.issued_amount), red = num(c.redeemed) || 0, bal = num(c.balance);
    if (bal === null) f.push(finding('no_balance', `${str(c.card)} has no balance in the export.`));
    else {
      if (bal < 0) f.push(finding('negative_balance', `${str(c.card)} has a negative balance of ${bal}: it was redeemed for more than it held.`, -bal));
      if (issued !== null && Math.abs(issued - red - bal) > s.tolerance) f.push(finding('balance_math', `${str(c.card)}: issued ${issued} - redeemed ${red} = ${round2(issued - red)}, but the balance shows ${bal}.`, bal - (issued - red)));
      if (bal >= s.large_balance) f.push(finding('large_balance', `${str(c.card)} holds ${bal}; check a large card was paid for before it is honoured.`, bal));
    }
    const last = isoDate(c.last_activity) || isoDate(c.issued_date); const idle = last ? daysBetween(last, asOf) : null;
    const isDormant = bal > 0 && idle !== null && idle >= (s.dormancy_months * 365) / 12;
    if (isDormant) f.push(finding('dormant', `${str(c.card)}: ${bal} with no activity since ${last} (${Math.floor(idle / 30.44)} months). Unclaimed-property and breakage rules differ by state; ask your accountant before treating it as income.`, bal));
    if (str(c.last_location) && str(c.issued_location) && nameKey(c.last_location) !== nameKey(c.issued_location) && red > 0) f.push(finding('cross_location', `${str(c.card)} was sold at ${str(c.issued_location)} and used at ${str(c.last_location)}; the two locations settle ${red} between them if they keep separate books.`, red));
    const loc = str(c.issued_location) || '(none)';
    if (bal > 0) { liability += bal; if (isDormant) dormantL += bal; byLoc.set(loc, (byLoc.get(loc) || 0) + bal); }
    items.push({ card: str(c.card), holder: str(c.holder), issued_location: loc, issued_date: isoDate(c.issued_date), issued_amount: issued, redeemed: round2(red), balance: bal, last_activity: last, idle_days: idle, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { cards: items.length, liability: round2(liability), dormant_liability: round2(dormantL), open_cards: items.filter((i) => i.balance > 0).length }, extra: { as_of: asOf, by_location: Object.fromEntries([...byLoc.entries()].sort((a, b) => cmp(a[0], b[0])).map(([k, v]) => [k, round2(v)])) } };
}
