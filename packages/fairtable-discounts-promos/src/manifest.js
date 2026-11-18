import { readFileSync } from 'node:fs';
import { tableAgent, CHECK_LINE_FIELDS, CHECK_LINE_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { discounts, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const PROMO_FIELDS = {
  name: t(['Name', 'Promotion', 'Discount', 'Promo Name', 'Discount Name'], { required: true }),
  start: t(['Start', 'Start Date', 'Valid From', 'From'], { type: 'date' }),
  end: t(['End', 'End Date', 'Valid To', 'To'], { type: 'date' }),
  max_pct: t(['Max %', 'Max Pct', 'Percent', 'Discount %'], { type: 'number' }),
  max_amount: t(['Max Amount', 'Cap', 'Limit', 'Max $'], { type: 'money' }),
  needs_approval: t(['Needs Approval', 'Manager Approval', 'Approval Required'], { type: 'bool' }),
  employee_only: t(['Employee Only', 'Staff Only', 'Employee Meal'], { type: 'bool' }),
  daily_allowance: t(['Daily Allowance', 'Allowance', 'Per Day Limit'], { type: 'money' }),
  days: t(['Days', 'Valid Days', 'Day of Week']),
  hours: t(['Hours', 'Time Window', 'Valid Hours']),
};
const files = {
  discounts: { type: 'string', description: 'POS discount export under --root: check, date, time, employee, approver, discount name, amount, check total' },
  promos: { type: 'string', description: 'Your promotion list: name, start, end, max %, max amount, needs approval, employee only, daily allowance, days, hours' },
};
export const DEMO = { title: 'Fairtable Discounts Promos', files: { discounts: 'discounts.csv', promos: 'promos.csv', settings: 'settings.json' }, explain: { arg: 'discount', value: 'Fall Prix Fixe' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'discounts',
  description: 'Checks every discount and promotion rung in the POS against your own promotion list: used after it ended or outside its days and hours, over its cap, missing a manager approval, employee meals over the allowance, and discounts that are not on the list. Writes a worklist and a memo draft. Never changes the POS.',
  check: { title: 'Discounts and promotions', description: 'Group the POS discounts by name and check each use against the promotion list: dates, days, hours, the % and amount cap, approval and the employee meal allowance. Flags anything outside the rules and lists discounts the list does not know.' },
  args: files, required: ['discounts', 'promos'],
  sources: {
    discounts: { label: 'POS discounts', args: ['discounts'], fields: CHECK_LINE_FIELDS, profiles: CHECK_LINE_PROFILES },
    promos: { label: 'Promotion list', args: ['promos'], fields: PROMO_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    tolerance: { type: 'number', minimum: 0, description: 'Amount over a cap that is ignored (default 0.50)' },
    open_words: { type: 'array', items: { type: 'string' }, description: 'Words that mark an open (free-amount) discount' },
  } } },
  run: ({ rows, settings }) => discounts(rows, settings),
  key: { arg: 'discount', field: 'discount', label: 'discount' },
  summary: (o) => `${o.totals.uses} discount(s) worth ${money(o.totals.discount_amount)} under ${o.totals.discounts} name(s); ${o.totals.not_on_list} name(s) not on the promotion list. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Discounts and promotions', base: 'discounts-promos',
    row: (i) => ({ discount: i.discount ?? '', uses: i.uses ?? '', amount: i.amount ?? '', on_promo_list: i.on_promo_list === undefined ? '' : i.on_promo_list ? 'yes' : 'no', window: i.window ?? '' }),
    htmlColumns: ['discount', 'uses', 'amount', 'on_promo_list', 'window'],
    sections: (o) => [{ title: 'By promotion', rows: o.items.map((i) => ({ discount: i.discount, count: i.uses, amount: i.amount })), columns: ['discount', 'count', 'amount'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/memo-<location>.md: the discount rules that were broken, the buttons to remove or restrict, for the floor team. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Floor manager or team' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, amount: o.totals.discount_amount, text: letter({ title: `Discounts and promotions${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Discount rules and POS buttons',
      intro: 'These discounts were used outside their rules or are not on our promotion list:',
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ discount: i.discount, uses: i.uses, amount: money(i.amount), issue: i.findings.map((f) => f.code).join(' ') })), columns: ['discount', 'uses', 'amount', 'issue'],
      closing: ['Buttons to remove or lock in the POS (a manager does this): [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.refund, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another POS name for a promotion on the list, e.g. {"name": "HH 1/2 APPS", "means": "Happy Hour Half Off Apps"}.', effect: 'reads that POS discount name as the promotion, so its rules apply', fields: { discounts: ['item'] } },
});
