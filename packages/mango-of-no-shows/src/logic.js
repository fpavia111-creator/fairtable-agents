// Reservation no-shows: the rate, the guests who no-show again, large parties with no
// deposit, and fees the restaurant's own policy says to charge. A guest is recognised by
// phone number first, then email, then name (in either order).
import { str, num, round2, isoDate, dayName, personKey, displayName, pct, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ deposit_party_size: 6, no_show_fee_per_guest: 0, repeat_no_shows: 2, average_check_per_cover: 45, flag_rate_pct: 15 });
const LEVELS = { repeat_no_show: 'flag', large_party_no_deposit: 'review', fee_not_charged: 'review', no_show: 'watch', high_no_show_rate: 'flag' };
const isNoShow = (s) => /no.?show/i.test(str(s));
const isCancel = (s) => /cancel/i.test(str(s));

export function noShows({ reservations = [] }, s = DEFAULTS) {
  const guests = new Map(); const days = new Map(); let total = 0, ns = 0, covers = 0;
  for (const r of reservations) {
    const d = isoDate(r.date); if (!d) continue; total++;
    const phone = str(r.phone).replace(/\D/g, ''); const id = phone.length >= 7 ? `p:${phone}` : str(r.email) ? `e:${str(r.email).toLowerCase()}` : `n:${personKey(r.guest)}`;
    const day = dayName(d); const de = days.get(day) || { day, reservations: 0, no_shows: 0 }; de.reservations++;
    if (isNoShow(r.status)) {
      ns++; de.no_shows++; const party = num(r.party_size) || 0; covers += party;
      const g = guests.get(id) || { guest: displayName(r.guest), phone: str(r.phone), list: [] }; g.list.push({ ...r, d, party }); guests.set(id, g);
    }
    days.set(day, de);
  }
  const items = []; let feesMissed = 0;
  for (const g of [...guests.values()].sort((a, b) => cmp(personKey(a.guest), personKey(b.guest)))) {
    const f = []; const parties = g.list.reduce((t, x) => t + x.party, 0);
    if (g.list.length >= s.repeat_no_shows) f.push(finding('repeat_no_show', `${g.guest} did not show ${g.list.length} times (${g.list.map((x) => `${x.d} party of ${x.party}`).join(', ')}).`, parties * s.average_check_per_cover));
    else f.push(finding('no_show', `${g.guest} did not show on ${g.list[0].d} (party of ${g.list[0].party}).`, parties * s.average_check_per_cover));
    for (const x of g.list) {
      const dep = num(x.deposit) || 0; const fee = num(x.fee_charged) || 0;
      if (x.party >= s.deposit_party_size && dep === 0) f.push(finding('large_party_no_deposit', `${g.guest}: party of ${x.party} on ${x.d} booked by ${str(x.source) || 'unknown'} with no deposit, though the policy asks for one from ${s.deposit_party_size} guests.`));
      if (s.no_show_fee_per_guest > 0 && dep > 0 && fee === 0) { const owed = x.party * s.no_show_fee_per_guest; feesMissed += owed; f.push(finding('fee_not_charged', `${g.guest}: no-show on ${x.d} with a deposit or card held and no fee charged; the policy fee would be ${owed}. A person decides whether to charge it.`, owed)); }
    }
    items.push({ guest: g.guest, phone: g.phone, no_shows: g.list.length, covers_lost: parties, sales_lost_estimate: round2(parties * s.average_check_per_cover), last_no_show: g.list.map((x) => x.d).sort().at(-1), status: statusOf(f, LEVELS), findings: f });
  }
  const rate = pct(ns, total);
  if (rate !== null && rate > s.flag_rate_pct) items.push({ guest: 'All reservations', phone: '', no_shows: ns, covers_lost: covers, sales_lost_estimate: round2(covers * s.average_check_per_cover), last_no_show: null, status: 'flag', findings: [finding('high_no_show_rate', `${ns} of ${total} reservations were no-shows (${rate}%), over the ${s.flag_rate_pct}% target.`, covers * s.average_check_per_cover)] });
  return { items, totals: { reservations: total, no_shows: ns, no_show_rate: rate, covers_lost: covers, sales_lost_estimate: round2(covers * s.average_check_per_cover), fees_not_charged: round2(feesMissed) }, extra: { by_day: [...days.values()].sort((a, b) => cmp(a.day, b.day)).map((x) => ({ ...x, rate: pct(x.no_shows, x.reservations) })) } };
}
