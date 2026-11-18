import { readFileSync } from 'node:fs';
import { tableAgent, rollup, INVOICE_LINE_FIELDS, INVOICE_LINE_PROFILES, REFUSE, letter, money, nameKey } from 'fairtable-core';
import { deliveries, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const RECEIVING_FIELDS = {
  invoice_number: t(['Invoice Number', 'Invoice #', 'Invoice', 'Delivery Ticket', 'Ticket'], { required: true }),
  vendor: t(['Vendor', 'Supplier', 'Distributor']),
  received_date: t(['Received Date', 'Date', 'Delivery Date'], { type: 'date' }),
  item: t(['Item', 'Item Description', 'Product', 'Description'], { required: true }),
  qty_received: t(['Qty Received', 'Received', 'Quantity Received', 'Qty'], { type: 'number' }),
  qty_rejected: t(['Qty Rejected', 'Rejected', 'Refused', 'Returned'], { type: 'number' }),
  note: t(['Note', 'Notes', 'Comment', 'Condition', 'Remarks']),
  received_by: t(['Received By', 'Checked By', 'Receiver', 'Signed By'], { personal: true }),
};
const CREDIT_FIELDS = {
  credit_number: t(['Credit Number', 'Credit Memo', 'Credit #', 'CM Number', 'Memo Number']),
  vendor: t(['Vendor', 'Supplier']),
  invoice_number: t(['Invoice Number', 'Original Invoice', 'Invoice #', 'Applies To'], { required: true }),
  item: t(['Item', 'Item Description', 'Product', 'Description']),
  amount: t(['Amount', 'Credit Amount', 'Total', 'Credit'], { type: 'money' }),
  credit_date: t(['Credit Date', 'Date'], { type: 'date' }),
};
const files = {
  invoices: { type: 'string', description: 'Invoice lines under --root (MarginEdge, R365, xtraCHEF, Sysco or US Foods export)' },
  receiving: { type: 'string', description: 'Receiving log: invoice number, item, quantity received, quantity rejected, note, received by' },
  credits: { type: 'string', description: 'Optional credit memos: credit number, invoice number, item, amount' },
};
export const DEMO = { title: 'Blueberry of Deliveries', files: { invoices: 'invoices.csv', receiving: 'receiving.csv', credits: 'credits.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Chicken Breast' }, draft: { vendor: 'Example Foodservice' } };

export const manifest = tableAgent({
  pkg, prefix: 'blueberry',
  description: 'Matches every invoice line with the receiving log (shorts, cases rejected at the door, substitutes) and with the credit memos, and lists what is still owed. Writes a worklist and a credit request draft to the vendor. Never pays, never contacts the vendor.',
  check: { title: 'Invoices against deliveries and credit memos', description: 'For each invoice line: quantity invoiced against quantity received and rejected, the credit that should follow, and the credit memos that did. Flags shorts and rejected cases not credited, over-credits, items received but not invoiced and invoices nobody received.' },
  args: files, required: ['invoices', 'receiving'],
  sources: {
    invoices: { label: 'Invoice lines', args: ['invoices'], fields: INVOICE_LINE_FIELDS, profiles: INVOICE_LINE_PROFILES },
    receiving: { label: 'Receiving log', args: ['receiving'], fields: RECEIVING_FIELDS },
    credits: { label: 'Credit memos', args: ['credits'], fields: CREDIT_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    tolerance: { type: 'number', minimum: 0, description: 'Differences up to this amount are ignored (default 1.00)' },
    rejected_words: { type: 'array', items: { type: 'string' }, description: 'Words in a receiving note that mean goods were refused' },
  } } },
  run: ({ rows, settings }) => deliveries(rows, settings),
  key: { arg: 'item', field: 'item', label: 'invoice line item' },
  summary: (o) => `${o.totals.lines} line(s) on ${o.totals.invoices} invoice(s): credits expected ${money(o.totals.credit_expected)}, credited ${money(o.totals.credited)}, still owed ${money(o.totals.credit_due)}. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Invoices against deliveries and credit memos', base: 'blueberry-deliveries',
    row: (i) => ({ vendor: i.vendor ?? '', invoice_number: i.invoice_number ?? '', item: i.item ?? '', invoiced_qty: i.invoiced_qty ?? '', received_qty: i.received_qty ?? '', rejected_qty: i.rejected_qty ?? '', unit_price: i.unit_price ?? '', credit_expected: i.credit_expected ?? '', credited: i.credited ?? '', credit_due: i.credit_due ?? '' }),
    htmlColumns: ['vendor', 'invoice_number', 'item', 'invoiced_qty', 'received_qty', 'credit_due'],
    sections: (o) => [{ title: 'By vendor', rows: rollup(o.items, 'vendor', (i) => i.vendor, { amount: (i) => i.credit_due }, { countWhen: (i) => i.status !== 'ok' }), columns: ['vendor', 'count', 'amount'] }],
  },
  draft: {
    noun: 'credit_request', verb: 'send', actor: 'the kitchen manager or bookkeeper', required: ['invoices', 'receiving', 'vendor'],
    description: 'Write drafts/credit_request-<vendor>.md: the shorts and rejected cases on that vendor\'s invoices that are not credited yet, with the amount, for a person to send. Marked DRAFT.',
    args: { vendor: { type: 'string', description: 'Vendor name as on the invoices' }, to: { type: 'string', description: 'Vendor credit contact or sales rep' }, from: { type: 'string', description: 'Your name and restaurant' } },
    build: (o, a) => {
      const owed = o.items.filter((i) => nameKey(i.vendor) === nameKey(a.vendor) && i.credit_due > 0);
      if (!owed.length) throw new Error(`no credit is owed by "${String(a.vendor).slice(0, 80)}" in these files`);
      const total = Math.round(owed.reduce((t, i) => t + i.credit_due, 0) * 100) / 100;
      return { id: owed[0].vendor, to: a.to, amount: total, text: letter({ title: `Credit request to ${owed[0].vendor}`, to: a.to, from: a.from, re: 'Shorts and refused cases not yet credited',
        intro: 'Our receiving log shows the following items were short or refused at delivery and have not been credited yet. Please issue credit memos for these lines.',
        rows: owed.map((i) => ({ invoice: i.invoice_number, item: i.item, invoiced: i.invoiced_qty, received: i.received_qty ?? 0, refused: i.rejected_qty ?? 0, credit_due: money(i.credit_due) })), columns: ['invoice', 'item', 'invoiced', 'received', 'refused', 'credit_due'],
        closing: [`Total credit requested: ${money(total)}.`, 'Delivery driver signature on the refused cases: [ATTACH receiving slips]'] }) };
    },
  },
  refused: [REFUSE.pay, REFUSE.order, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name the receiving log or the credit memos use for an invoice item, e.g. {"name": "Chix Brst", "means": "Chicken Breast"}.', effect: 'reads that name as the invoice item in the receiving log and credit memos', fields: { receiving: ['item'], credits: ['item'], invoices: ['item'] } },
});
