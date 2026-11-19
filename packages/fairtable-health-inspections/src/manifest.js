import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter } from 'fairtable-core';
import { inspections, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const INSPECTION_FIELDS = {
  location: t(['Location', 'Store', 'Restaurant', 'Establishment'], { required: true }),
  date: t(['Date', 'Inspection Date', 'Visit Date'], { type: 'date' }),
  type: t(['Type', 'Inspection Type', 'Visit Type']),
  score: t(['Score', 'Points', 'Result'], { type: 'number' }),
  critical_violations: t(['Critical Violations', 'Critical', 'Priority Violations', 'Red Items'], { type: 'number' }),
  violations: t(['Violations', 'Total Violations', 'Items'], { type: 'number' }),
  reinspection_due: t(['Reinspection Due', 'Re-inspection Due', 'Follow-up Due', 'Correct By'], { type: 'date' }),
};
const PERMIT_FIELDS = {
  location: t(['Location', 'Store', 'Restaurant']),
  permit: t(['Permit', 'Licence', 'License', 'Certificate', 'Name'], { required: true }),
  number: t(['Number', 'Permit Number', 'Licence Number', 'License Number']),
  expires: t(['Expires', 'Expiry', 'Expiration Date', 'Valid Until'], { type: 'date' }),
};
const files = {
  inspections: { type: 'string', description: 'Inspection history under --root (typed from the reports): location, date, type, score, critical and total violations, re-inspection due date' },
  permits: { type: 'string', description: 'Optional permits and licences: location, permit, number, expiry date' },
};
export const DEMO = { title: 'Fairtable Health Inspections', files: { inspections: 'inspections.csv', permits: 'permits.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Main Street | inspections' }, draft: { location: 'Main Street' } };

export const manifest = tableAgent({
  pkg, prefix: 'inspections',
  description: 'The health inspection and permit calendar for each location, as of a date: re-inspections overdue, critical violations with no re-inspection on file, scores dropping, the next routine visit to prepare for, and permits and licences expired or expiring. Writes a worklist and a checklist memo draft. Never contacts the health department.',
  check: { title: 'Health inspection calendar', description: 'For each location: the latest inspection, any re-inspection due and not on file, critical violations not followed by a later inspection, score drops and the estimated next routine visit; for each permit: expired, expiring soon or no expiry date.' },
  args: files, required: ['inspections'],
  sources: {
    inspections: { label: 'Inspection history', args: ['inspections'], fields: INSPECTION_FIELDS },
    permits: { label: 'Permits and licences', args: ['permits'], fields: PERMIT_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the calendar is checked for (default: today)' },
    routine_interval_days: { type: 'integer', minimum: 1, description: 'Typical days between routine inspections in your area (default 180; a planning estimate, not a schedule the health department publishes)' },
    routine_warn_days: { type: 'integer', minimum: 0, description: 'Watch when the estimated next routine visit is this close (default 45)' },
    permit_warn_days: { type: 'integer', minimum: 0, description: 'Watch permits expiring within this many days (default 60)' },
    score_drop_points: { type: 'number', minimum: 0, description: 'A drop of this many points between inspections is reviewed (default 5)' },
    followup_score: { type: ['number', 'null'], description: 'Report critical violations as still open only when that inspection scored this or worse, the score that brings a re-inspection where you are (New York City re-inspects from 14 points); empty reports every critical violation with no later inspection (default empty)' },
    lower_score_is_better: { type: 'boolean', description: 'True where the score counts violation points, so a lower score is better (New York City, for example); then a rise of score_drop_points is reviewed (default false)' },
    routine_words: { type: 'array', items: { type: 'string', minLength: 1, maxLength: 60 }, maxItems: 20, description: 'An inspection whose type contains one of these words is a routine one, unless it is a re-inspection (default routine, initial inspection; New York City writes Cycle Inspection / Initial Inspection, Chicago Canvass)' },
  } } },
  run: ({ rows, settings }) => inspections(rows, settings),
  key: { arg: 'item', field: 'item', label: 'location line (e.g. "Main Street | inspections" or "Main Street | Liquor licence")' },
  summary: (o) => `${o.totals.locations} location(s), ${o.totals.permits} permit(s) at ${o.extra.as_of}: ${o.totals.overdue} need action now, ${o.totals.due_soon} coming up. ${o.items.filter((i) => i.status === 'review').length} to review.`,
  report: {
    title: 'Health inspection calendar', base: 'health-inspections',
    row: (i) => ({ location: i.location ?? '', item: i.item ?? '', kind: i.kind ?? '', last_inspection: i.last_inspection ?? '', last_score: i.last_score ?? '', next_date: i.next_date ?? '', days_left: i.days_left ?? '' }),
    htmlColumns: ['item', 'last_inspection', 'last_score', 'next_date', 'days_left'],
    sections: (o) => [{ title: 'Next 30 days', rows: o.items.filter((i) => i.days_left !== null && i.days_left <= 30).sort((a, b) => a.days_left - b.days_left).map((i) => ({ item: i.item, next_date: i.next_date, days_left: i.days_left })), columns: ['item', 'next_date', 'days_left'] }],
    limits: ['Reads only the files you give it; it does not contact the health department or a licensing office.', 'The next routine visit is an estimate from your own history and the interval in the settings; inspections can come at any time.', 'Not legal or health-code advice.'],
  },
  draft: {
    noun: 'memo', verb: 'send', actor: 'the general manager', required: ['inspections', 'location'],
    description: 'Write drafts/memo-<location>.md: what to do before the next inspection at one location (open violations, re-inspection to request, permits to renew). Marked DRAFT.',
    args: { location: { type: 'string', description: 'Location name' }, to: { type: 'string', description: 'Kitchen manager' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const mine = o.items.filter((i) => i.location.toLowerCase() === String(a.location).trim().toLowerCase() && i.status !== 'ok');
      if (!mine.length) throw new Error(`nothing to act on for "${String(a.location).slice(0, 60)}"`);
      return { id: mine[0].location, to: a.to, text: letter({ title: `Inspection readiness: ${mine[0].location}`, to: a.to, from: a.from, re: 'Before the next inspection',
        intro: 'From our inspection history and permit list:',
        rows: mine.map((i) => ({ item: i.item, date: i.next_date || i.last_inspection || '', what: i.findings.map((f) => f.code).join(' ') })), columns: ['item', 'date', 'what'],
        closing: ['Corrective actions done and signed off by: [TO CONFIRM]'] }) };
    },
  },
  refused: [REFUSE.email, { name: 'agency_portal_submit', category: 'binding_send', description: 'Never submits anything to a health department or licensing portal.' }, REFUSE.pay],
  memory: null,
});
