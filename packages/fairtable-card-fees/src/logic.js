// Card processing statements per location and month: effective rate, processor markup
// against the agreed rate (basis points on volume plus a per-transaction fee), fees not in
// the agreement, monthly fees over their cap, and downgrade surcharges.
import { str, num, round2, round4, nameKey, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ markup_bps: null, per_transaction_fee: 0, allowed_fees: {}, rate_up_bps: 15, tolerance: 1 });
const LEVELS = { markup_over_contract: 'flag', effective_rate_up: 'flag', fee_over_cap: 'flag', unexpected_fee: 'review', downgrade_surcharge: 'watch', no_volume: 'review' };
const PASS = /interchange|assessment|network|dues/i;
const DOWNGRADE = /non.?qual|downgrade|mid.?qual|surcharge/i;

export function cardFees({ statements = [] }, s = DEFAULTS) {
  const groups = new Map();
  for (const l of statements) { const k = `${nameKey(l.location)}|${str(l.month)}`; if (!str(l.month)) continue; const e = groups.get(k) || { location: str(l.location), month: str(l.month), volume: 0, txns: 0, fees: 0, markup: 0, lines: [] }; e.volume += num(l.volume) || 0; e.txns += num(l.transactions) || 0; const a = Math.abs(num(l.amount) || 0); e.fees += a; if (/markup|processor|discount rate|service charge/i.test(`${str(l.fee_type)} ${str(l.fee_name)}`) && !/monthly/i.test(str(l.fee_type))) e.markup += a; e.lines.push({ ...l, a }); groups.set(k, e); }
  const allowed = new Map(Object.entries(s.allowed_fees || {}).map(([k, v]) => [nameKey(k), v]));
  const items = []; const prevRate = new Map(); let fees = 0, volume = 0, recover = 0;
  for (const e of [...groups.values()].sort((a, b) => cmp(`${nameKey(a.location)}|${a.month}`, `${nameKey(b.location)}|${b.month}`))) {
    const f = []; const rate = e.volume ? round4((e.fees / e.volume) * 100) : null;
    if (!e.volume) f.push(finding('no_volume', `${e.location} ${e.month}: fees of ${round2(e.fees)} and no card volume in the file.`));
    if (s.markup_bps !== null && s.markup_bps !== undefined && e.volume) {
      const agreed = (e.volume * s.markup_bps) / 10000 + e.txns * (s.per_transaction_fee || 0);
      if (e.markup > agreed + s.tolerance) { f.push(finding('markup_over_contract', `${e.location} ${e.month}: processor markup ${round2(e.markup)} against ${round2(agreed)} at the agreed ${s.markup_bps / 100}% + ${s.per_transaction_fee} a transaction on ${round2(e.volume)} and ${e.txns} transactions.`, e.markup - agreed)); recover += e.markup - agreed; }
    }
    for (const l of e.lines) {
      if (PASS.test(`${str(l.fee_type)} ${str(l.fee_name)}`) || /markup|processor/i.test(`${str(l.fee_type)} ${str(l.fee_name)}`) && !/monthly/i.test(str(l.fee_type))) continue;
      if (DOWNGRADE.test(str(l.fee_name))) { f.push(finding('downgrade_surcharge', `${e.location} ${e.month}: "${str(l.fee_name)}" ${round2(l.a)}. Downgrades often come from keyed or late-settled transactions; ask the processor which ones.`, l.a)); continue; }
      const cap = allowed.get(nameKey(l.fee_name));
      if (cap === undefined) { f.push(finding('unexpected_fee', `${e.location} ${e.month}: "${str(l.fee_name)}" ${round2(l.a)} is not a fee in your agreement settings.`, l.a)); recover += l.a; }
      else if (l.a > Number(cap) + s.tolerance) { f.push(finding('fee_over_cap', `${e.location} ${e.month}: "${str(l.fee_name)}" ${round2(l.a)} against the agreed ${cap}.`, l.a - Number(cap))); recover += l.a - Number(cap); }
    }
    const before = prevRate.get(nameKey(e.location));
    if (before !== undefined && rate !== null && before !== null && (rate - before) * 100 >= s.rate_up_bps) f.push(finding('effective_rate_up', `${e.location}: effective rate ${rate}% in ${e.month} against ${before}% the month before (+${Math.round((rate - before) * 100)} basis points).`, ((rate - before) / 100) * e.volume));
    prevRate.set(nameKey(e.location), rate);
    fees += e.fees; volume += e.volume;
    items.push({ line: `${e.location} ${e.month}`, location: e.location, month: e.month, volume: round2(e.volume), transactions: e.txns, total_fees: round2(e.fees), markup: round2(e.markup), effective_rate_pct: rate, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { statements: items.length, card_volume: round2(volume), total_fees: round2(fees), effective_rate_pct: volume ? round4((fees / volume) * 100) : null, to_recover: round2(recover) } };
}
