// Builds a Fairtable agent manifest from a short description, so every agent has the
// same shape:
//
//   <prefix>_check          read    run the check on your exported files
//   <prefix>_explain        read    one item with every finding and the numbers behind it
//   <prefix>_write_report   report  CSV worklist (blank owner and decision columns) + HTML page
//   <prefix>_draft_<noun>   write   a draft marked DRAFT (optional)
//   <prefix>_request_<verb> action  one named person's click, even in Auto (optional)
//   memory tools, and refused tools listed so a host model can see they are refused.
//
// The kit reads every source through the core (column names, encodings, local dates and
// decimal marks), keeps only the columns the agent declares, trims every value, and sorts
// the rows the same way whatever order the file had them in, so a result never depends on
// row order, column order or stray columns. Names, phone numbers and emails in fields
// marked personal are masked in everything returned to the AI model; files written on
// the customer's machine keep the real values.
import { defineManifest } from './manifest.js';
import { MODEL_PIN, writeWorklist, refusedTools, draftPair } from './kit.js';
import { memoryTools } from './memory.js';
import { sha256 } from './util.js';
import { str, num, isoDate, nameKey, personKey, displayName, cmp, round2, STATUS_RANK, sortedObject } from './restaurant.js';

export const FAIRTABLE_LIMITS = Object.freeze({
  files: 'Reads only the files you give it. It does not log in to a POS, scheduling, payroll, delivery-app, reservation, distributor, utility or bank system, and changes nothing in them.',
  settings: 'Targets, thresholds and state rules are settings in your own file, with working defaults; check them against your own policies, contracts and local rules before you rely on them.',
  advice: 'Not legal, tax, payroll, health-code, food-safety or accounting advice. A person decides what to pay, refund, change, file or send.',
  masking: 'Names, phone numbers and emails of staff and guests are masked in results returned to the AI model. The report and draft files written here keep the real values: keep them in a private folder.',
  estimate: 'Totals are arithmetic on the numbers in your files, not forecasts or appraisals.',
});

/** Refused tools most agents list, so a host model can see the line. */
export const REFUSE = Object.freeze({
  pos: { name: 'pos_change_menu', category: 'go_live', description: 'Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.' },
  pay: { name: 'payment_send', category: 'move_money', description: 'Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount.' },
  refund: { name: 'refund_issue', category: 'move_money', description: 'Never issues a refund or a credit to a guest or a card.' },
  payroll: { name: 'payroll_submit', category: 'move_money', description: 'Never submits or changes payroll, wages or tip payouts; your payroll person does.' },
  email: { name: 'email_send', category: 'binding_send', description: 'Never sends email or messages; a person sends the reviewed draft.' },
  tax: { name: 'tax_return_file', category: 'binding_send', description: 'Never files a tax return or makes a tax payment.' },
  order: { name: 'vendor_order_submit', category: 'binding_send', description: 'Never places or changes an order with a distributor.' },
  schedule: { name: 'schedule_publish', category: 'go_live', description: 'Never publishes or edits the staff schedule or timecards.' },
  platform: { name: 'delivery_platform_submit', category: 'binding_send', description: 'Never logs in to or submits anything on a delivery-app or reservation portal.' },
  ledger: { name: 'ledger_post', category: 'go_live', description: 'Never posts journal entries or changes the books.' },
});

const LIMIT_ARG = { type: 'integer', minimum: 1, maximum: 5000, description: 'Most items to return to the model (the report file always has all of them; default 100)' };
const STATUS_ARG = { type: 'string', enum: ['flag', 'review', 'watch', 'ok'], description: 'Only items with this status' };
const SETTINGS_ARG = { type: 'string', description: 'Optional settings JSON under --root (targets, thresholds, rules); anything left out uses the defaults listed in the result as settings_used' };

// ---------------------------------------------------------------- masking ----

const initials = (v) => { const s = displayName(v); const w = s.split(/\s+/).filter(Boolean); return w.length ? w.map((x) => x[0].toUpperCase()).join('.') + '.' : '?'; };
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A stable masked token for a personal value: "A.R.#3f9a2c" for a name, "email#..." or "phone#..." for contact details. */
export function maskToken(v) {
  const s = str(v);
  if (!s) return s;
  if (/@/.test(s)) return `email#${sha256(s.toLowerCase()).slice(0, 6)}`;
  if ((s.match(/\d/g) || []).length >= 6) return `phone#${sha256(s.replace(/\D/g, '')).slice(0, 6)}`;
  return `${initials(s)}#${sha256(personKey(s)).slice(0, 6)}`;
}

/** Collects personal values while files are read, then masks them in any result. */
class Masker {
  constructor() { this.values = new Map(); this.re = null; }
  add(v) {
    const s = str(v); if (s.length < 2) return;
    const tok = maskToken(s);
    for (const form of new Set([s, displayName(s)])) if (form.length >= 2 && !this.values.has(form)) { this.values.set(form, tok); this.re = null; }
  }
  /** The real values behind a token or a name, for lookups. */
  resolve(x) { const s = str(x); const hits = [...this.values.entries()].filter(([, t]) => t === s).map(([v]) => v); return hits.length ? hits : [s]; }
  apply(o) {
    if (!this.values.size) return o;
    if (!this.re) this.re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${[...this.values.keys()].sort((a, b) => b.length - a.length).map(escRe).join('|')})(?![\\p{L}\\p{N}])`, 'gu');
    const walk = (v) => {
      if (typeof v === 'string') return this.values.has(v) ? this.values.get(v) : v.replace(this.re, (m) => this.values.get(m) || m);
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
      return v;
    };
    return walk(o);
  }
}
const MASKERS = new WeakMap();
const maskerFor = (ctx) => { let m = MASKERS.get(ctx); if (!m) { m = new Masker(); MASKERS.set(ctx, m); } return m; };

// ----------------------------------------------------------------- reading ----

function project(row, fields) {
  const out = {};
  for (const [f, fd] of Object.entries(fields)) {
    let v = row[f];
    if (typeof v === 'string') v = v.trim();
    if (v === undefined || v === '') v = null;
    if (v !== null && fd && (fd.type === 'money' || fd.type === 'number')) { const n = num(v); v = n === null ? (typeof v === 'string' ? v : null) : n; }
    if (v !== null && fd && fd.type === 'date') v = isoDate(v) || v;
    out[f] = v;
  }
  return out;
}
const rowKey = (r, names) => names.map((f) => (r[f] === null || r[f] === undefined ? '' : typeof r[f] === 'number' ? String(r[f]) : String(r[f]))).join('\u0001');

function mergeSettings(defaults, given) {
  const out = { ...defaults };
  for (const [k, v] of Object.entries(given || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && defaults[k] && typeof defaults[k] === 'object' && !Array.isArray(defaults[k])) out[k] = { ...defaults[k], ...v };
    else out[k] = v;
  }
  return out;
}

// -------------------------------------------------------------------- kit ----

/**
 * cfg: {
 *   pkg, prefix, description,
 *   check: { title, description },
 *   args: { name: schema },                 file and option arguments shared by check, explain, report and draft
 *   required: [names],
 *   sources: { kind: { label, args: [argName], fields, profiles? } },
 *   settings: { schema, defaults } | null,  adds a `settings` JSON file argument
 *   run({ rows, settings, args, ctx }) -> { items: [{ ...fields, status, findings: [{ code, detail, amount? }] }], totals: { name: number }, extra?: {} }
 *   key: { arg, field, label, person? }      which item field the explain tool looks up
 *   summary(out) -> string,
 *   report: { title, base, row(item) -> {}, htmlColumns, sections(out) -> [{ title, rows, columns }], limits? },
 *   draft: { noun, verb, category, actor, title?, description, args, required, build(out, a, ctx) -> { id, to, text, amount? } } | null,
 *   refused: [{ name, category, description }],
 *   memory: { kind, description, effect, fields: { sourceKind: [field] } } | null,
 *   extraTools: [tool], extraRules: [rule],
 *   prompt: { name, title, text? }
 * }
 */
export function tableAgent(cfg) {
  const { pkg, prefix } = cfg;
  const OUT = `fairtable-out/${prefix}`;
  const sources = cfg.sources || {};
  const personalFields = Object.entries(sources).flatMap(([kind, s]) => Object.entries(s.fields).filter(([, fd]) => fd && fd.personal).map(([f]) => [kind, f]));
  const hasPersonal = personalFields.length > 0;
  const memKinds = cfg.memory ? { [cfg.memory.kind]: {
    description: cfg.memory.description,
    effect: cfg.memory.effect,
    schema: { type: 'object', additionalProperties: false, required: ['name', 'means'], properties: { name: { type: 'string', minLength: 2, maxLength: 120, description: 'The name as it appears in the file' }, means: { type: 'string', minLength: 2, maxLength: 120, description: 'The name it stands for' } } },
  } } : {};
  const MEMORY = memoryTools(prefix, memKinds);
  const args = { ...cfg.args, ...(cfg.settings ? { settings: SETTINGS_ARG } : {}) };

  function load(a, ctx) {
    const masker = maskerFor(ctx);
    const rows = {}; const used = []; const skipped = [];
    const facts = cfg.memory && typeof ctx.memoryFacts === 'function' ? ctx.memoryFacts(cfg.memory.kind) : [];
    for (const [kind, s] of Object.entries(sources)) {
      const arg = (s.args || []).find((x) => a[x] !== undefined && a[x] !== null && a[x] !== '');
      if (!arg) { rows[kind] = []; continue; }
      const names = Object.keys(s.fields);
      let list = ctx.records(a[arg], kind).map((r) => project(r, s.fields)).filter((r) => names.some((f) => r[f] !== null));
      for (const [k, f] of personalFields) if (k === kind) for (const r of list) if (r[f]) masker.add(r[f]);
      if (cfg.memory && cfg.memory.fields && cfg.memory.fields[kind]) {
        for (const fact of facts) {
          const want = nameKey(fact.value.name); let hit = 0;
          for (const r of list) for (const f of cfg.memory.fields[kind]) if (r[f] && nameKey(r[f]) === want) { r[f] = fact.value.means; hit++; }
          if (hit && !used.some((u) => u.id === fact.id)) used.push({ id: fact.id, kind: fact.kind, value: fact.value });
        }
      }
      list = list.map((r) => ({ r, k: rowKey(r, names) })).sort((x, y) => cmp(x.k, y.k)).map((x) => x.r);
      rows[kind] = list;
    }
    for (const fact of facts) if (!used.some((u) => u.id === fact.id)) skipped.push({ id: fact.id, kind: fact.kind, value: fact.value, why: 'no row in these files has that name' });
    let settings = cfg.settings ? { ...cfg.settings.defaults } : {};
    if (cfg.settings && a.settings) settings = mergeSettings(cfg.settings.defaults, ctx.readJson(a.settings, 'settings'));
    const out = cfg.run({ rows, settings, args: a, ctx });
    out.items = (out.items || []).map((i) => ({ ...i, findings: (i.findings || []).map((f) => ({ code: f.code, detail: f.detail, amount: f.amount === undefined ? null : f.amount })) }))
      .sort((x, y) => (STATUS_RANK[x.status] ?? 3) - (STATUS_RANK[y.status] ?? 3) || cmp(itemLabel(x), itemLabel(y)));
    const byFinding = {};
    for (const i of out.items) for (const f of i.findings) { const b = byFinding[f.code] || (byFinding[f.code] = { count: 0, amount: 0 }); b.count++; if (typeof f.amount === 'number') b.amount = round2(b.amount + f.amount); }
    out.by_finding = sortedObject(byFinding);
    out.settings_used = settings;
    out.learned = { used, skipped };
    return out;
  }
  const itemLabel = (i) => str(i[cfg.key.field]) + '\u0001' + str(i.sub || '');
  const wrap = (h) => async (a, ctx) => { const r = await h(a, ctx); return maskerFor(ctx).apply(r); };
  const counts = (items) => { const c = { flag: 0, review: 0, watch: 0, ok: 0 }; for (const i of items) c[i.status] = (c[i.status] || 0) + 1; return c; };

  const checkName = `${prefix}_check`;
  const tools = [
    {
      name: checkName, kind: 'read', title: cfg.check.title, description: cfg.check.description,
      inputSchema: { type: 'object', additionalProperties: false, required: cfg.required || [], properties: { ...args, status: STATUS_ARG, limit: LIMIT_ARG } },
      handler: wrap(async (a, ctx) => {
        const o = load(a, ctx);
        const list = a.status ? o.items.filter((i) => i.status === a.status) : o.items;
        const lim = a.limit || 100;
        return {
          summary: cfg.summary(o) + (o.learned.used.length ? ` ${o.learned.used.length} learned fact(s) used.` : ''),
          ...o.totals, ...counts(o.items), items_total: o.items.length,
          items: list.slice(0, lim), items_shown: Math.min(lim, list.length),
          by_finding: o.by_finding, ...(o.extra || {}), settings_used: o.settings_used,
          ...(o.learned.used.length || o.learned.skipped.length ? { learned_facts: o.learned } : {}),
        };
      }),
    },
    {
      name: `${prefix}_explain`, kind: 'read', title: `Explain one ${cfg.key.label}`,
      description: `Show one ${cfg.key.label} from ${checkName} with every finding, the numbers behind it and the setting it was checked against.`,
      inputSchema: { type: 'object', additionalProperties: false, required: [...(cfg.required || []), cfg.key.arg], properties: { ...args, [cfg.key.arg]: { type: 'string', description: `The ${cfg.key.label} as ${checkName} shows it${hasPersonal && cfg.key.person ? ' (the masked name is accepted)' : ''}` } } },
      handler: wrap(async (a, ctx) => {
        const o = load(a, ctx);
        const keyOf = cfg.key.person ? personKey : nameKey;
        const wanted = new Set(maskerFor(ctx).resolve(a[cfg.key.arg]).map(keyOf));
        const hits = o.items.filter((i) => wanted.has(keyOf(i[cfg.key.field])));
        if (!hits.length) throw new Error(`${cfg.key.label} "${str(a[cfg.key.arg]).slice(0, 80)}" not found; pass one from ${checkName}`);
        const i = hits[0];
        return { summary: `${str(i[cfg.key.field])}${i.sub ? ` (${i.sub})` : ''}: ${i.status}. ${i.findings.map((f) => f.detail).join(' ') || 'No findings.'}`.trim(), item: i, ...(hits.length > 1 ? { more: hits.slice(1) } : {}), settings_used: o.settings_used };
      }),
    },
    {
      name: `${prefix}_write_report`, kind: 'report', title: `Write the ${cfg.report.title.toLowerCase()} report`,
      description: `Write ${cfg.report.base}.csv (one row per item, with blank owner and decision columns) and ${cfg.report.base}.html into out_dir (default ${OUT}).`,
      inputSchema: { type: 'object', additionalProperties: false, required: cfg.required || [], properties: { ...args, out_dir: { type: 'string', description: `Output folder under --root (default ${OUT})` } } },
      handler: wrap(async (a, ctx) => {
        const o = load(a, ctx);
        const rows = o.items.map((i) => ({ ...cfg.report.row(i), status: i.status, findings: i.findings.map((f) => f.code).join(' '), reasons: i.findings.map((f) => f.detail).join(' '), owner: '', decision: '' }));
        const sections = [...(cfg.report.sections ? cfg.report.sections(o) : []), { title: 'By finding', rows: Object.entries(o.by_finding).map(([code, v]) => ({ code, ...v })), columns: ['code', 'count', 'amount'] }];
        const w = writeWorklist(ctx, a.out_dir || OUT, cfg.report.base, {
          title: cfg.report.title, intro: cfg.summary(o), rows,
          columns: rows.length ? Object.keys(rows[0]) : [...Object.keys(cfg.report.row({ findings: [] })), 'status', 'findings', 'reasons', 'owner', 'decision'],
          htmlColumns: [...cfg.report.htmlColumns, 'status', 'reasons'], sections,
          limits: [...(cfg.report.limits || [FAIRTABLE_LIMITS.files, FAIRTABLE_LIMITS.settings, FAIRTABLE_LIMITS.advice]), ...(hasPersonal ? [FAIRTABLE_LIMITS.masking] : [])],
        });
        return { summary: `${cfg.report.title} written: ${cfg.summary(o)}`, files: w.files.map((f) => f.split('\\').join('/').replace(`${ctx.root.split('\\').join('/')}/`, '')), output_sha256: w.output_sha256 };
      }),
    },
  ];
  let pair = { tools: [], rules: [] };
  if (cfg.draft) {
    const d = cfg.draft;
    pair = draftPair({
      prefix, noun: d.noun, verb: d.verb || 'send', category: d.category || 'binding_send', outDir: OUT, actor: d.actor || 'a manager', title: d.title,
      description: d.description, required: d.required || cfg.required || [], args: { ...args, ...(d.args || {}) },
      build: async (a, ctx) => d.build(load(a, ctx), a, ctx),
    });
    pair.tools[0].handler = wrap(pair.tools[0].handler);
  }
  const refused = refusedTools(cfg.refused || []);
  const names = (cfg.refused || []).map((r) => r.name).join(', ');
  const promptText = cfg.prompt && cfg.prompt.text ? cfg.prompt.text : `You are helping a restaurant owner or manager with ${pkg.name}. ${cfg.check.description}

0. Call ${prefix}_recall to see what this agent has learned about the restaurant's names. If the person says a name in a file means another name, call ${prefix}_learn; it waits for a named person to accept it (${prefix}_accept_learning always asks). Amounts, targets and rules are never learned; they live in the settings file.

Rules: this agent never pays, refunds, changes the POS, publishes schedules, files taxes or sends anything. ${names ? `${names} are refused; do not call them.` : ''} Findings compare the restaurant's own files with its own settings; they are not legal, tax or health-code rulings.${hasPersonal ? ' Staff and guest names come back masked (for example A.R.#3f9a2c); the files written on the computer keep the real names.' : ''}

1. Call ${checkName}. Report the totals, how many items are flagged or need review, and the top finding codes. Say which settings were used.
2. For flagged items, call ${prefix}_explain and say what the numbers show and what data is missing for items marked review.
3. Call ${prefix}_write_report and share the CSV and HTML paths; the CSV has blank owner and decision columns for the team.${cfg.draft ? `
4. Offer ${prefix}_draft_${cfg.draft.noun}. Show the draft path and any [TO CONFIRM] markers for the person to fill.
5. Only when the person asks, call ${prefix}_request_${cfg.draft.verb || 'send'} for a reviewed draft. It returns needs_approval: show the approval id and wait for a named person.` : ''}`;
  return defineManifest({
    name: pkg.name, version: pkg.version, description: cfg.description, model: MODEL_PIN,
    caps: { maxSteps: 60, maxSpendUsd: 0 },
    configSchemas: cfg.settings ? { settings: cfg.settings.schema } : {},
    memory: { prefix, kinds: memKinds },
    sources: Object.fromEntries(Object.entries(sources).map(([k, s]) => [k, { label: s.label, args: s.args, fields: s.fields, ...(s.profiles ? { profiles: s.profiles } : {}) }])),
    argDocs: cfg.argDocs || {},
    prompts: [{
      name: (cfg.prompt && cfg.prompt.name) || `${prefix}_review`, title: (cfg.prompt && cfg.prompt.title) || cfg.check.title,
      description: `Walks the host model through ${pkg.name}: check, explain, report${cfg.draft ? ', a draft and an approval that waits for a person' : ''}.`,
      arguments: (cfg.required || []).map((r) => ({ name: r, description: (args[r] && args[r].description) || r, required: true })),
      text: promptText,
    }],
    tools: [...tools, ...pair.tools, ...(cfg.extraTools || []), ...MEMORY.tools, ...refused.tools],
    policy: { rules: [
      { tool: checkName, decision: 'allow' },
      { tool: `${prefix}_explain`, decision: 'allow' },
      { tool: `${prefix}_write_report`, decision: 'allow' },
      ...pair.rules,
      ...(cfg.extraRules || []),
      ...MEMORY.rules,
      ...refused.rules,
      { tool: '*', decision: 'block', reason: `Not on the ${pkg.name} allowlist.` },
    ] },
  });
}

// ------------------------------------------------------------ small helpers ----

/** A finding. amount is money the finding is about (or null). */
export const finding = (code, detail, amount = null) => ({ code, detail, amount: amount === null || amount === undefined ? null : round2(amount) });

/** Item status from its findings: the worst status of { code: status } for the codes present, else ok. */
export function statusOf(findings, levels) {
  let s = 'ok';
  for (const f of findings) { const l = levels[f.code] || 'review'; if ((STATUS_RANK[l] ?? 3) < (STATUS_RANK[s] ?? 3)) s = l; }
  return s;
}

/** Money as text for summaries: 1234.5 gives "1,234.50". */
export const money = (n) => (n === null || n === undefined || !Number.isFinite(Number(n)) ? 'n/a' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
/** A percentage as text: "31.4%" or "n/a". */
export const pctText = (n) => (n === null || n === undefined || !Number.isFinite(Number(n)) ? 'n/a' : `${n}%`);

/** Draft text helpers: a heading block with To/From lines and a table of rows. */
export function letter({ title, to, from, re, intro, rows = [], columns = [], closing = [] }) {
  const L = [`# ${title}`, '', `**To:** ${to || '[TO CONFIRM: who receives this]'}`, `**From:** ${from || '[TO CONFIRM: your name and role]'}`, ...(re ? [`**Re:** ${re}`] : []), '', intro, ''];
  if (rows.length) {
    L.push(`| ${columns.map((c) => c.replace(/_/g, ' ')).join(' | ')} |`, `|${columns.map(() => '---').join('|')}|`);
    for (const r of rows) L.push(`| ${columns.map((c) => String(r[c] ?? '').replace(/\|/g, '/')).join(' | ')} |`);
    L.push('');
  }
  L.push(...closing);
  return L.join('\n');
}
