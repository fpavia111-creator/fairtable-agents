import { readFileSync } from 'node:fs';
import { tableAgent, rollup, INVOICE_LINE_FIELDS, INVOICE_LINE_PROFILES, REFUSE, letter, money } from 'fairtable-core';
import { invoices, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { invoices: { type: 'string', description: 'Vendor invoice lines waiting for payment under --root (R365, MarginEdge, xtraCHEF or your AP export): vendor, invoice number, date, item, quantity, unit price, extended, GL account' } };
export const DEMO = { title: 'Quince of Invoices', files: { invoices: 'invoices.csv', settings: 'settings.json' }, explain: { arg: 'invoice', value: 'Example Foodservice EF-50311 2026-11-10' }, draft: {} };

export const manifest = tableAgent({
  pkg, prefix: 'quince',
  description: 'Vendor invoices before they are paid: the same invoice entered twice, likely duplicates under a new number, line math that does not add up, missing invoice numbers, and lines coded to the wrong GL account under your own keyword rules. Writes a worklist and a hold memo draft for the bookkeeper. Never pays and never posts to the books.',
  check: { title: 'Duplicate invoices and GL coding', description: 'Group invoice lines into invoices; flag an invoice number entered again and line math errors; review the same amount from the same vendor within a few days, invoices with no number and lines coded against your GL rules.' },
  args: files, required: ['invoices'],
  sources: { invoices: { label: 'Invoice lines', args: ['invoices'], fields: INVOICE_LINE_FIELDS, profiles: INVOICE_LINE_PROFILES } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    gl_rules: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['match', 'gl'], properties: { match: { type: 'string', maxLength: 300 }, gl: { type: 'string' } } }, description: 'Keyword rules: item names matching "match" (a regular expression) belong in GL account "gl"' },
    duplicate_window_days: { type: 'integer', minimum: 0, description: 'Same amount from the same vendor within this many days is a possible duplicate (default 5)' },
    tolerance: { type: 'number', minimum: 0, description: 'Rounding allowed in line math and amounts (default 0.02)' },
  } } },
  run: ({ rows, settings }) => invoices(rows, settings),
  key: { arg: 'invoice', field: 'invoice', label: 'invoice (vendor, number and date)' },
  summary: (o) => `${o.totals.invoices} invoice(s), ${money(o.totals.invoiced)}: ${money(o.totals.duplicate_amount)} entered twice, ${o.totals.miscoded_lines} line(s) coded against your GL rules. ${o.items.filter((i) => i.status === 'flag').length} to hold, ${o.items.filter((i) => i.status === 'review').length} to check.`,
  report: {
    title: 'Duplicate invoices and GL coding', base: 'quince-invoices',
    row: (i) => ({ vendor: i.vendor ?? '', invoice_number: i.invoice_number ?? '', invoice_date: i.invoice_date ?? '', lines: i.lines ?? '', total: i.total ?? '' }),
    htmlColumns: ['vendor', 'invoice_number', 'invoice_date', 'total'],
    sections: (o) => [{ title: 'By vendor', rows: rollup(o.items, 'vendor', (i) => i.vendor, { amount: (i) => i.total }), columns: ['vendor', 'count', 'amount'] }],
  },
  draft: {
    noun: 'hold_memo', verb: 'send', actor: 'the owner',
    description: 'Write drafts/hold_memo-ap.md: the invoices to hold before the next payment run and the lines to recode, for the bookkeeper. Marked DRAFT; nothing is paid or posted.',
    args: { to: { type: 'string', description: 'Bookkeeper' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const list = o.items.filter((i) => i.status !== 'ok');
      if (!list.length) throw new Error('no invoice needs holding or recoding in these files');
      return { id: 'ap', to: a.to, amount: o.totals.duplicate_amount, text: letter({ title: 'Invoices to hold or correct before the payment run', to: a.to, from: a.from, re: 'Duplicates, math and coding',
        intro: 'Please hold the flagged invoices and check the others before the next payment run.',
        rows: list.map((i) => ({ invoice: i.invoice, total: money(i.total), issue: i.findings.map((f) => f.code).join(' ') })), columns: ['invoice', 'total', 'issue'],
        closing: ['Payment run date: [TO CONFIRM]'] }) };
    },
  },
  refused: [REFUSE.pay, REFUSE.ledger, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name a vendor uses on invoices, e.g. {"name": "EXAMPLE FOODSVC INC", "means": "Example Foodservice"}.', effect: 'reads that vendor name as the vendor, so its invoices are compared together', fields: { invoices: ['vendor'] } },
});
