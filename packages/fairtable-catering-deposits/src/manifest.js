import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, money, nameKey } from 'fairtable-core';
import { catering, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const EVENT_FIELDS = {
  event_id: t(['Event ID', 'Event', 'Booking ID', 'BEO', 'Order Number'], { required: true }),
  client: t(['Client', 'Customer', 'Host', 'Contact', 'Organizer'], { personal: true }),
  location: t(['Location', 'Venue', 'Restaurant', 'Room']),
  booked_date: t(['Booked Date', 'Booked', 'Created'], { type: 'date' }),
  event_date: t(['Event Date', 'Date', 'Function Date'], { type: 'date' }),
  guests: t(['Guests', 'Guest Count', 'Headcount', 'Covers'], { type: 'number' }),
  total: t(['Total', 'Contract Total', 'Estimated Total', 'Amount'], { type: 'money' }),
  deposit_pct: t(['Deposit %', 'Deposit Pct', 'Deposit Percent'], { type: 'number' }),
  status: t(['Status', 'Booking Status', 'State']),
  cancelled_date: t(['Cancelled Date', 'Cancelled On', 'Cancellation Date'], { type: 'date' }),
};
const PAYMENT_FIELDS = {
  event_id: t(['Event ID', 'Event', 'Booking ID', 'Reference', 'Order Number'], { required: true }),
  date: t(['Date', 'Payment Date', 'Received'], { type: 'date' }),
  amount: t(['Amount', 'Payment', 'Paid'], { type: 'money' }),
  type: t(['Type', 'Payment Type', 'Kind']),
  method: t(['Method', 'Tender', 'Payment Method']),
};
const files = {
  events: { type: 'string', description: 'Catering or private-event bookings under --root: event id, client, event date, total, deposit %, status, cancelled date' },
  payments: { type: 'string', description: 'Payments received: event id, date, amount, type (deposit, balance, refund), method' },
};
export const DEMO = { title: 'Fairtable Catering Deposits', files: { events: 'events.csv', payments: 'payments.csv', settings: 'settings.json' }, explain: { arg: 'event_id', value: 'EV-302' }, draft: { event_id: 'EV-302' } };

export const manifest = tableAgent({
  pkg, prefix: 'catering',
  description: 'Catering and private-event deposits and balances against your bookings as of a date: deposits missing as the event gets close, balances overdue after it, overpayments, refunds owed on cancellations under your policy and payments with no booking. Client names are masked for the AI model. Writes a worklist and a reminder draft per event. Never charges or refunds anyone.',
  check: { title: 'Catering deposits and balances', description: 'For each booking: the deposit required (% of the total), what was received, and the balance; flags deposits missing inside the deposit window, balances overdue after the event, overpayments, refunds owed on cancellations made early enough for a full refund, and payments for events not booked.' },
  args: files, required: ['events', 'payments'],
  sources: {
    events: { label: 'Event bookings', args: ['events'], fields: EVENT_FIELDS },
    payments: { label: 'Payments received', args: ['payments'], fields: PAYMENT_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the check is run for (default: today)' },
    deposit_due_days_before: { type: 'integer', minimum: 0, description: 'The deposit is due this many days before the event (default 30)' },
    balance_due_days_after: { type: 'integer', minimum: 0, description: 'The balance is overdue this many days after the event (default 3)' },
    full_refund_days_before: { type: 'integer', minimum: 0, description: 'Your policy refunds the deposit in full when cancelled at least this many days before (default 14)' },
  } } },
  run: ({ rows, settings }) => catering(rows, settings),
  key: { arg: 'event_id', field: 'event_id', label: 'event' },
  summary: (o) => `${o.totals.events} booking(s) at ${o.extra.as_of}: booked ${money(o.totals.booked_total)}, received ${money(o.totals.received)}; owed to you ${money(o.totals.owed_to_us)}, owed back ${money(o.totals.owed_back)}. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Catering deposits and balances', base: 'catering-deposits',
    row: (i) => ({ event_id: i.event_id ?? '', client: i.client ?? '', location: i.location ?? '', event_date: i.event_date ?? '', booking_status: i.booking_status ?? '', total: i.total ?? '', deposit_required: i.deposit_required ?? '', received: i.received ?? '', balance: i.balance ?? '' }),
    htmlColumns: ['event_id', 'event_date', 'booking_status', 'total', 'deposit_required', 'received', 'balance'],
    sections: (o) => [{ title: 'By event', rows: o.items.map((i) => ({ event_id: i.event_id, event_date: i.event_date, balance: i.balance })), columns: ['event_id', 'event_date', 'balance'] }],
  },
  draft: {
    noun: 'reminder', verb: 'send', actor: 'the events manager', required: ['events', 'payments', 'event_id'],
    description: 'Write drafts/reminder-<event>.md: a polite reminder to the client of the deposit or balance due, or a note of the refund owed, for a person to send. Marked DRAFT.',
    args: { event_id: { type: 'string', description: 'Event id' }, to: { type: 'string', description: 'Client contact' }, from: { type: 'string', description: 'Your name and restaurant' } },
    build: (o, a) => {
      const ev = o.items.find((i) => nameKey(i.event_id) === nameKey(a.event_id));
      if (!ev) throw new Error(`event "${String(a.event_id).slice(0, 40)}" not found`);
      const due = ev.findings.find((f) => ['deposit_missing', 'balance_overdue'].includes(f.code)); const back = ev.findings.find((f) => ['overpaid', 'cancelled_refund_due'].includes(f.code));
      if (!due && !back) throw new Error(`nothing is due on ${ev.event_id}`);
      return { id: ev.event_id, to: a.to, amount: (due || back).amount, text: letter({ title: due ? `Payment reminder: ${ev.event_id}` : `Refund due: ${ev.event_id}`, to: a.to, from: a.from, re: `Your event on ${ev.event_date || '[TO CONFIRM]'}`,
        intro: due ? `Thank you for booking with us. Our records show ${money(due.amount)} ${due.code === 'deposit_missing' ? 'of the deposit is still due before the event' : 'of the balance is still open after the event'}.` : `Our records show ${money(back.amount)} is owed back to you; we will confirm how it will be returned.`,
        rows: [{ event: ev.event_id, date: ev.event_date, total: money(ev.total), received: money(ev.received), balance: money(ev.balance) }], columns: ['event', 'date', 'total', 'received', 'balance'],
        closing: ['How to pay / how we refund: [TO CONFIRM]'] }) };
    },
  },
  refused: [REFUSE.pay, REFUSE.refund, REFUSE.email],
  memory: null,
});
