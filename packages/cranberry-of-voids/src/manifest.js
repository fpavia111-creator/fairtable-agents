import { readFileSync } from 'node:fs';
import { tableAgent, CHECK_LINE_FIELDS, CHECK_LINE_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { voids, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const SERVER_SALES_FIELDS = {
  employee: { aliases: ['Server', 'Employee', 'Staff', 'Team Member', 'Name'], required: true, personal: true },
  location: { aliases: ['Location', 'Store', 'Restaurant'] },
  net_sales: { aliases: ['Net Sales', 'Sales', 'Net Amount', 'Total Sales'], type: 'money' },
};
const files = {
  checks: { type: 'string', description: 'POS void and comp export under --root: check, date, time, employee, approver, type (void or comp), item, amount, reason, check total, time the check was closed' },
  server_sales: { type: 'string', description: 'Optional sales by employee (server sales report) to put voids and comps against sales' },
};
export const DEMO = { title: 'Cranberry of Voids', files: { checks: 'checks.csv', server_sales: 'server_sales.csv', settings: 'settings.json' }, explain: { arg: 'employee', value: 'Avery Stone' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'cranberry',
  description: 'Voids and comps by employee against their sales: self-approved voids, voids after the check was paid, missing reasons, comps over the approval limit without a manager, whole checks voided. Staff names are masked for the AI model. Writes a worklist and a manager review memo draft. Never changes the POS.',
  check: { title: 'Voids and comps by employee', description: 'Add up each employee\'s voids and comps, put them against their sales, and flag self-approved voids, voids after the check closed, a void-and-comp rate over the threshold, voids with no reason, items over the approval limit with no approver and whole checks voided.' },
  args: files, required: ['checks'],
  sources: {
    checks: { label: 'POS voids and comps', args: ['checks'], fields: CHECK_LINE_FIELDS, profiles: CHECK_LINE_PROFILES },
    server_sales: { label: 'Sales by employee', args: ['server_sales'], fields: SERVER_SALES_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    flag_rate_pct: { type: 'number', minimum: 0, description: 'Flag voids + comps at this % of an employee\'s sales (default 3)' },
    watch_rate_pct: { type: 'number', minimum: 0, description: 'Watch from this % (default 1.5)' },
    approval_limit: { type: 'number', minimum: 0, description: 'Voids or comps above this amount need a manager approval (default 20)' },
    full_check_pct: { type: 'number', minimum: 0, maximum: 100, description: 'A void of at least this % of a check counts as a whole-check void (default 90)' },
  } } },
  run: ({ rows, settings }) => voids(rows, settings),
  key: { arg: 'employee', field: 'employee', label: 'employee', person: true },
  summary: (o) => `${o.totals.void_count} void(s) worth ${money(o.totals.void_amount)} and ${o.totals.comp_count} comp(s) worth ${money(o.totals.comp_amount)} across ${o.totals.employees} employee(s). ${o.items.filter((i) => i.status === 'flag').length} employee(s) flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Voids and comps by employee', base: 'cranberry-voids',
    row: (i) => ({ employee: i.employee ?? '', voids: i.voids ?? '', void_amount: i.void_amount ?? '', comps: i.comps ?? '', comp_amount: i.comp_amount ?? '', net_sales: i.net_sales ?? '', void_comp_pct: i.void_comp_pct ?? '' }),
    htmlColumns: ['employee', 'voids', 'void_amount', 'comps', 'comp_amount', 'void_comp_pct'],
    sections: () => [],
  },
  draft: {
    noun: 'review_memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/review_memo-<location>.md: the employees and checks to review with the floor manager, with what each finding means. Marked DRAFT; it is a list of questions, not a conclusion about anyone.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Floor or general manager' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, text: letter({ title: `Voids and comps to review${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Checks to look at together',
      intro: 'The POS export shows the following. Each line is a question to check against the camera, the ticket and the employee\'s account, not a finding against anyone.',
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ employee: i.employee, voids: money(i.void_amount), comps: money(i.comp_amount), of_sales: i.void_comp_pct === null ? 'n/a' : `${i.void_comp_pct}%`, look_at: i.findings.map((f) => f.code).join(' ') })), columns: ['employee', 'voids', 'comps', 'of_sales', 'look_at'],
      closing: ['Manager approval rules reminded to the team on: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.payroll, REFUSE.email],
  memory: null,
});
