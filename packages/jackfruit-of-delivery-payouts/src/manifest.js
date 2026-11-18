import { readFileSync } from 'node:fs';
import { tableAgent, DELIVERY_ORDER_FIELDS, DELIVERY_ORDER_PROFILES, REFUSE, letter, money, nameKey } from 'fairtable-core';
import { deliveryPayouts, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const POS_ORDER_FIELDS = {
  order_id: { aliases: ['External Order ID', 'Order ID', 'Order Number', 'Third Party Order ID', 'Online Order ID'], required: true },
  platform: { aliases: ['Platform', 'Source', 'Order Source', 'Channel', 'Dining Option'] },
  date: { aliases: ['Date', 'Order Date', 'Business Date'], type: 'date' },
  location: { aliases: ['Location', 'Store', 'Restaurant'] },
  subtotal: { aliases: ['Subtotal', 'Net Sales', 'Amount', 'Order Subtotal'], type: 'money' },
};
const files = {
  statements: { type: 'string', description: 'Delivery-app statement lines under --root (DoorDash transactions, Uber Eats payment details or Grubhub transactions export)' },
  pos_orders: { type: 'string', description: 'Optional POS orders from the delivery apps (order id, platform, date, subtotal) to find orders never paid' },
};
export const DEMO = { title: 'Jackfruit of Delivery Payouts', files: { statements: 'statements.csv', pos_orders: 'pos_orders.csv', settings: 'settings.json' }, explain: { arg: 'order_id', value: 'DD-1002' }, draft: { platform: 'DoorDash' } };

export const manifest = tableAgent({
  pkg, prefix: 'jackfruit',
  description: 'Matches DoorDash, Uber Eats and Grubhub statements with your POS orders and your contract rates: commissions over the rate, payout lines whose arithmetic does not add up, error charges to dispute, orders paid twice and orders never paid. Writes a worklist and a dispute draft per platform. Never logs in to a platform and never sends.',
  check: { title: 'Delivery app payouts against orders', description: 'Check each statement line\'s payout against its own subtotal, tax, fees, refunds and adjustments, its commission against the contract rate in the settings, and match statement orders with POS orders. Flags overcharges, short payouts and unpaid orders, and lists error charges to dispute.' },
  args: files, required: ['statements'],
  sources: {
    statements: { label: 'Delivery-app statements', args: ['statements'], fields: DELIVERY_ORDER_FIELDS, profiles: DELIVERY_ORDER_PROFILES },
    pos_orders: { label: 'POS delivery orders', args: ['pos_orders'], fields: POS_ORDER_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    platforms: { type: 'object', additionalProperties: { type: 'object', additionalProperties: false, properties: { commission_pct: { type: 'number' }, processing_pct: { type: 'number' } } }, description: 'Your contract rates per platform, e.g. {"DoorDash": {"commission_pct": 15}}' },
    tolerance: { type: 'number', minimum: 0, description: 'Rounding allowed per line (default 0.05)' },
  } } },
  run: ({ rows, settings }) => deliveryPayouts(rows, settings),
  key: { arg: 'order_id', field: 'order_id', label: 'delivery order' },
  summary: (o) => `${o.totals.orders} order(s): subtotal ${money(o.totals.subtotal)}, platform fees ${money(o.totals.platform_fees)}, refunds ${money(o.totals.refunds)}, paid out ${money(o.totals.payouts)}; ${money(o.totals.disputable)} to raise with the platforms. ${o.items.filter((i) => i.status === 'flag').length} flagged, ${o.items.filter((i) => i.status === 'review').length} need review.`,
  report: {
    title: 'Delivery app payouts against orders', base: 'jackfruit-delivery-payouts',
    row: (i) => ({ platform: i.platform ?? '', order_id: i.order_id ?? '', date: i.date ?? '', subtotal: i.subtotal ?? '', commission: i.commission ?? '', refund: i.refund ?? '', payout: i.payout ?? '', disputable: i.disputable ?? '' }),
    htmlColumns: ['platform', 'order_id', 'date', 'subtotal', 'commission', 'payout', 'disputable'],
    sections: (o) => [{ title: 'By platform', rows: [...new Set(o.items.map((i) => i.platform))].sort().map((p) => ({ platform: p, count: o.items.filter((i) => i.platform === p).length, amount: Math.round(o.items.filter((i) => i.platform === p).reduce((t, i) => t + i.disputable, 0) * 100) / 100 })), columns: ['platform', 'count', 'amount'] }],
  },
  draft: {
    noun: 'dispute', verb: 'send', actor: 'the owner or bookkeeper', required: ['statements', 'platform'],
    description: 'Write drafts/dispute-<platform>.md: the overcharged commissions, short payouts, unpaid orders and error charges for one platform, for a person to submit in the platform\'s merchant portal. Marked DRAFT.',
    args: { platform: { type: 'string', description: 'DoorDash, Uber Eats or Grubhub, as on the statement' }, to: { type: 'string', description: 'Merchant support or account manager' }, from: { type: 'string', description: 'Your name, restaurant and store id' } },
    build: (o, a) => {
      const mine = o.items.filter((i) => nameKey(i.platform) === nameKey(a.platform) && (i.disputable > 0 || i.findings.some((f) => f.code === 'error_charge')));
      if (!mine.length) throw new Error(`nothing to dispute with "${String(a.platform).slice(0, 60)}" in these files`);
      const total = Math.round(mine.reduce((t, i) => t + i.disputable + (i.findings.some((f) => f.code === 'error_charge') ? i.refund : 0), 0) * 100) / 100;
      return { id: mine[0].platform, to: a.to, amount: total, text: letter({ title: `Payout dispute: ${mine[0].platform}`, to: a.to, from: a.from, re: 'Orders charged over our rate, short-paid or not paid',
        intro: 'Please review these orders against our merchant agreement and the order history, and correct the payouts.',
        rows: mine.map((i) => ({ order: i.order_id, date: i.date, subtotal: money(i.subtotal), issue: i.findings.map((f) => f.code).join(' '), amount: money(i.disputable + (i.findings.some((f) => f.code === 'error_charge') ? i.refund : 0)) })), columns: ['order', 'date', 'subtotal', 'issue', 'amount'],
        closing: [`Total requested: ${money(total)}.`, 'Store id and contract date: [TO CONFIRM]', 'Ticket photos for the error charges: [ATTACH]'] }) };
    },
  },
  refused: [REFUSE.platform, REFUSE.refund, REFUSE.email],
  memory: null,
});
