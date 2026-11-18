import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter } from 'fairtable-core';
import { foodHandlers, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const ROSTER_FIELDS = {
  employee: t(['Employee', 'Name', 'Team Member', 'Staff'], { required: true, personal: true }),
  role: t(['Role', 'Job Title', 'Position', 'Job']),
  location: t(['Location', 'Store', 'Restaurant']),
  hire_date: t(['Hire Date', 'Start Date', 'Hired'], { type: 'date' }),
  status: t(['Status', 'Employment Status', 'Active']),
};
const CERT_FIELDS = {
  employee: t(['Employee', 'Name', 'Holder', 'Team Member'], { required: true, personal: true }),
  cert_type: t(['Cert Type', 'Certificate', 'Type', 'Course', 'Card Type']),
  number: t(['Number', 'Certificate Number', 'Card Number', 'ID']),
  issued: t(['Issued', 'Issue Date', 'Completed'], { type: 'date' }),
  expires: t(['Expires', 'Expiry', 'Expiration Date', 'Valid Until'], { type: 'date' }),
};
const files = {
  roster: { type: 'string', description: 'Staff roster under --root (from your POS, scheduling or payroll export): employee, role, location, hire date, status' },
  certificates: { type: 'string', description: 'Certificates on file: employee, type (food handler, food protection manager, alcohol server), number, issued, expires' },
};
export const DEMO = { title: 'Fairtable Food Handler Cards', files: { roster: 'roster.csv', certificates: 'certificates.csv', settings: 'settings.json' }, explain: { arg: 'employee', value: 'Sam Patel' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'food_handlers',
  description: 'Food handler cards, food protection manager and alcohol server certificates against the active staff roster, as of a date: missing after the grace period, expired, expiring soon, alcohol servers without a certificate, and locations without a certified manager. Staff names are masked for the AI model. Writes a worklist and a reminder list draft. Never contacts staff or a training provider.',
  check: { title: 'Food handler cards', description: 'Match every active employee with their certificates; flag missing cards after the grace period for new hires, expired cards and certificates and locations with no current certified food protection manager; watch certificates expiring soon and list alcohol servers with no certificate.' },
  args: files, required: ['roster', 'certificates'],
  sources: {
    roster: { label: 'Staff roster', args: ['roster'], fields: ROSTER_FIELDS },
    certificates: { label: 'Certificates', args: ['certificates'], fields: CERT_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date checked (default: today)' },
    grace_days: { type: 'integer', minimum: 0, description: 'Days a new hire has to get a food handler card (default 30; check your state and county)' },
    warn_days: { type: 'integer', minimum: 0, description: 'Watch certificates expiring within this many days (default 45)' },
    food_handler_types: { type: 'array', items: { type: 'string' }, description: 'Certificate names that count as a food handler card' },
    manager_cert_types: { type: 'array', items: { type: 'string' }, description: 'Certificate names that count as a certified food protection manager' },
    alcohol_cert_types: { type: 'array', items: { type: 'string' }, description: 'Certificate names that count as alcohol server training' },
    alcohol_roles: { type: 'array', items: { type: 'string' }, description: 'Roles that serve alcohol' },
    manager_per_location: { type: 'boolean', description: 'Flag a location with no current certified manager (default true)' },
  } } },
  run: ({ rows, settings }) => foodHandlers(rows, settings),
  key: { arg: 'employee', field: 'employee', label: 'employee', person: true },
  summary: (o) => `${o.totals.staff} active staff at ${o.totals.locations} location(s), as of ${o.extra.as_of}: ${o.totals.action_needed} need action now. ${o.items.filter((i) => i.status === 'watch').length} coming up, ${o.items.filter((i) => i.status === 'review').length} to review.`,
  report: {
    title: 'Food handler cards', base: 'food-handler-cards',
    row: (i) => ({ employee: i.employee ?? '', role: i.role ?? '', location: i.location ?? '', hire_date: i.hire_date ?? '', certificates: i.certificates ?? '', next_expiry: i.next_expiry ?? '' }),
    htmlColumns: ['employee', 'role', 'location', 'certificates', 'next_expiry'],
    sections: (o) => [{ title: 'By location', rows: [...new Set(o.items.map((i) => i.location))].sort().map((l) => ({ location: l, count: o.items.filter((i) => i.location === l && i.status !== 'ok').length })), columns: ['location', 'count'] }],
    limits: ['Reads only the files you give it; it contacts no one.', 'Which cards are required, the grace period for new hires and renewal periods depend on your state, county and city; they are settings you confirm with your health department.', 'Not legal or health-code advice.'],
  },
  draft: {
    noun: 'reminder_list', verb: 'send', actor: 'the general manager', required: ['roster', 'certificates', 'location'],
    description: 'Write drafts/reminder_list-<location>.md: who needs a card or a renewal and by when, for the manager to hand out. Marked DRAFT.',
    args: { location: { type: 'string', description: 'Location name' }, to: { type: 'string', description: 'Location manager' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const mine = o.items.filter((i) => i.location.toLowerCase() === String(a.location).trim().toLowerCase() && i.status !== 'ok');
      if (!mine.length) throw new Error(`nothing due for "${String(a.location).slice(0, 60)}"`);
      return { id: mine[0].location, to: a.to, text: letter({ title: `Cards and certificates due: ${mine[0].location}`, to: a.to, from: a.from, re: 'Food handler, manager and alcohol certificates',
        intro: 'Please make sure each person below gets or renews their certificate:',
        rows: mine.map((i) => ({ employee: i.employee, role: i.role, what: i.findings.map((f) => f.code).join(' '), next_expiry: i.next_expiry || '-' })), columns: ['employee', 'role', 'what', 'next_expiry'],
        closing: ['Training provider and course link: [TO CONFIRM]'] }) };
    },
  },
  refused: [REFUSE.email, REFUSE.payroll, { name: 'training_enroll', category: 'move_money', description: 'Never enrolls or pays for anyone\'s training.' }],
  memory: null,
});
