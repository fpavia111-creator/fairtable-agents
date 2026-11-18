import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, money } from 'fairtable-core';
import { giftCards, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const CARD_FIELDS = {
  card: t(['Card', 'Card Number', 'Gift Card', 'Card ID', 'GAN'], { required: true }),
  holder: t(['Holder', 'Customer', 'Purchaser', 'Name', 'Recipient'], { personal: true }),
  issued_date: t(['Issued Date', 'Activation Date', 'Sold Date', 'Purchase Date', 'Issued'], { type: 'date' }),
  issued_location: t(['Issued Location', 'Sold At', 'Activation Location', 'Location']),
  issued_amount: t(['Issued Amount', 'Initial Value', 'Load Amount', 'Amount Loaded'], { type: 'money' }),
  redeemed: t(['Redeemed', 'Amount Redeemed', 'Total Redeemed', 'Spent'], { type: 'money' }),
  balance: t(['Balance', 'Current Balance', 'Remaining Balance', 'Outstanding'], { type: 'money' }),
  last_activity: t(['Last Activity', 'Last Used', 'Last Transaction', 'Last Redemption'], { type: 'date' }),
  last_location: t(['Last Location', 'Last Used At', 'Redeemed At']),
};
const files = { cards: { type: 'string', description: 'Gift card export under --root (Toast, Square or your gift card provider): card, issued date and location, amount loaded, amount redeemed, balance, last activity and where' } };
export const DEMO = { title: 'Fairtable Gift Cards', files: { cards: 'cards.csv', settings: 'settings.json' }, explain: { arg: 'card', value: 'GC-1005' }, draft: {} };

export const manifest = tableAgent({
  pkg, prefix: 'gift_cards',
  description: 'The outstanding gift card liability by location from your gift card export, with balances that do not add up, negative balances, large cards, dormant cards and cards sold at one location and spent at another. Card holders are masked for the AI model. Writes a worklist and a memo draft for the accountant. Never changes a card and never recognises breakage.',
  check: { title: 'Gift card liability', description: 'Add up the balance still owed on every card, by the location that sold it; check each card\'s issued - redeemed = balance; flag negative and mismatched balances and list large, dormant and cross-location cards for the accountant.' },
  args: files, required: ['cards'],
  sources: { cards: { label: 'Gift cards', args: ['cards'], fields: CARD_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the liability is measured at (default: today)' },
    dormancy_months: { type: 'number', minimum: 1, description: 'Months with no activity before a card counts as dormant (default 24; check your state)' },
    large_balance: { type: 'number', minimum: 0, description: 'Review cards holding at least this much (default 250)' },
    tolerance: { type: 'number', minimum: 0, description: 'Rounding allowed in the balance check (default 0.01)' },
  } } },
  run: ({ rows, settings }) => giftCards(rows, settings),
  key: { arg: 'card', field: 'card', label: 'gift card' },
  summary: (o) => `${o.totals.cards} card(s) at ${o.extra.as_of}: liability ${money(o.totals.liability)} on ${o.totals.open_cards} open card(s), of which ${money(o.totals.dormant_liability)} is dormant. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Gift card liability', base: 'gift-cards',
    row: (i) => ({ card: i.card ?? '', holder: i.holder ?? '', issued_location: i.issued_location ?? '', issued_date: i.issued_date ?? '', issued_amount: i.issued_amount ?? '', redeemed: i.redeemed ?? '', balance: i.balance ?? '', last_activity: i.last_activity ?? '', idle_days: i.idle_days ?? '' }),
    htmlColumns: ['card', 'issued_location', 'issued_amount', 'redeemed', 'balance', 'last_activity'],
    sections: (o) => [{ title: 'By location', rows: Object.entries(o.extra.by_location).map(([location, amount]) => ({ location, amount })), columns: ['location', 'amount'] }],
    limits: ['Reads only the gift card export you give it. It does not log in to a POS or gift card provider and changes no card.', 'Dormancy, escheat (unclaimed property) and breakage rules differ by state and by accounting policy; the dormancy period is a setting. An accountant decides what to report or recognise.', 'Not legal, tax or accounting advice.'],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the owner',
    description: 'Write drafts/memo-<as of date>.md: the gift card liability by location and the cards to look at, for the accountant. Marked DRAFT.',
    args: { to: { type: 'string', description: 'Accountant or bookkeeper' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: `gift-cards-${o.extra.as_of}`, to: a.to, amount: o.totals.liability, text: letter({ title: `Gift card liability at ${o.extra.as_of}`, to: a.to, from: a.from, re: 'Outstanding balances and cards to check',
      intro: `Outstanding gift card balances total ${money(o.totals.liability)}; ${money(o.totals.dormant_liability)} has had no activity for the dormancy period in our settings. By location: ${Object.entries(o.extra.by_location).map(([k, v]) => `${k} ${money(v)}`).join(', ')}.`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ card: i.card, balance: money(i.balance), last_activity: i.last_activity, issue: i.findings.map((f) => f.code).join(' ') })), columns: ['card', 'balance', 'last_activity', 'issue'],
      closing: ['How to treat dormant balances (report, keep, recognise): [TO CONFIRM with the accountant]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.ledger, REFUSE.email],
  memory: null,
});
