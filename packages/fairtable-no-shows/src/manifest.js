import { readFileSync } from 'node:fs';
import { tableAgent, RESERVATION_FIELDS, RESERVATION_PROFILES, REFUSE, letter, money, pctText } from 'fairtable-core';
import { noShows, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { reservations: { type: 'string', description: 'Reservation export under --root (OpenTable or Resy): reservation id, guest, phone, email, date, time, party size, status, deposit, fee charged, source' } };
export const DEMO = { title: 'Fairtable No-Shows', files: { reservations: 'reservations.csv', settings: 'settings.json' }, explain: { arg: 'guest', value: 'Morgan Ellis' }, draft: { location: 'Main Street' } };
const REFUSE_CHARGE = { name: 'card_charge', category: 'move_money', description: 'Never charges a no-show fee or a deposit to a guest\'s card.' };
const REFUSE_SMS = { name: 'guest_message_send', category: 'binding_send', description: 'Never texts, emails or calls a guest.' };

export const manifest = tableAgent({
  pkg, prefix: 'no_shows',
  description: 'Reservation no-shows from your OpenTable or Resy export: the no-show rate by day, guests who no-show again (recognised by phone, email or name), large parties booked with no deposit and no-show fees your policy says to charge, with covers and sales lost. Guest names, phones and emails are masked for the AI model. Writes a worklist and a policy memo draft. Never charges a card or messages a guest.',
  check: { title: 'Reservation no-shows', description: 'Count no-shows by guest and by day of the week, estimate covers and sales lost at the average check, and flag repeat no-shows, large parties with no deposit, no-show fees not charged under the policy in the settings and a no-show rate over target.' },
  args: files, required: ['reservations'],
  sources: { reservations: { label: 'Reservations', args: ['reservations'], fields: RESERVATION_FIELDS, profiles: RESERVATION_PROFILES } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    deposit_party_size: { type: 'integer', minimum: 1, description: 'Your policy asks for a deposit from parties this size (default 6)' },
    no_show_fee_per_guest: { type: 'number', minimum: 0, description: 'Your no-show fee per guest when a card is held (default 0 = no fee policy)' },
    repeat_no_shows: { type: 'integer', minimum: 2, description: 'No-shows by one guest that count as repeat (default 2)' },
    average_check_per_cover: { type: 'number', minimum: 0, description: 'Average spend per guest, for the sales lost estimate (default 45)' },
    flag_rate_pct: { type: 'number', minimum: 0, description: 'Flag a no-show rate over this % (default 15)' },
  } } },
  run: ({ rows, settings }) => noShows(rows, settings),
  key: { arg: 'guest', field: 'guest', label: 'guest', person: true },
  summary: (o) => `${o.totals.no_shows} no-show(s) out of ${o.totals.reservations} reservation(s) (${pctText(o.totals.no_show_rate)}): ${o.totals.covers_lost} covers, about ${money(o.totals.sales_lost_estimate)} in sales; fees not charged under the policy ${money(o.totals.fees_not_charged)}. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Reservation no-shows', base: 'no-shows',
    row: (i) => ({ guest: i.guest ?? '', phone: i.phone ?? '', no_shows: i.no_shows ?? '', covers_lost: i.covers_lost ?? '', sales_lost_estimate: i.sales_lost_estimate ?? '', last_no_show: i.last_no_show ?? '' }),
    htmlColumns: ['guest', 'no_shows', 'covers_lost', 'sales_lost_estimate', 'last_no_show'],
    sections: (o) => [{ title: 'By day', rows: o.extra.by_day.map((d) => ({ day: d.day, count: d.reservations, no_shows: d.no_shows, rate: d.rate })), columns: ['day', 'count', 'no_shows', 'rate'] }],
  },
  draft: {
    noun: 'policy_memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/policy_memo-<location>.md: the no-show numbers and the guests and bookings that the deposit and fee policy should have covered, for the hosts and the owner. Marked DRAFT; it does not contact any guest.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Host team and owner' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, amount: o.totals.sales_lost_estimate, text: letter({ title: `No-shows and our reservation policy${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Deposits, card holds and repeat no-shows',
      intro: `${o.totals.no_shows} of ${o.totals.reservations} reservations did not show (${pctText(o.totals.no_show_rate)}), about ${o.totals.covers_lost} covers.`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ guest: i.guest, no_shows: i.no_shows, covers: i.covers_lost, issue: i.findings.map((f) => f.code).join(' ') })), columns: ['guest', 'no_shows', 'covers', 'issue'],
      closing: ['Policy change agreed (deposits, card holds, confirmation calls): [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE_CHARGE, REFUSE_SMS, REFUSE.platform],
  memory: null,
});
