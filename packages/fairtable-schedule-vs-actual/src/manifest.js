import { readFileSync } from 'node:fs';
import { tableAgent, SHIFT_FIELDS, SHIFT_PROFILES, PUNCH_FIELDS, PUNCH_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { schedules, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  schedule: { type: 'string', description: 'Published schedule under --root (7shifts, Homebase or POS export): employee, role, shift start, shift end' },
  timecards: { type: 'string', description: 'Timecards for the same weeks: employee, clock in, clock out, unpaid break minutes, hourly rate' },
};
export const DEMO = { title: 'Fairtable Schedule vs Actual', files: { schedule: 'schedule.csv', timecards: 'timecards.csv', settings: 'settings.json' }, explain: { arg: 'employee', value: 'Jordan Lee' }, draft: { week: 'Week of 2026-11-02' } };

export const manifest = tableAgent({
  pkg, prefix: 'schedule',
  description: 'Scheduled against actual labor: each punch matched to the shift scheduled that day; early clock-ins, late clock-outs and late arrivals in minutes, no-shows, shifts nobody scheduled, and hours over schedule priced at each person\'s rate. Staff names are masked for the AI model. Writes a worklist and a memo draft. Never edits the schedule or timecards.',
  check: { title: 'Scheduled against actual labor', description: 'Match timecards to the schedule by person and day; count minutes early and late; list no-shows and unscheduled shifts; flag weeks worked well over schedule with the cost of the extra hours.' },
  args: files, required: ['schedule', 'timecards'],
  sources: {
    schedule: { label: 'Schedule', args: ['schedule'], fields: SHIFT_FIELDS, profiles: SHIFT_PROFILES },
    timecards: { label: 'Timecards', args: ['timecards'], fields: PUNCH_FIELDS, profiles: PUNCH_PROFILES },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    early_minutes: { type: 'number', minimum: 0, description: 'Minutes before the shift that count as early (default 7)' },
    late_out_minutes: { type: 'number', minimum: 0, description: 'Minutes after the shift that count as a late clock-out (default 7)' },
    late_in_minutes: { type: 'number', minimum: 0, description: 'Minutes after the start that count as late (default 7)' },
    flag_extra_hours: { type: 'number', minimum: 0, description: 'Flag a week this many hours over schedule (default 2)' },
  } } },
  run: ({ rows, settings }) => schedules(rows, settings),
  key: { arg: 'employee', field: 'employee', label: 'employee', person: true },
  summary: (o) => `${o.totals.employee_weeks} employee-week(s): ${o.totals.actual_hours} hours worked against ${o.totals.scheduled_hours} scheduled (${o.totals.extra_hours >= 0 ? '+' : ''}${o.totals.extra_hours}), extra hours cost ${money(o.totals.extra_cost)}. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Scheduled against actual labor', base: 'schedule-vs-actual',
    row: (i) => ({ week: i.week ?? '', employee: i.employee ?? '', role: i.role ?? '', scheduled_shifts: i.scheduled_shifts ?? '', worked_shifts: i.worked_shifts ?? '', scheduled_hours: i.scheduled_hours ?? '', actual_hours: i.actual_hours ?? '', extra_hours: i.extra_hours ?? '', early_minutes: i.early_minutes ?? '', late_out_minutes: i.late_out_minutes ?? '' }),
    htmlColumns: ['week', 'employee', 'role', 'scheduled_hours', 'actual_hours', 'extra_hours'],
    sections: (o) => [{ title: 'By role', rows: [...new Set(o.items.map((i) => i.role))].sort().map((r) => ({ role: r, count: o.items.filter((i) => i.role === r).length, hours: Math.round(o.items.filter((i) => i.role === r).reduce((t, i) => t + i.extra_hours, 0) * 100) / 100 })), columns: ['role', 'count', 'hours'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager', required: ['schedule', 'timecards', 'week'],
    description: 'Write drafts/memo-<week>.md: punches outside the schedule and hours over schedule for the managers who approve timecards. Marked DRAFT.',
    args: { week: { type: 'string', description: 'Label for the memo' }, to: { type: 'string', description: 'Managers who approve timecards' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.week, to: a.to, amount: o.totals.extra_cost, text: letter({ title: `Schedule against actual: ${a.week}`, to: a.to, from: a.from, re: 'Punches outside the schedule',
      intro: `Hours worked ${o.totals.actual_hours} against ${o.totals.scheduled_hours} scheduled; extra hours cost ${money(o.totals.extra_cost)}.`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ employee: i.employee, scheduled: i.scheduled_hours, worked: i.actual_hours, extra: i.extra_hours, check: i.findings.map((f) => f.code).join(' ') })), columns: ['employee', 'scheduled', 'worked', 'extra', 'check'],
      closing: ['Early clock-in rule reminded to the team on: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.schedule, REFUSE.payroll, REFUSE.email],
  memory: null,
});
