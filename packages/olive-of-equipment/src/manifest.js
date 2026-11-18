import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, nameKey } from 'fairtable-core';
import { equipment, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const EQUIPMENT_FIELDS = {
  equipment: t(['Equipment', 'Asset', 'Name', 'Item'], { required: true }),
  type: t(['Type', 'Service Type', 'Category', 'Asset Type']),
  location: t(['Location', 'Store', 'Restaurant']),
  last_service: t(['Last Service', 'Last Serviced', 'Last Cleaned', 'Last Inspection', 'Service Date'], { type: 'date' }),
  interval_days: t(['Interval Days', 'Interval', 'Every (days)', 'Frequency Days'], { type: 'number' }),
  vendor: t(['Vendor', 'Service Company', 'Contractor', 'Provider']),
};
const LOG_FIELDS = {
  equipment: t(['Equipment', 'Asset', 'Item'], { required: true }),
  date: t(['Date', 'Service Date', 'Visit Date'], { type: 'date' }),
  vendor: t(['Vendor', 'Technician', 'Company']),
  kind: t(['Kind', 'Type', 'Work Type', 'Visit Type']),
  cost: t(['Cost', 'Amount', 'Invoice Total'], { type: 'money' }),
};
const files = {
  equipment: { type: 'string', description: 'Equipment list under --root: equipment, type, location, last service date, interval in days, vendor' },
  service_log: { type: 'string', description: 'Optional service and repair log: equipment, date, vendor, kind (service or repair), cost' },
};
export const DEMO = { title: 'Olive of Equipment', files: { equipment: 'equipment.csv', service_log: 'service_log.csv', settings: 'settings.json' }, explain: { arg: 'equipment_name', value: 'Kitchen hood' }, draft: { vendor: 'Example Fire Protection' } };

export const manifest = tableAgent({
  pkg, prefix: 'olive',
  description: 'The maintenance schedule for hoods, grease traps, fire suppression, ice machines, refrigeration and the rest, as of a date: overdue, due in the next weeks, no service date, no interval, and equipment repaired again and again. Writes a worklist and a service request draft per vendor. Never books a vendor.',
  check: { title: 'Equipment maintenance schedule', description: 'Work out each piece of equipment\'s next due date from its last service (on the list or in the service log) and its interval (on the list, else the default for its type in the settings); flag overdue items, watch items due soon and repeated repairs, and list items with no date or no interval.' },
  args: files, required: ['equipment'],
  sources: {
    equipment: { label: 'Equipment list', args: ['equipment'], fields: EQUIPMENT_FIELDS },
    service_log: { label: 'Service log', args: ['service_log'], fields: LOG_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the schedule is checked for (default: today)' },
    due_soon_days: { type: 'integer', minimum: 0, description: 'Watch items due within this many days (default 30)' },
    repeat_repairs: { type: 'integer', minimum: 2, description: 'Repairs within the window that count as repeated (default 3)' },
    repair_window_days: { type: 'integer', minimum: 1, description: 'Window for counting repairs (default 120)' },
    default_intervals: { type: 'object', additionalProperties: { type: 'number' }, description: 'Service interval in days by equipment type, from your fire marshal, local code, insurer or manufacturer, e.g. {"Hood cleaning": 90}' },
  } } },
  run: ({ rows, settings }) => equipment(rows, settings),
  key: { arg: 'equipment_name', field: 'equipment', label: 'piece of equipment' },
  summary: (o) => `${o.totals.equipment} item(s) at ${o.extra.as_of}: ${o.totals.overdue} overdue, ${o.totals.due_soon} due soon. ${o.items.filter((i) => i.status === 'review').length} need a date or an interval.`,
  report: {
    title: 'Equipment maintenance schedule', base: 'olive-equipment',
    row: (i) => ({ equipment: i.equipment ?? '', type: i.type ?? '', location: i.location ?? '', vendor: i.vendor ?? '', last_service: i.last_service ?? '', interval_days: i.interval_days ?? '', due_date: i.due_date ?? '', days_left: i.days_left ?? '' }),
    htmlColumns: ['equipment', 'type', 'last_service', 'due_date', 'days_left', 'vendor'],
    sections: (o) => [{ title: 'Next 30 days', rows: o.items.filter((i) => i.days_left !== null && i.days_left <= 30).sort((a, b) => a.days_left - b.days_left).map((i) => ({ equipment: i.equipment, due_date: i.due_date, days_left: i.days_left })), columns: ['equipment', 'due_date', 'days_left'] }],
    limits: ['Reads only the files you give it; it books nothing.', 'Intervals are settings: the defaults in the example come from no code. Your fire marshal, local code, insurer and the manufacturer set the real ones.', 'Not legal, fire-safety or health-code advice.'],
  },
  draft: {
    noun: 'service_request', verb: 'send', actor: 'the general manager', required: ['equipment', 'vendor'],
    description: 'Write drafts/service_request-<vendor>.md: the equipment that vendor services that is overdue or due soon, asking for dates. Marked DRAFT.',
    args: { vendor: { type: 'string', description: 'Vendor name as on the equipment list' }, to: { type: 'string', description: 'Vendor contact' }, from: { type: 'string', description: 'Your name and restaurant' } },
    build: (o, a) => {
      const mine = o.items.filter((i) => nameKey(i.vendor) === nameKey(a.vendor) && (i.status === 'flag' || i.findings.some((f) => f.code === 'due_soon')));
      if (!mine.length) throw new Error(`nothing overdue or due soon for "${String(a.vendor).slice(0, 60)}"`);
      return { id: mine[0].vendor, to: a.to, text: letter({ title: `Service request: ${mine[0].vendor}`, to: a.to, from: a.from, re: 'Please schedule these visits',
        intro: 'Please propose dates for the following:',
        rows: mine.map((i) => ({ equipment: i.equipment, location: i.location, last_service: i.last_service, due: i.due_date })), columns: ['equipment', 'location', 'last_service', 'due'],
        closing: ['Preferred days and times (before or after service): [TO CONFIRM]'] }) };
    },
  },
  refused: [REFUSE.pay, REFUSE.email, { name: 'vendor_booking_submit', category: 'binding_send', description: 'Never books a vendor visit or signs a work order.' }],
  memory: null,
});
