import { readFileSync } from 'node:fs';
import { tableAgent, PUNCH_FIELDS, PUNCH_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { breaks, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const BREAK_FIELDS = { ...PUNCH_FIELDS, break_start: { aliases: ['Break Start', 'Meal Start', 'Break In', 'Lunch Start'], type: 'datetime' } };
const files = { timecards: { type: 'string', description: 'Timecards under --root (Toast, Square, 7shifts or Homebase export): employee, clock in, clock out, break start, unpaid break minutes, hourly rate, age (for minors)' } };
export const DEMO = { title: 'Raspberry of Breaks', files: { timecards: 'timecards.csv', settings: 'settings.json' }, explain: { arg: 'employee', value: 'Taylor Brooks' }, draft: { week: 'Week of 2026-11-02' } };
const nOrNull = { type: ['number', 'null'] };

export const manifest = tableAgent({
  pkg, prefix: 'raspberry',
  description: 'Meal breaks from your timecards under the break rules in your settings: shifts over the limit with no or a short meal break, meals taken late, second meals on long days, the premium pay that may be owed, and minors working too many hours or too late. Staff names are masked for the AI model. Writes a worklist and a memo draft. Never edits timecards or runs payroll.',
  check: { title: 'Meal and rest breaks', description: 'For each shift: the meal break against the rules in the settings (after how many hours, how long, by which hour, a second meal on long days) with the premium they would mean, and for employees under 18 the hours and the latest clock-out allowed for their age band.' },
  args: files, required: ['timecards'],
  sources: { timecards: { label: 'Timecards', args: ['timecards'], fields: BREAK_FIELDS, profiles: PUNCH_PROFILES } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    rules: { type: 'string', description: 'Name of the rule set, shown in the report' },
    meal_after_hours: { type: 'number', minimum: 0, description: 'A meal break is due on shifts longer than this (default 5)' },
    meal_minutes: { type: 'number', minimum: 0, description: 'Minimum meal break in minutes (default 30)' },
    meal_start_by_hours: { type: 'number', minimum: 0, description: 'The meal must start by this hour of the shift (default 5)' },
    second_meal_after_hours: { ...nOrNull, description: 'A second meal is due on shifts longer than this (null for none)' },
    premium_hours: { type: 'number', minimum: 0, description: 'Hours of pay shown as the premium for a missed, short or late meal (0 to show none)' },
    minimum_wage: { type: 'number', minimum: 0, description: 'Used for the premium when the rate is lower (tipped staff)' },
    minor_max_daily_hours: { type: 'object', additionalProperties: { type: 'number' }, description: 'Most hours a day by age band: under_16, under_18' },
    minor_latest_end: { type: 'object', additionalProperties: { type: 'string' }, description: 'Latest clock-out (HH:MM) by age band: under_16, under_18' },
  } } },
  run: ({ rows, settings }) => breaks(rows, settings),
  key: { arg: 'employee', field: 'employee', label: 'employee', person: true },
  summary: (o) => `${o.totals.shifts} shift(s): ${o.totals.breaks_missed} with a missed or short meal, ${o.totals.minor_issues} with a minor's hours issue; premiums shown under the settings ${money(o.totals.premium_shown)} (rules: ${o.extra.rules}). ${o.items.filter((i) => i.status === 'flag').length} flagged.`,
  report: {
    title: 'Meal and rest breaks', base: 'raspberry-breaks',
    row: (i) => ({ employee: i.employee ?? '', shift: i.shift ?? '', hours: i.hours ?? '', break_minutes: i.break_minutes ?? '', age: i.age ?? '', premium: i.premium ?? '' }),
    htmlColumns: ['employee', 'shift', 'hours', 'break_minutes', 'premium'],
    sections: () => [],
    limits: ['Reads only the timecards you give it; it changes nothing in the timekeeping or payroll system.', 'Break and minor rules are settings; they differ by state and city and change. An employment lawyer or payroll professional confirms them before any premium is paid or withheld.', 'Not legal or payroll advice.'],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager', required: ['timecards', 'week'],
    description: 'Write drafts/memo-<week>.md: shifts with break or minor-hours issues and the premiums shown under the settings, for payroll and the scheduler. Marked DRAFT.',
    args: { week: { type: 'string', description: 'Label for the memo' }, to: { type: 'string', description: 'Payroll and scheduler' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.week, to: a.to, amount: o.totals.premium_shown, text: letter({ title: `Breaks and minors: ${a.week}`, to: a.to, from: a.from, re: 'Shifts to check before payroll',
      intro: `Rules used: ${o.extra.rules}. Premiums shown total ${money(o.totals.premium_shown)}.`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ employee: i.employee, shift: i.shift, break: `${i.break_minutes ?? 0} min`, premium: money(i.premium), issue: i.findings.map((f) => f.code).join(' ') })), columns: ['employee', 'shift', 'break', 'premium', 'issue'],
      closing: ['Premiums confirmed with payroll by: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.payroll, REFUSE.schedule, REFUSE.email],
  memory: null,
});
