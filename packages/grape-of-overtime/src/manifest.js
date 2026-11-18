import { readFileSync } from 'node:fs';
import { tableAgent, PUNCH_FIELDS, PUNCH_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { overtime, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { timecards: { type: 'string', description: 'Timecards under --root (Toast, Square, 7shifts or Homebase export): employee, role, clock in, clock out, unpaid break minutes, hourly rate; one row per shift' } };
export const DEMO = { title: 'Grape of Overtime', files: { timecards: 'timecards.csv', settings: 'settings.json' }, explain: { arg: 'employee', value: 'Casey Morgan' }, draft: { week: 'Week of 2026-11-02' } };
const nOrNull = { type: ['number', 'null'] };

export const manifest = tableAgent({
  pkg, prefix: 'grape',
  description: 'Weekly and daily overtime, double time, split shifts, spread of hours and short turnarounds (clopens) from your timecards, priced at each person\'s rate under the overtime rules in your settings. Staff names are masked for the AI model. Writes a worklist and a memo draft for the scheduler. Never edits timecards or runs payroll.',
  check: { title: 'Overtime and split shifts', description: 'Per employee and workweek: hours, daily and weekly overtime and double time without counting an hour twice, the premium cost, and shifts that may carry a split-shift or spread-of-hours premium under the settings. Also flags clopens, very long shifts and shifts with no clock-out.' },
  args: files, required: ['timecards'],
  sources: { timecards: { label: 'Timecards', args: ['timecards'], fields: PUNCH_FIELDS, profiles: PUNCH_PROFILES } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    rules: { type: 'string', description: 'Name of the rule set, shown in the report' },
    weekly_ot_after: { type: 'number', minimum: 0, description: 'Weekly overtime after this many hours (default 40)' },
    daily_ot_after: { ...nOrNull, description: 'Daily overtime after this many hours (null when your state has none)' },
    daily_dt_after: { ...nOrNull, description: 'Double time after this many hours in a day (null when none)' },
    ot_multiplier: { type: 'number', minimum: 1, description: 'Overtime multiplier (default 1.5)' },
    split_gap_hours: { type: 'number', minimum: 0, description: 'An unpaid gap longer than this between two shifts on a day is a split shift (default 1)' },
    spread_hours: { ...nOrNull, description: 'Flag a day whose first-in to last-out spread is longer than this (null to skip)' },
    premium_hourly: { ...nOrNull, description: 'Hourly amount used for a one-hour split-shift or spread-of-hours premium (null to show without an amount)' },
    clopen_rest_hours: { type: 'number', minimum: 0, description: 'Rest between a closing and an opening shift shorter than this is a clopen (default 10)' },
    flag_ot_hours: { type: 'number', minimum: 0, description: 'Flag a week with at least this many overtime hours (default 5)' },
    long_shift_hours: { type: 'number', minimum: 0, description: 'Watch a single shift longer than this (default 12)' },
  } } },
  run: ({ rows, settings }) => overtime(rows, settings),
  key: { arg: 'employee', field: 'employee', label: 'employee', person: true },
  summary: (o) => `${o.totals.employee_weeks} employee-week(s): ${o.totals.overtime_hours} overtime hour(s), premium ${money(o.totals.premium_cost)}, ${o.totals.split_shifts} split shift(s) (rules: ${o.extra.rules}). ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Overtime and split shifts', base: 'grape-overtime',
    row: (i) => ({ week: i.week ?? '', employee: i.employee ?? '', role: i.role ?? '', shifts: i.shifts ?? '', hours: i.hours ?? '', regular_hours: i.regular_hours ?? '', overtime_hours: i.overtime_hours ?? '', double_time_hours: i.double_time_hours ?? '', rate: i.rate ?? '', premium_cost: i.premium_cost ?? '' }),
    htmlColumns: ['week', 'employee', 'role', 'hours', 'overtime_hours', 'premium_cost'],
    sections: (o) => [{ title: 'By role', rows: [...new Set(o.items.map((i) => i.role))].sort().map((r) => ({ role: r, count: o.items.filter((i) => i.role === r).length, hours: Math.round(o.items.filter((i) => i.role === r).reduce((t, i) => t + i.overtime_hours, 0) * 100) / 100 })), columns: ['role', 'count', 'hours'] }],
    limits: ['Reads only the timecards you give it. It does not log in to a POS, scheduling or payroll system.', 'Overtime and premium rules are settings you supply; state and city rules differ and change. A payroll professional or employment lawyer should confirm them before payroll is run.', 'Not legal or payroll advice. A person decides what to pay and how to schedule.'],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager', required: ['timecards', 'week'],
    description: 'Write drafts/memo-<week>.md: overtime and premiums for the scheduler and payroll, with the shifts behind them. Marked DRAFT.',
    args: { week: { type: 'string', description: 'Label for the memo, e.g. "Week of 2026-11-02"' }, to: { type: 'string', description: 'Scheduler or payroll contact' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.week, to: a.to, amount: o.totals.premium_cost, text: letter({ title: `Overtime and premiums: ${a.week}`, to: a.to, from: a.from, re: 'Overtime to plan around and premiums to check',
      intro: `Overtime premium this period: ${money(o.totals.premium_cost)} (rules: ${o.extra.rules}).`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ week: i.week, employee: i.employee, hours: i.hours, overtime: i.overtime_hours, premium: money(i.premium_cost), check: i.findings.map((f) => f.code).join(' ') })), columns: ['week', 'employee', 'hours', 'overtime', 'premium', 'check'],
      closing: ['Premiums confirmed with payroll by: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.payroll, REFUSE.schedule, REFUSE.email],
  memory: null,
});
