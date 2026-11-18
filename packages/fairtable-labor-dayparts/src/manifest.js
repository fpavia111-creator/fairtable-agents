import { readFileSync } from 'node:fs';
import { tableAgent, ITEM_SALES_FIELDS, ITEM_SALES_PROFILES, PUNCH_FIELDS, PUNCH_PROFILES, REFUSE, letter, money, pctText } from 'fairtable-core';
import { dayparts, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  sales: { type: 'string', description: 'POS sales with a date and a time (item sales or checks) under --root' },
  timecards: { type: 'string', description: 'Timecards for the same days: employee, clock in, clock out, unpaid break minutes, hourly rate' },
};
export const DEMO = { title: 'Fairtable Labor Dayparts', files: { sales: 'sales.csv', timecards: 'timecards.csv', settings: 'settings.json' }, explain: { arg: 'slot', value: '2026-11-03 Afternoon' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'dayparts',
  description: 'Labor percentage and sales per labor hour for each daypart, from POS sales with times and timecards spread over the dayparts they cover, against the target you set for each daypart. Writes a worklist and a staffing memo draft. Never edits the schedule.',
  check: { title: 'Labor percentage by daypart', description: 'Spread each timecard over the dayparts it covers in 15-minute steps, price it at the rate plus labor burden, put it against the sales rung in the same daypart and flag dayparts over their labor target, low sales per labor hour, labor with no sales and sales with no time.' },
  args: files, required: ['sales', 'timecards'],
  sources: {
    sales: { label: 'POS sales with time', args: ['sales'], fields: ITEM_SALES_FIELDS, profiles: ITEM_SALES_PROFILES },
    timecards: { label: 'Timecards', args: ['timecards'], fields: PUNCH_FIELDS, profiles: PUNCH_PROFILES },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    dayparts: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'start', 'end'], properties: { name: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' }, target_labor_pct: { type: 'number' } } }, description: 'Dayparts with start and end times (HH:MM) and a labor % target each' },
    flag_points: { type: 'number', minimum: 0, description: 'Flag a daypart this many points over its target (default 3)' },
    min_sales_per_labor_hour: { type: 'number', minimum: 0, description: 'Watch a daypart under this many sales per labor hour (default 60)' },
    labor_burden_pct: { type: 'number', minimum: 0, description: 'Payroll taxes and benefits added to wages, % (default 0)' },
  } } },
  run: ({ rows, settings }) => dayparts(rows, settings),
  key: { arg: 'slot', field: 'slot', label: 'day and daypart (e.g. "2026-11-03 Lunch")' },
  summary: (o) => `${o.totals.slots} daypart slot(s): sales ${money(o.totals.net_sales)}, labor ${money(o.totals.labor_cost)} (${pctText(o.totals.labor_pct)}) over ${o.totals.labor_hours} hours. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Labor percentage by daypart', base: 'labor-dayparts',
    row: (i) => ({ date: i.date ?? '', daypart: i.daypart ?? '', net_sales: i.net_sales ?? '', labor_hours: i.labor_hours ?? '', labor_cost: i.labor_cost ?? '', labor_pct: i.labor_pct ?? '', target_pct: i.target_pct ?? '', sales_per_labor_hour: i.sales_per_labor_hour ?? '', people: i.people ?? '' }),
    htmlColumns: ['date', 'daypart', 'net_sales', 'labor_cost', 'labor_pct', 'target_pct', 'sales_per_labor_hour'],
    sections: (o) => [{ title: 'By daypart', rows: [...new Set(o.items.map((i) => i.daypart).filter(Boolean))].sort().map((d) => { const l = o.items.filter((i) => i.daypart === d); const sales = l.reduce((t, i) => t + i.net_sales, 0), cost = l.reduce((t, i) => t + i.labor_cost, 0); return { daypart: d, net_sales: Math.round(sales * 100) / 100, labor_pct: sales ? Math.round((cost / sales) * 1000) / 10 : '' }; }), columns: ['daypart', 'net_sales', 'labor_pct'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/memo-<location>.md: the dayparts over target with their labor %, for the person who writes the schedule. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Scheduler' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, text: letter({ title: `Labor by daypart${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'Dayparts over their labor target',
      intro: `Labor was ${pctText(o.totals.labor_pct)} of sales overall. These dayparts need a look when the next schedule is written:`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ slot: i.slot, sales: money(i.net_sales), labor: money(i.labor_cost), labor_pct: i.labor_pct === null ? 'n/a' : `${i.labor_pct}%`, target: i.target_pct === null ? '' : `${i.target_pct}%`, people: i.people })), columns: ['slot', 'sales', 'labor', 'labor_pct', 'target', 'people'],
      closing: ['Schedule changes agreed: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.schedule, REFUSE.payroll, REFUSE.email],
  memory: null,
});
