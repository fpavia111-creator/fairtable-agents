import { readFileSync } from 'node:fs';
import { tableAgent, rollup, INVOICE_LINE_FIELDS, INVOICE_LINE_PROFILES, REFUSE, letter, money, nameKey } from 'fairtable-core';
import { priceCreep, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const CONTRACT_FIELDS = {
  vendor: t(['Vendor', 'Supplier', 'Distributor'], { required: true }),
  item: t(['Item', 'Item Description', 'Product'], { required: true }),
  pack: t(['Pack', 'Pack Size', 'Pack/Size']),
  price: t(['Price', 'Bid Price', 'Contract Price', 'Case Price'], { type: 'money' }),
  valid_from: t(['Valid From', 'Start', 'Effective'], { type: 'date' }),
  valid_to: t(['Valid To', 'End', 'Expires'], { type: 'date' }),
};
const files = {
  invoices: { type: 'string', description: 'Invoice lines over several weeks under --root (MarginEdge, R365, xtraCHEF, Sysco or US Foods export) with pack size and case price' },
  contracts: { type: 'string', description: 'Optional bid sheet or contract prices: vendor, item, pack, price, valid from, valid to' },
};
export const DEMO = { title: 'Fairtable Price Creep', files: { invoices: 'invoices.csv', contracts: 'contracts.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Fryer Oil' }, draft: { vendor: 'Example Foodservice' } };

export const manifest = tableAgent({
  pkg, prefix: 'price_creep',
  description: 'Follows every vendor item\'s price per lb, each or litre across your invoices: creeping increases, prices over your bid or contract, packs that got smaller at the same case price, and what the increases cost you. Writes a worklist and a letter draft to the vendor. Never contacts a vendor or changes an order.',
  check: { title: 'Vendor price creep', description: 'Read each vendor item\'s price per base unit through its pack size, compare the latest price with the first one in the file and with the bid price, and add up what was paid above the first price. Flags increases over the threshold, prices over the bid, steady creep and pack changes.' },
  args: files, required: ['invoices'],
  sources: {
    invoices: { label: 'Invoice lines', args: ['invoices'], fields: INVOICE_LINE_FIELDS, profiles: INVOICE_LINE_PROFILES },
    contracts: { label: 'Bid or contract prices', args: ['contracts'], fields: CONTRACT_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    flag_pct: { type: 'number', minimum: 0, description: 'Price rise % that counts (default 5)' },
    flag_amount: { type: 'number', minimum: 0, description: 'Flag when the rise cost at least this much over the period (default 25)' },
    contract_tolerance_pct: { type: 'number', minimum: 0, description: 'Allowed % over the bid price (default 1)' },
    creep_steps: { type: 'integer', minimum: 2, description: 'Increases in a row, up to the latest invoice, that count as creep (default 3)' },
    creep_min_pct: { type: 'number', minimum: 0, description: 'The increases in that run must add up to at least this percentage (default 5); small rises that a later drop undid are not creep' },
  } } },
  run: ({ rows, settings }) => priceCreep(rows, settings),
  key: { arg: 'item', field: 'item', label: 'vendor item' },
  summary: (o) => `${o.totals.vendor_items} item(s) from ${o.totals.vendors} vendor(s): ${money(o.totals.extra_paid)} paid above each item's first price, ${o.totals.over_contract} over the bid price. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Vendor price creep', base: 'price-creep',
    row: (i) => ({ vendor: i.vendor ?? '', item: i.item ?? '', invoices: i.invoices ?? '', unit: i.unit ?? '', first_price: i.first_price ?? '', last_price: i.last_price ?? '', change_pct: i.change_pct ?? '', extra_paid: i.extra_paid ?? '' }),
    htmlColumns: ['vendor', 'item', 'unit', 'first_price', 'last_price', 'change_pct', 'extra_paid'],
    sections: (o) => [{ title: 'By vendor', rows: rollup(o.items, 'vendor', (i) => i.vendor, { amount: (i) => i.extra_paid }), columns: ['vendor', 'count', 'amount'] }],
  },
  draft: {
    noun: 'letter', verb: 'send', actor: 'the owner or buyer', required: ['invoices', 'vendor'],
    description: 'Write drafts/letter-<vendor>.md: a letter to one vendor listing the items over the bid price and the increases, asking for the bid price and a credit. Marked DRAFT; open items are [TO CONFIRM].',
    args: { vendor: { type: 'string', description: 'Vendor name as it appears on the invoices' }, to: { type: 'string', description: 'Sales rep or account contact' }, from: { type: 'string', description: 'Your name and restaurant' } },
    build: (o, a) => {
      const mine = o.items.filter((i) => nameKey(i.vendor) === nameKey(a.vendor));
      if (!mine.length) throw new Error(`no invoices from vendor "${String(a.vendor).slice(0, 80)}"; vendors in the file: ${[...new Set(o.items.map((i) => i.vendor))].join(', ')}`);
      const asks = mine.filter((i) => i.findings.some((f) => ['over_contract', 'price_up', 'pack_changed'].includes(f.code)));
      if (!asks.length) throw new Error(`nothing to raise with ${a.vendor}: no item is over the bid, up past the threshold or in a changed pack`);
      const credit = asks.reduce((t, i) => t + (i.findings.find((f) => f.code === 'over_contract')?.amount || 0), 0);
      return { id: mine[0].vendor, to: a.to, amount: Math.round(credit * 100) / 100, text: letter({ title: `Price review with ${mine[0].vendor}`, to: a.to, from: a.from, re: 'Prices over our bid and recent increases',
        intro: 'We reviewed our invoices from the last weeks. Please confirm the prices below, apply our bid prices where they are higher, and credit the difference already invoiced.',
        rows: asks.map((i) => ({ item: i.item, unit: i.unit, first: i.first_price, latest: i.last_price, change: `${i.change_pct}%`, note: i.findings.map((f) => f.code).join(' ') })), columns: ['item', 'unit', 'first', 'latest', 'change', 'note'],
        closing: [`Credit requested for prices over the bid: ${money(credit)}.`, 'Account number: [TO CONFIRM]'] }) };
    },
  },
  refused: [REFUSE.order, REFUSE.pay, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another invoice name for the same item, e.g. {"name": "OIL FRY CLR 35#", "means": "Fryer Oil"}.', effect: 'reads that name as the item, so its prices are followed together', fields: { invoices: ['item'], contracts: ['item'] } },
});
