import { readFileSync } from 'node:fs';
import { tableAgent, PUNCH_FIELDS, PUNCH_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { tipPools, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { timecards: { type: 'string', description: 'Timecards or time entries under --root (Toast, Square, 7shifts or Homebase export): employee, role, clock in, hours, hourly rate, declared cash tips, card tips' } };
export const DEMO = { title: 'Fig of Tip Pools', files: { timecards: 'timecards.csv', settings: 'settings.json' }, explain: { arg: 'employee', value: 'Casey Moreno' }, draft: { week: 'Week of 2026-11-02' } };

export const manifest = tableAgent({
  pkg, prefix: 'fig',
  description: 'Splits each week\'s tip pool by hours and role points and checks the tip credit against the wage settings for your state: cash wage + pool share + cash tips against the minimum, managers who kept tips, cash wages under the tipped minimum, states with no tip credit, missing cash tip declarations. Staff names are masked for the AI model. Writes a worklist and a payroll memo draft. Never runs payroll or pays tips.',
  check: { title: 'Tip pool and tip credit', description: 'For each workweek: the pool (card tips of pool roles plus any tips a manager collected), each member\'s share by hours x role points, and the effective hourly pay (wages + share + cash tips) against the minimum wage in the settings. Flags tip credit shortfalls with the makeup amount, managers with tips, cash wages under the tipped minimum and tip credits where the state allows none.' },
  args: files, required: ['timecards'],
  sources: { timecards: { label: 'Timecards', args: ['timecards'], fields: PUNCH_FIELDS, profiles: PUNCH_PROFILES } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    state: { type: 'string', description: 'Name of the state or the rule set, shown in the report' },
    full_min_wage: { type: 'number', minimum: 0, description: 'Full minimum hourly wage for your location (default 7.25, the US federal figure; check your state and city)' },
    tipped_cash_wage: { type: 'number', minimum: 0, description: 'Lowest cash wage for tipped staff when a tip credit is taken (default 2.13, the US federal figure)' },
    tip_credit_allowed: { type: 'boolean', description: 'Whether your state allows a tip credit at all' },
    pool_roles: { type: 'array', items: { type: 'string' }, description: 'Roles that share the pool' },
    excluded_roles: { type: 'array', items: { type: 'string' }, description: 'Roles that may not keep tips (managers, supervisors, owners)' },
    role_points: { type: 'object', additionalProperties: { type: 'number' }, description: 'Points per role for the split, e.g. {"Busser": 0.6}; 1 when not listed' },
    include_cash_in_pool: { type: 'boolean', description: 'Whether declared cash tips go into the pool (default false)' },
  } } },
  run: ({ rows, settings }) => tipPools(rows, settings),
  key: { arg: 'employee', field: 'employee', label: 'employee', person: true },
  summary: (o) => `${o.totals.weeks} week(s), ${o.totals.employee_weeks} employee-week(s): tip pool ${money(o.totals.tip_pool)}, makeup owed under the settings ${money(o.totals.makeup_owed)} (rules: ${o.extra.state}). ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Tip pool and tip credit', base: 'fig-tip-pool',
    row: (i) => ({ week: i.week ?? '', employee: i.employee ?? '', role: i.role ?? '', hours: i.hours ?? '', rate: i.rate ?? '', card_tips: i.card_tips ?? '', cash_tips: i.cash_tips ?? '', pool_share: i.pool_share ?? '', effective_hourly: i.effective_hourly ?? '', makeup_owed: i.makeup_owed ?? '' }),
    htmlColumns: ['week', 'employee', 'role', 'hours', 'pool_share', 'effective_hourly', 'makeup_owed'],
    sections: (o) => [{ title: 'By week', rows: [...new Set(o.items.map((i) => i.week))].sort().map((w) => ({ week: w, count: o.items.filter((i) => i.week === w).length, amount: Math.round(o.items.filter((i) => i.week === w).reduce((t, i) => t + i.pool_share, 0) * 100) / 100 })), columns: ['week', 'count', 'amount'] }],
    limits: ['Reads only the timecards you give it. It does not log in to a POS, payroll or bank system.', 'Wage figures and pool rules are settings you supply; the defaults are the US federal figures. State and city rules differ and change; a payroll professional or employment lawyer should confirm them before payroll is run.', 'Not legal, tax or payroll advice. A person decides what to pay.'],
  },
  draft: {
    noun: 'payroll_memo', verb: 'send', actor: 'the owner', required: ['timecards', 'week'],
    description: 'Write drafts/payroll_memo-<week>.md: pool shares and makeup amounts for the payroll person to check and enter. Marked DRAFT; nothing is paid.',
    args: { week: { type: 'string', description: 'Label for the memo, e.g. "Week of 2026-11-02"' }, to: { type: 'string', description: 'Payroll person or provider contact' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.week, to: a.to, amount: o.totals.makeup_owed, text: letter({ title: `Tip pool and tip credit: ${a.week}`, to: a.to, from: a.from, re: 'Pool shares and makeup pay to check before payroll',
      intro: `Pool shares by hours and role points, and makeup pay where cash wage + tips fell under the minimum (rules: ${o.extra.state}).`,
      rows: o.items.map((i) => ({ week: i.week, employee: i.employee, role: i.role, hours: i.hours, pool_share: money(i.pool_share), makeup: money(i.makeup_owed), note: i.findings.map((f) => f.code).join(' ') })), columns: ['week', 'employee', 'role', 'hours', 'pool_share', 'makeup', 'note'],
      closing: ['Wage figures confirmed for our state and city by: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.payroll, REFUSE.pay, REFUSE.email],
  memory: null,
});
