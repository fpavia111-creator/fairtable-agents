import { readFileSync } from 'node:fs';
import { tableAgent, DELIVERY_ORDER_FIELDS, DELIVERY_ORDER_PROFILES, REFUSE, letter, money, nameKey } from 'fairtable-core';
import { marketingFees, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t = (aliases, extra = {}) => ({ aliases, ...extra });
const CAMPAIGN_FIELDS = {
  platform: t(['Platform', 'Channel', 'Marketplace'], { required: true }),
  campaign: t(['Campaign', 'Campaign Name', 'Promotion', 'Name'], { required: true }),
  type: t(['Type', 'Campaign Type', 'Kind']),
  start: t(['Start', 'Start Date', 'From'], { type: 'date' }),
  end: t(['End', 'End Date', 'To'], { type: 'date' }),
  budget: t(['Budget', 'Max Spend', 'Weekly Budget', 'Cap'], { type: 'money' }),
  opted_in: t(['Opted In', 'Opt In', 'Approved', 'Active'], { type: 'bool' }),
};
const files = {
  statements: { type: 'string', description: 'Delivery-app statement lines with marketing fees and restaurant-funded promotions under --root (DoorDash, Uber Eats or Grubhub export)' },
  campaigns: { type: 'string', description: 'Your campaign list: platform, campaign, type (ads or promo), start, end, budget, opted in' },
};
export const DEMO = { title: 'Fairtable Delivery Marketing', files: { statements: 'statements.csv', campaigns: 'campaigns.csv', settings: 'settings.json' }, explain: { arg: 'campaign', value: 'Sponsored listing Nov wk1' }, draft: { platform: 'Uber Eats' } };

export const manifest = tableAgent({
  pkg, prefix: 'marketing',
  description: 'Delivery-app marketing fees and restaurant-funded promotions against the campaigns you opted into: charges with no campaign behind them, campaigns you never opted into, campaigns over budget, and what each one brought in for what it cost. Writes a worklist and a dispute draft per platform. Never logs in to a platform.',
  check: { title: 'Delivery app marketing fees', description: 'Attribute each marketing fee and promotion charge to an opted-in campaign on the same platform and dates; add up spend and the sales of the orders it touched. Flags charges outside any campaign, campaigns not opted into, spend over budget, low return and a high marketing share of sales.' },
  args: files, required: ['statements', 'campaigns'],
  sources: {
    statements: { label: 'Delivery-app statements', args: ['statements'], fields: DELIVERY_ORDER_FIELDS, profiles: DELIVERY_ORDER_PROFILES },
    campaigns: { label: 'Campaign list', args: ['campaigns'], fields: CAMPAIGN_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    min_return: { type: 'number', minimum: 0, description: 'Watch a campaign with less than this in order sales per 1 spent (default 4)' },
    target_share_pct: { type: 'number', minimum: 0, description: 'Watch a platform whose marketing and promotions exceed this % of its sales (default 10)' },
    tolerance: { type: 'number', minimum: 0, description: 'Amount over budget that is ignored (default 0.05)' },
  } } },
  run: ({ rows, settings }) => marketingFees(rows, settings),
  key: { arg: 'campaign', field: 'campaign', label: 'campaign' },
  summary: (o) => `${money(o.totals.marketing_spend)} of marketing and promotions on ${o.totals.platforms} platform(s) and ${o.totals.campaigns} listed campaign(s); ${money(o.totals.unexplained_spend)} with no opted-in campaign behind it. ${o.items.filter((i) => i.status === 'flag').length} flagged.`,
  report: {
    title: 'Delivery app marketing fees', base: 'delivery-marketing',
    row: (i) => ({ platform: i.platform ?? '', campaign: i.campaign ?? '', type: i.type ?? '', window: i.window ?? '', budget: i.budget ?? '', spend: i.spend ?? '', orders: i.orders ?? '', order_sales: i.order_sales ?? '', sales_per_dollar: i.sales_per_dollar ?? '' }),
    htmlColumns: ['platform', 'campaign', 'budget', 'spend', 'order_sales', 'sales_per_dollar'],
    sections: (o) => [{ title: 'By campaign', rows: o.items.map((i) => ({ campaign: i.campaign, amount: i.spend })), columns: ['campaign', 'amount'] }],
  },
  draft: {
    noun: 'dispute', verb: 'send', actor: 'the owner', required: ['statements', 'campaigns', 'platform'],
    description: 'Write drafts/dispute-<platform>.md: marketing charges with no opted-in campaign and spend over budget, for a person to raise in the platform\'s merchant portal. Marked DRAFT.',
    args: { platform: { type: 'string', description: 'Platform name as on the statement' }, to: { type: 'string', description: 'Merchant support or account manager' }, from: { type: 'string', description: 'Your name, restaurant and store id' } },
    build: (o, a) => {
      const mine = o.items.filter((i) => nameKey(i.platform) === nameKey(a.platform) && i.findings.some((f) => ['fee_outside_campaign', 'not_opted_in', 'over_budget'].includes(f.code)));
      if (!mine.length) throw new Error(`nothing to dispute with "${String(a.platform).slice(0, 60)}" in these files`);
      const total = Math.round(mine.reduce((t2, i) => t2 + i.findings.filter((f) => ['fee_outside_campaign', 'not_opted_in', 'over_budget'].includes(f.code)).reduce((u, f) => u + (f.amount || 0), 0), 0) * 100) / 100;
      return { id: mine[0].platform, to: a.to, amount: total, text: letter({ title: `Marketing charges to review: ${mine[0].platform}`, to: a.to, from: a.from, re: 'Charges outside the campaigns we opted into',
        intro: 'Our statements show marketing or promotion charges that do not match the campaigns we opted into, or that ran over the budget we set. Please review and credit them.',
        rows: mine.map((i) => ({ campaign: i.campaign, window: i.window || '-', budget: i.budget ?? '-', charged: money(i.spend), issue: i.findings.map((f) => f.code).join(' ') })), columns: ['campaign', 'window', 'budget', 'charged', 'issue'],
        closing: [`Credit requested: ${money(total)}.`, 'Campaign settings screenshots: [ATTACH]'] }) };
    },
  },
  refused: [REFUSE.platform, REFUSE.pay, REFUSE.email],
  memory: { kind: 'item_alias', description: 'Another name a platform uses for a campaign on your list, e.g. {"name": "BOGO Wings Nov", "means": "Buy one get one wings"}.', effect: 'reads that campaign name as the listed campaign', fields: { campaigns: ['campaign'] } },
});
