import { readFileSync } from 'node:fs';
import { tableAgent, ITEM_SALES_FIELDS, ITEM_SALES_PROFILES, REFUSE, letter, money, pctText } from 'fairtable-core';
import { wasteLog, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const WASTE_FIELDS = {
  date: t(['Date', 'Waste Date', 'Business Date', 'Logged'], { type: 'date' }),
  location: t(['Location', 'Store', 'Restaurant']),
  item: t(['Item', 'Product', 'Ingredient', 'Menu Item', 'Description'], { required: true }),
  qty: t(['Qty', 'Quantity', 'Amount Wasted', 'Wasted'], { type: 'number' }),
  unit: t(['Unit', 'UOM', 'UofM']),
  unit_cost: t(['Unit Cost', 'Cost', 'Cost per Unit'], { type: 'money' }),
  value: t(['Value', 'Waste Value', 'Total Cost', 'Cost Total'], { type: 'money' }),
  reason: t(['Reason', 'Waste Reason', 'Why', 'Cause']),
  employee: t(['Employee', 'Logged By', 'Staff', 'Recorded By'], { personal: true }),
  shift: t(['Shift', 'Daypart', 'Period']),
};
const files = {
  waste: { type: 'string', description: 'Waste log under --root: date, item, quantity, unit, unit cost or value, reason, who logged it' },
  sales: { type: 'string', description: 'Optional POS sales with a date and net sales (item sales or a daily summary) to put waste against sales and find days with no log' },
};
export const DEMO = { title: 'Fairtable Waste Log', files: { waste: 'waste.csv', sales: 'sales.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Chicken Breast' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'waste',
  description: 'Reads the waste log against daily sales, prices what was thrown out and shows the items, repeated reasons and days behind it, including days with sales and nothing logged. Writes a worklist and a memo draft for the kitchen. Never changes the POS or the prep list.',
  check: { title: 'Waste log', description: 'Price every waste entry (value, or quantity x unit cost), add it up by item and reason, compare it with net sales, and list days with sales and no waste entry. Flags high-waste items, waste over target, reasons that repeat, entries with no cost and entries with no reason.' },
  args: files, required: ['waste'],
  sources: {
    waste: { label: 'Waste log', args: ['waste'], fields: WASTE_FIELDS },
    sales: { label: 'POS sales', args: ['sales'], fields: ITEM_SALES_FIELDS, profiles: ITEM_SALES_PROFILES },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    flag_amount: { type: 'number', minimum: 0, description: 'Flag an item with at least this much waste in the period (default 40)' },
    watch_amount: { type: 'number', minimum: 0, description: 'Watch an item with at least this much waste (default 15)' },
    repeat_count: { type: 'integer', minimum: 2, description: 'Times the same reason for one item counts as a pattern (default 3)' },
    target_waste_pct: { type: 'number', minimum: 0, description: 'Waste target as % of net sales (default 1.5)' },
  } } },
  run: ({ rows, settings }) => wasteLog(rows, settings),
  key: { arg: 'item', field: 'item', label: 'wasted item or day' },
  summary: (o) => `Waste logged ${money(o.totals.waste_value)}${o.totals.net_sales ? ` = ${pctText(o.totals.waste_pct_of_sales)} of net sales ${money(o.totals.net_sales)}` : ''}; ${o.totals.days_logged} day(s) logged of ${o.totals.days_with_sales} with sales. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Waste log', base: 'waste-log',
    row: (i) => ({ item: i.item ?? '', kind: i.sub ?? '', qty: i.qty ?? '', unit: i.unit ?? '', value: i.value ?? '', entries: i.entries ?? '', top_reason: i.top_reason ?? '' }),
    htmlColumns: ['item', 'qty', 'unit', 'value', 'entries', 'top_reason'],
    sections: (o) => { const m = new Map(); for (const i of o.items) if (i.top_reason) m.set(i.top_reason, (m.get(i.top_reason) || 0) + 1); return [{ title: 'By reason', rows: [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([reason, count]) => ({ reason, count })), columns: ['reason', 'count'] }]; },
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager',
    description: 'Write drafts/memo-<location>.md: the week\'s waste for the kitchen, the items and reasons to fix at the source, and the days with no log. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Restaurant name' }, to: { type: 'string', description: 'Kitchen manager' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => ({ id: a.location || 'restaurant', to: a.to, amount: o.totals.waste_value, text: letter({ title: `Waste this period${a.location ? `: ${a.location}` : ''}`, to: a.to, from: a.from, re: 'What we threw out and why',
      intro: `We logged ${money(o.totals.waste_value)} of waste${o.totals.net_sales ? `, ${pctText(o.totals.waste_pct_of_sales)} of net sales` : ''}. The items and reasons to fix first:`,
      rows: o.items.filter((i) => i.status !== 'ok').map((i) => ({ item: i.item, value: money(i.value), reason: i.top_reason || '-', note: i.findings.map((f) => f.code).join(' ') })), columns: ['item', 'value', 'reason', 'note'],
      closing: ['Please log every waste entry with its reason, including on quiet days. Prep par changes agreed: [TO CONFIRM]'] }) }),
  },
  refused: [REFUSE.pos, REFUSE.order, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name the waste log uses for an item, e.g. {"name": "chix", "means": "Chicken Breast"}.', effect: 'reads that name as the item, so its entries are added together', fields: { waste: ['item'] } },
});
