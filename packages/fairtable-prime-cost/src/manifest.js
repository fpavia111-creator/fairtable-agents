import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, money, pctText } from 'fairtable-core';
import { primeCost, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const WEEK_FIELDS = {
  week: t(['Week', 'Week Starting', 'Week Of', 'Period', 'Date'], { type: 'date', required: true }),
  location: t(['Location', 'Store', 'Restaurant', 'Unit']),
  net_sales: t(['Net Sales', 'Sales', 'Revenue'], { type: 'money' }),
  food_cost: t(['Food Cost', 'Food COGS', 'Food Purchases', 'COGS Food'], { type: 'money' }),
  beverage_cost: t(['Beverage Cost', 'Bev Cost', 'Liquor Cost', 'COGS Beverage'], { type: 'money' }),
  labor_cost: t(['Labor Cost', 'Wages', 'Payroll', 'Gross Wages'], { type: 'money' }),
  labor_burden: t(['Labor Burden', 'Payroll Taxes', 'Taxes and Benefits', 'Benefits'], { type: 'money' }),
};
const files = { weeks: { type: 'string', description: 'Weekly numbers per location under --root (from R365, MarginEdge or your P&L): week, location, net sales, food cost, beverage cost, labor, payroll taxes and benefits' } };
export const DEMO = { title: 'Fairtable Prime Cost', files: { weeks: 'weeks.csv', settings: 'settings.json' }, explain: { arg: 'line', value: 'Main Street 2026-11-02' }, draft: {} };

export const manifest = tableAgent({
  pkg, prefix: 'prime_cost',
  description: 'Weekly prime cost (food and beverage cost plus labor with taxes and benefits) as a share of sales for each location, against your targets, with weeks missing a number and prime cost that keeps rising. Writes a worklist and a weekly memo draft. Never posts to the books.',
  check: { title: 'Prime cost', description: 'Work out prime cost and its share of net sales for every location and week, and the food-and-beverage and labor shares; flag weeks over the prime cost target, watch the parts over their targets and prime cost rising week after week, and list weeks with a missing number.' },
  args: files, required: ['weeks'],
  sources: { weeks: { label: 'Weekly numbers', args: ['weeks'], fields: WEEK_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    target_prime_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Prime cost target % (default 62)' },
    target_cogs_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Food and beverage cost target % (default 33)' },
    target_labor_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Labor target % with taxes and benefits (default 30)' },
    flag_points: { type: 'number', minimum: 0, description: 'Flag prime cost this many points over target (default 2)' },
    trend_weeks: { type: 'integer', minimum: 2, description: 'Weeks of rising prime cost that count as a trend (default 3)' },
  } } },
  run: ({ rows, settings }) => primeCost(rows, settings),
  key: { arg: 'line', field: 'line', label: 'location and week (e.g. "Main Street 2026-11-02")' },
  summary: (o) => `${o.totals.location_weeks} location-week(s): prime cost ${money(o.totals.prime_cost)} on sales ${money(o.totals.net_sales)} (${pctText(o.totals.prime_pct)}; target ${o.extra.target_prime_pct}%). ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Prime cost', base: 'prime-cost',
    row: (i) => ({ location: i.location ?? '', week: i.week ?? '', net_sales: i.net_sales ?? '', cogs: i.cogs ?? '', labor: i.labor ?? '', prime_cost: i.prime_cost ?? '', prime_pct: i.prime_pct ?? '', cogs_pct: i.cogs_pct ?? '', labor_pct: i.labor_pct ?? '' }),
    htmlColumns: ['location', 'week', 'net_sales', 'prime_cost', 'prime_pct', 'cogs_pct', 'labor_pct'],
    sections: (o) => [{ title: 'By location', rows: [...new Set(o.items.map((i) => i.location))].sort().map((l) => { const x = o.items.filter((i) => i.location === l && i.prime_pct !== null); const sales = x.reduce((t2, i) => t2 + i.net_sales, 0), p = x.reduce((t2, i) => t2 + i.prime_cost, 0); return { location: l, net_sales: Math.round(sales * 100) / 100, prime_pct: sales ? Math.round((p / sales) * 1000) / 10 : '' }; }), columns: ['location', 'net_sales', 'prime_pct'] }],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the owner',
    description: 'Write drafts/memo-prime-cost.md: prime cost by location and week with the weeks over target, for the managers. Marked DRAFT.',
    args: { to: { type: 'string', description: 'Location managers' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: 'prime-cost', to: a.to, text: letter({ title: 'Prime cost by location', to: a.to, from: a.from, re: `Target ${o.extra.target_prime_pct}% of sales`,
      intro: `Prime cost was ${pctText(o.totals.prime_pct)} of sales across the weeks in the file.`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ location: i.location, week: i.week, prime: i.prime_pct === null ? 'n/a' : `${i.prime_pct}%`, cogs: i.cogs_pct === null ? '' : `${i.cogs_pct}%`, labor: i.labor_pct === null ? '' : `${i.labor_pct}%`, note: i.findings.map((f) => f.code).join(' ') })), columns: ['location', 'week', 'prime', 'cogs', 'labor', 'note'],
      closing: ['Actions agreed per location: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.ledger, REFUSE.payroll, REFUSE.email],
  memory: null,
});
