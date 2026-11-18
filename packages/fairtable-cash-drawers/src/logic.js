// Cash over and short for every drawer and shift.
// Expected cash = starting bank + cash sales - paid-outs - cash tips paid out.
// Over/short = counted - expected. The deposit plus the bank left for tomorrow should
// equal what was counted.
import { str, num, round2, isoDate, personKey, displayName, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ flag_short: 5, watch_amount: 1, review_over: 5, repeat_shorts: 3 });
const LEVELS = { short: 'flag', deposit_mismatch: 'flag', repeat_shorts: 'flag', over: 'review', small_difference: 'watch', paid_out_no_receipt: 'review', missing_count: 'review' };

export function drawers({ drawers: rows = [] }, s = DEFAULTS) {
  const items = []; const shortsBy = new Map(); let sales = 0, net = 0, shorts = 0;
  for (const r of rows) {
    if (!str(r.drawer) && !str(r.date)) continue;
    const f = []; const bank = num(r.starting_bank) || 0, cash = num(r.cash_sales) || 0, out = num(r.paid_outs) || 0, tips = num(r.cash_tips_paid) || 0;
    const expected = round2(bank + cash - out - tips); const counted = num(r.counted);
    sales += cash; let diff = null;
    if (counted === null) f.push(finding('missing_count', `${str(r.drawer)} on ${isoDate(r.date)}: no count recorded; expected ${expected} in the drawer.`));
    else {
      diff = round2(counted - expected); net += diff;
      if (diff <= -s.flag_short) { f.push(finding('short', `${str(r.drawer)} on ${isoDate(r.date)}: counted ${counted}, expected ${expected} (bank ${bank} + cash sales ${cash} - paid-outs ${out} - tips paid ${tips}); short ${-diff}.`, -diff)); shorts += -diff; const k = personKey(r.employee); if (k) { const e = shortsBy.get(k) || []; e.push(items.length); shortsBy.set(k, e); } }
      else if (diff >= s.review_over) f.push(finding('over', `${str(r.drawer)} on ${isoDate(r.date)}: over by ${diff}. An over can mean a sale rung as cash and paid by card, or a missed paid-out.`, diff));
      else if (Math.abs(diff) >= s.watch_amount) f.push(finding('small_difference', `${str(r.drawer)} on ${isoDate(r.date)}: ${diff > 0 ? 'over' : 'short'} ${Math.abs(diff)}.`, Math.abs(diff)));
      const dep = num(r.deposit), next = num(r.next_bank);
      if (dep !== null) { const left = round2(counted - (next ?? 0) - dep); if (Math.abs(left) > s.watch_amount) f.push(finding('deposit_mismatch', `${str(r.drawer)} on ${isoDate(r.date)}: counted ${counted}, deposit ${dep} + next bank ${next ?? 0}; ${left} is not accounted for.`, Math.abs(left))); }
    }
    if (out > 0 && !(num(r.paid_out_receipts) > 0)) f.push(finding('paid_out_no_receipt', `${str(r.drawer)} on ${isoDate(r.date)}: paid-outs of ${out} with no receipt recorded.`, out));
    items.push({ drawer_day: `${str(r.drawer)} ${isoDate(r.date) || ''}`.trim(), drawer: str(r.drawer), date: isoDate(r.date), employee: displayName(r.employee), expected, counted, over_short: diff, deposit: num(r.deposit), status: 'ok', findings: f });
  }
  for (const [, idx] of shortsBy) if (idx.length >= s.repeat_shorts) for (const i of idx) items[i].findings.push(finding('repeat_shorts', `${items[i].employee} was short on ${idx.length} shifts in this period (total ${round2(idx.reduce((t, j) => t + -items[j].over_short, 0))}).`));
  for (const i of items) i.status = statusOf(i.findings, LEVELS);
  items.sort((a, b) => cmp(a.drawer_day, b.drawer_day));
  return { items, totals: { drawer_days: items.length, cash_sales: round2(sales), net_over_short: round2(net), total_short: round2(shorts) } };
}
