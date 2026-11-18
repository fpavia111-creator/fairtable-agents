import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, money } from 'fairtable-core';
import { drawers, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const DRAWER_FIELDS = {
  date: t(['Date', 'Business Date', 'Shift Date'], { type: 'date', required: true }),
  location: t(['Location', 'Store', 'Restaurant']),
  drawer: t(['Drawer', 'Cash Drawer', 'Register', 'Till', 'Terminal'], { required: true }),
  employee: t(['Employee', 'Cashier', 'Bartender', 'Closed By', 'Drawer Owner'], { personal: true }),
  starting_bank: t(['Starting Bank', 'Opening Bank', 'Start Cash', 'Float', 'Opening Float'], { type: 'money' }),
  cash_sales: t(['Cash Sales', 'Cash Collected', 'Cash Payments', 'Cash'], { type: 'money' }),
  paid_outs: t(['Paid Outs', 'Paid Out', 'Payouts', 'Cash Out'], { type: 'money' }),
  paid_out_receipts: t(['Paid Out Receipts', 'Receipts', 'Receipt Count'], { type: 'number' }),
  cash_tips_paid: t(['Cash Tips Paid', 'Tips Paid Out', 'Tip Payout', 'Card Tips Paid in Cash'], { type: 'money' }),
  counted: t(['Counted', 'Actual Cash', 'Cash Counted', 'Closing Count', 'Ending Cash'], { type: 'money' }),
  deposit: t(['Deposit', 'Bank Deposit', 'Deposit Amount'], { type: 'money' }),
  next_bank: t(['Next Bank', 'Bank Left', 'Ending Bank', 'Float Left'], { type: 'money' }),
};
const files = { drawers: { type: 'string', description: 'POS cash-out or drawer report under --root: date, drawer, employee, starting bank, cash sales, paid-outs, receipts, cash tips paid out, counted cash, deposit, bank left' } };
export const DEMO = { title: 'Elderberry of Drawers', files: { drawers: 'drawers.csv', settings: 'settings.json' }, explain: { arg: 'drawer_day', value: 'Front 1 2026-11-04' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'elderberry',
  description: 'Cash over and short for every drawer and shift: expected cash from starting bank, cash sales, paid-outs and cash tips paid out, against the count and the deposit, with repeated shorts per person (names masked for the AI model). Writes a worklist and a memo draft. Never moves cash or changes the POS.',
  check: { title: 'Cash over and short by drawer', description: 'For each drawer and day: expected cash, counted cash and the difference; the deposit plus the next bank against the count. Flags shorts, deposits that do not match, people short again and again, overs, paid-outs with no receipt and drawers never counted.' },
  args: files, required: ['drawers'],
  sources: { drawers: { label: 'Drawer cash-outs', args: ['drawers'], fields: DRAWER_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    flag_short: { type: 'number', minimum: 0, description: 'Flag a drawer short by at least this much (default 5)' },
    watch_amount: { type: 'number', minimum: 0, description: 'Watch a difference of at least this much (default 1)' },
    review_over: { type: 'number', minimum: 0, description: 'Review a drawer over by at least this much (default 5)' },
    repeat_shorts: { type: 'integer', minimum: 2, description: 'Shorts by the same person that count as a pattern (default 3)' },
  } } },
  run: ({ rows, settings }) => drawers(rows, settings),
  key: { arg: 'drawer_day', field: 'drawer_day', label: 'drawer and day (e.g. "Bar 1 2026-11-03")' },
  summary: (o) => `${o.totals.drawer_days} drawer-day(s), cash sales ${money(o.totals.cash_sales)}: net ${o.totals.net_over_short >= 0 ? 'over' : 'short'} ${money(Math.abs(o.totals.net_over_short))}, shorts ${money(o.totals.total_short)}. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Cash over and short by drawer', base: 'elderberry-drawers',
    row: (i) => ({ date: i.date ?? '', drawer: i.drawer ?? '', employee: i.employee ?? '', expected: i.expected ?? '', counted: i.counted ?? '', over_short: i.over_short ?? '', deposit: i.deposit ?? '' }),
    htmlColumns: ['date', 'drawer', 'employee', 'expected', 'counted', 'over_short'],
    sections: (o) => [{ title: 'By drawer', rows: [...new Set(o.items.map((i) => i.drawer))].sort().map((d) => ({ drawer: d, count: o.items.filter((i) => i.drawer === d).length, amount: Math.round(o.items.filter((i) => i.drawer === d).reduce((t, i) => t + (i.over_short || 0), 0) * 100) / 100 })), columns: ['drawer', 'count', 'amount'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/memo-<location>.md: the drawers and deposits to check with the closing managers, as questions. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Closing managers or bookkeeper' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, amount: o.totals.total_short, text: letter({ title: `Cash drawers to check${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Over/short and deposits',
      intro: 'Please check these drawers and deposits against the cash-out sheets and the safe log:',
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ day: i.date, drawer: i.drawer, closed_by: i.employee, expected: money(i.expected), counted: i.counted === null ? '(not counted)' : money(i.counted), difference: i.over_short ?? '', issue: i.findings.map((f) => f.code).join(' ') })), columns: ['day', 'drawer', 'closed_by', 'expected', 'counted', 'difference', 'issue'],
      closing: ['Deposit slips checked against the bank: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pay, REFUSE.payroll, REFUSE.email],
  memory: null,
});
