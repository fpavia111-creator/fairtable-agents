import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, money } from 'fairtable-core';
import { salesTax, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const TAX_SALES_FIELDS = {
  date: t(['Date', 'Business Date', 'Order Date'], { type: 'date' }),
  location: t(['Location', 'Store', 'Restaurant', 'Revenue Center'], { required: true }),
  channel: t(['Channel', 'Dining Option', 'Order Type', 'Source', 'Service']),
  category: t(['Category', 'Sales Category', 'Tax Category', 'Menu Group']),
  item: t(['Item', 'Menu Item', 'Description']),
  net_sales: t(['Net Sales', 'Taxable Sales', 'Net Amount', 'Sales'], { type: 'money' }),
  tax: t(['Tax', 'Tax Collected', 'Sales Tax', 'Tax Amount'], { type: 'money' }),
  tax_exempt: t(['Tax Exempt', 'Exempt', 'Tax Exempt?'], { type: 'bool' }),
};
const files = { sales: { type: 'string', description: 'POS sales with tax under --root (sales summary or item sales): location, channel or dining option, category, net sales, tax collected, tax exempt' } };
export const DEMO = { title: 'Lemon of Sales Tax', files: { sales: 'sales.csv', settings: 'settings.json' }, explain: { arg: 'line', value: 'Main Street | Alcohol' }, draft: {} };

export const manifest = tableAgent({
  pkg, prefix: 'lemon',
  description: 'Tax collected in the POS against the rates you set per location and menu category, with delivery-marketplace orders kept apart: under- and over-collection by jurisdiction, marketplace orders taxed in the POS, tax-exempt sales to document, and locations with no rate. Writes a worklist and a memo draft for the bookkeeper. Never files a return or pays tax.',
  check: { title: 'Sales tax by jurisdiction', description: 'Group POS sales by location, category, marketplace and exemption; compare the tax collected with net sales x the rate in the settings; flag under-collection, list over-collection, marketplace orders with tax in the POS, exempt sales and locations with no rate.' },
  args: files, required: ['sales'],
  sources: { sales: { label: 'POS sales with tax', args: ['sales'], fields: TAX_SALES_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    locations: { type: 'object', additionalProperties: { type: 'object', additionalProperties: false, properties: { jurisdiction: { type: 'string' }, rate_pct: { type: 'number' }, category_rates: { type: 'object', additionalProperties: { type: 'number' } } } }, description: 'Per location: the jurisdiction name, its rate % and rates for categories that differ (alcohol, grocery). Rates come from your tax authority, not from this agent.' },
    marketplace_channels: { type: 'array', items: { type: 'string' }, description: 'Channels where the marketplace collects and remits the tax' },
    tolerance_pct: { type: 'number', minimum: 0, description: 'Difference allowed, % of the expected tax (default 0.5)' },
    tolerance_amount: { type: 'number', minimum: 0, description: 'Difference allowed in money (default 2)' },
  } } },
  run: ({ rows, settings }) => salesTax(rows, settings),
  key: { arg: 'line', field: 'line', label: 'location and category (e.g. "Main Street | Alcohol")' },
  summary: (o) => `${o.totals.lines} location/category line(s): net sales ${money(o.totals.net_sales)}, tax collected ${money(o.totals.tax_collected)} against ${money(o.totals.tax_expected)} expected; under ${money(o.totals.under_collected)}, over ${money(o.totals.over_collected)}. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Sales tax by jurisdiction', base: 'lemon-sales-tax',
    row: (i) => ({ location: i.location ?? '', jurisdiction: i.jurisdiction ?? '', category: i.category ?? '', channel: i.channel ?? '', net_sales: i.net_sales ?? '', tax_collected: i.tax_collected ?? '', rate_pct: i.rate_pct ?? '', tax_expected: i.tax_expected ?? '', difference: i.difference ?? '' }),
    htmlColumns: ['location', 'category', 'channel', 'net_sales', 'tax_collected', 'tax_expected', 'difference'],
    sections: (o) => [{ title: 'By jurisdiction', rows: [...new Set(o.items.map((i) => i.jurisdiction || i.location))].sort().map((j) => ({ jurisdiction: j, net_sales: Math.round(o.items.filter((i) => (i.jurisdiction || i.location) === j).reduce((t2, i) => t2 + i.net_sales, 0) * 100) / 100, tax: Math.round(o.items.filter((i) => (i.jurisdiction || i.location) === j).reduce((t2, i) => t2 + i.tax_collected, 0) * 100) / 100 })), columns: ['jurisdiction', 'net_sales', 'tax'] }],
    limits: ['Reads only the sales export you give it. It does not log in to a POS or a tax authority and files nothing.', 'Rates, category rules and marketplace treatment are settings you supply from your tax authority; they differ by city, county and state and change. Your accountant confirms them.', 'Not tax or legal advice. A person decides what to file and pay.'],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the owner',
    description: 'Write drafts/memo-sales-tax.md: the lines collected under or over the rates in the settings, the marketplace lines and exempt sales, for the bookkeeper before the return is prepared. Marked DRAFT; nothing is filed.',
    args: { to: { type: 'string', description: 'Bookkeeper or accountant' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: 'sales-tax', to: a.to, amount: o.totals.under_collected, text: letter({ title: 'Sales tax: lines to check before the return', to: a.to, from: a.from, re: 'Collected against the rates in our settings',
      intro: `Collected ${money(o.totals.tax_collected)} against ${money(o.totals.tax_expected)} expected at the rates in our settings.`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ line: i.line, net_sales: money(i.net_sales), collected: money(i.tax_collected), expected: i.tax_expected === null ? 'n/a' : money(i.tax_expected), issue: i.findings.map((f) => f.code).join(' ') })), columns: ['line', 'net_sales', 'collected', 'expected', 'issue'],
      closing: ['Rates confirmed with the tax authority on: [TO CONFIRM]', 'POS tax settings to correct (a manager does this): [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.tax, REFUSE.pos, REFUSE.email],
  memory: null,
});
