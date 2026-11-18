import { readFileSync } from 'node:fs';
import { tableAgent, REFUSE, letter, money } from 'fairtable-core';
import { cardFees, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const STATEMENT_FIELDS = {
  month: t(['Month', 'Statement Month', 'Period'], { required: true }),
  location: t(['Location', 'Merchant', 'Store', 'MID Name']),
  card_brand: t(['Card Brand', 'Brand', 'Card Type', 'Network']),
  volume: t(['Volume', 'Sales Volume', 'Gross Sales', 'Amount Processed'], { type: 'money' }),
  transactions: t(['Transactions', 'Count', 'Items', 'Transaction Count'], { type: 'number' }),
  fee_name: t(['Fee Name', 'Description', 'Fee', 'Fee Description'], { required: true }),
  fee_type: t(['Fee Type', 'Type', 'Category']),
  amount: t(['Amount', 'Fee Amount', 'Total'], { type: 'money' }),
};
const files = { statements: { type: 'string', description: 'Card processing statement lines under --root (typed from the statement or exported from the processor portal): month, location, card brand, volume, transactions, fee name, fee type, amount' } };
export const DEMO = { title: 'Fairtable Card Fees', files: { statements: 'statements.csv', settings: 'settings.json' }, explain: { arg: 'line', value: 'Main Street 2026-10' }, draft: {} };

export const manifest = tableAgent({
  pkg, prefix: 'card_fees',
  description: 'Reads monthly card processing statements: the effective rate per location and month, processor markup over your agreed rate, fees not in your agreement, monthly fees over their cap and downgrade surcharges. Writes a worklist and a letter draft to the processor. Never contacts the processor or changes the merchant account.',
  check: { title: 'Card processing fees', description: 'For each location and month: total fees over card volume (the effective rate), the processor markup against the agreed basis points plus per-transaction fee, and every other fee against your agreement list. Flags markup over contract, fees over cap and rising effective rates; lists unexpected fees and downgrade surcharges.' },
  args: files, required: ['statements'],
  sources: { statements: { label: 'Card statements', args: ['statements'], fields: STATEMENT_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    markup_bps: { type: ['number', 'null'], description: 'Agreed processor markup over interchange, in basis points (30 = 0.30%); null to skip the check' },
    per_transaction_fee: { type: 'number', minimum: 0, description: 'Agreed processor fee per transaction (default 0)' },
    allowed_fees: { type: 'object', additionalProperties: { type: 'number' }, description: 'Fees in your agreement with their monthly cap, e.g. {"Monthly service fee": 25}' },
    rate_up_bps: { type: 'number', minimum: 0, description: 'Flag an effective rate this many basis points over the month before (default 15)' },
    tolerance: { type: 'number', minimum: 0, description: 'Amount ignored per check (default 1)' },
  } } },
  run: ({ rows, settings }) => cardFees(rows, settings),
  key: { arg: 'line', field: 'line', label: 'location and month (e.g. "Main Street 2026-10")' },
  summary: (o) => `${o.totals.statements} statement(s): ${money(o.totals.total_fees)} in fees on ${money(o.totals.card_volume)} of card volume (effective rate ${o.totals.effective_rate_pct ?? 'n/a'}%); ${money(o.totals.to_recover)} to raise with the processor. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Card processing fees', base: 'card-fees',
    row: (i) => ({ location: i.location ?? '', month: i.month ?? '', volume: i.volume ?? '', transactions: i.transactions ?? '', total_fees: i.total_fees ?? '', markup: i.markup ?? '', effective_rate_pct: i.effective_rate_pct ?? '' }),
    htmlColumns: ['location', 'month', 'volume', 'total_fees', 'markup', 'effective_rate_pct'],
    sections: (o) => [{ title: 'By month', rows: [...new Set(o.items.map((i) => i.month))].sort().map((m) => ({ month: m, amount: Math.round(o.items.filter((i) => i.month === m).reduce((t2, i) => t2 + i.total_fees, 0) * 100) / 100 })), columns: ['month', 'amount'] }],
  },
  draft: {
    noun: 'letter', verb: 'send', actor: 'the owner',
    description: 'Write drafts/letter-processor.md: the markup over the agreed rate and the fees outside the agreement, asking for a refund and the correct pricing. Marked DRAFT.',
    args: { to: { type: 'string', description: 'Processor account manager or support' }, from: { type: 'string', description: 'Your name, business and merchant id' } },
    build: (o, a) => {
      const lines = o.items.filter((i) => i.findings.some((f) => ['markup_over_contract', 'unexpected_fee', 'fee_over_cap'].includes(f.code)));
      if (!lines.length) throw new Error('nothing to raise with the processor in these statements');
      return { id: 'processor', to: a.to, amount: o.totals.to_recover, text: letter({ title: 'Card processing fees to correct', to: a.to, from: a.from, re: 'Charges outside our agreement',
        intro: 'Our statements show charges above our agreed pricing or not in our agreement. Please refund them and confirm the pricing on our account.',
        rows: lines.flatMap((i) => i.findings.filter((f) => ['markup_over_contract', 'unexpected_fee', 'fee_over_cap'].includes(f.code)).map((f) => ({ statement: i.line, issue: f.code, amount: money(f.amount) }))), columns: ['statement', 'issue', 'amount'],
        closing: [`Total: ${money(o.totals.to_recover)}.`, 'Merchant id and pricing schedule: [ATTACH]'] }) };
    },
  },
  refused: [REFUSE.pay, REFUSE.email, { name: 'merchant_account_change', category: 'go_live', description: 'Never changes or cancels the merchant account.' }],
  memory: null,
});
