import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, money } from 'fairtable-core';
import { utilities, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const BILL_FIELDS = {
  account: t(['Account', 'Account Number', 'Meter', 'Service Account'], { required: true }),
  utility: t(['Utility', 'Service', 'Type', 'Commodity']),
  location: t(['Location', 'Store', 'Restaurant', 'Site', 'Service Address']),
  period_start: t(['Period Start', 'Service From', 'From', 'Start'], { type: 'date' }),
  period_end: t(['Period End', 'Service To', 'To', 'End'], { type: 'date' }),
  usage: t(['Usage', 'Consumption', 'Quantity', 'kWh', 'Therms'], { type: 'number' }),
  unit: t(['Unit', 'UOM', 'Usage Unit']),
  amount: t(['Amount', 'Total', 'Amount Due', 'Current Charges'], { type: 'money' }),
  read_type: t(['Read Type', 'Reading', 'Meter Read', 'Actual/Estimated']),
  late_fee: t(['Late Fee', 'Late Charge', 'Penalty'], { type: 'money' }),
};
const files = { bills: { type: 'string', description: 'Utility bills under --root (typed from the bills or exported from a bill-pay service): account, utility, location, service period, usage, unit, amount, read type, late fee' } };
export const DEMO = { title: 'Nectarine of Utilities', files: { bills: 'bills.csv', settings: 'settings.json' }, explain: { arg: 'bill', value: 'EL-4410 2026-10-01' }, draft: {} };

export const manifest = tableAgent({
  pkg, prefix: 'nectarine',
  description: 'Electric, gas and water bills per account and location: usage per day and price per unit against the account\'s own other bills, estimated meter reads, bills charged twice, overlapping periods and late fees. Writes a worklist and a memo draft for whoever deals with the utilities. Never pays a bill or contacts the utility.',
  check: { title: 'Utility bills', description: 'For every bill: usage per day and price per unit against the median of the account\'s other bills; flags usage spikes and bills charged twice, and lists rate jumps, repeated estimated reads, overlapping periods and late fees.' },
  args: files, required: ['bills'],
  sources: { bills: { label: 'Utility bills', args: ['bills'], fields: BILL_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    spike_pct: { type: 'number', minimum: 0, description: 'Usage per day this % over the account\'s median is a spike (default 25)' },
    rate_jump_pct: { type: 'number', minimum: 0, description: 'Price per unit this % over the median is a rate jump (default 15)' },
    min_history: { type: 'integer', minimum: 1, description: 'Other bills needed before comparing (default 2)' },
  } } },
  run: ({ rows, settings }) => utilities(rows, settings),
  key: { arg: 'bill', field: 'bill', label: 'bill (account and period start, e.g. "EL-4410 2026-10-01")' },
  summary: (o) => `${o.totals.bills} bill(s) on ${o.totals.accounts} account(s), ${money(o.totals.billed)} billed. ${o.totals.flagged_bills} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Utility bills', base: 'nectarine-utilities',
    row: (i) => ({ account: i.account ?? '', utility: i.utility ?? '', location: i.location ?? '', period_start: i.period_start ?? '', period_end: i.period_end ?? '', usage: i.usage ?? '', unit: i.unit ?? '', usage_per_day: i.usage_per_day ?? '', rate: i.rate ?? '', amount: i.amount ?? '' }),
    htmlColumns: ['account', 'utility', 'period_start', 'usage_per_day', 'rate', 'amount'],
    sections: (o) => [{ title: 'By account', rows: [...new Set(o.items.map((i) => i.account))].sort().map((a) => ({ account: a, count: o.items.filter((i) => i.account === a).length, amount: Math.round(o.items.filter((i) => i.account === a).reduce((t2, i) => t2 + i.amount, 0) * 100) / 100 })), columns: ['account', 'count', 'amount'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the owner',
    description: 'Write drafts/memo-utilities.md: bills to question with the utility (duplicates, estimated reads, rate jumps, late fees) and spikes to check on site. Marked DRAFT; nothing is sent to the utility.',
    args: { to: { type: 'string', description: 'Facilities or bookkeeper' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: 'utilities', to: a.to, text: letter({ title: 'Utility bills to check', to: a.to, from: a.from, re: 'Spikes, duplicates and charges to question',
      intro: `${o.totals.bills} bills, ${money(o.totals.billed)} in total. These need a call to the utility or a look on site:`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ account: i.account, period: `${i.period_start} to ${i.period_end}`, amount: money(i.amount), issue: i.findings.map((f) => f.code).join(' ') })), columns: ['account', 'period', 'amount', 'issue'],
      closing: ['Account numbers and utility contacts: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pay, REFUSE.email, REFUSE.ledger],
  memory: null,
});
