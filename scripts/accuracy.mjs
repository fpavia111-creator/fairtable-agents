#!/usr/bin/env node
// Accuracy on the fictional fixtures, per agent and for the family:
//   1. planted set: the demo fixtures. Recall = planted (item, finding) pairs found / planted pairs
//      listed in scripts/accuracy-specs.mjs (taken from each fixtures/README.md). Any other finding
//      is listed as unplanned.
//   2. clean set: the same files with every planted problem removed (fixtures/clean/). Every
//      finding there is a false positive.
//   3. mutation cases: one edit to the clean set that must raise one named finding.
//
//   node scripts/accuracy.mjs --write [agent ...]   regenerate fixtures/clean/ from the specs, then measure
//   node scripts/accuracy.mjs [agent ...]           measure (exit 1 when a clean set is stale or a number is off)
//   node scripts/accuracy.mjs --record              also write docs/accuracy-<date>.json and .md
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, parseCsvRows } from '../packages/fairtable-core/src/index.js';
import { maskToken } from '../packages/fairtable-core/src/table-kit.js';
import { SPECS } from './accuracy-specs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages');
const argv = process.argv.slice(2);
const write = argv.includes('--write'); const record = argv.includes('--record');
const only = argv.filter((a) => !a.startsWith('--'));
const DATE = '2026-11-19';

// ------------------------------------------------------------------ tables ----
const readTable = (file) => { const rows = parseCsvRows(readFileSync(file, 'utf8')).filter((r) => r.some((c) => String(c).trim() !== '')); const head = rows[0]; return { head, rows: rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? '']))) }; };
const cell = (v) => { const s = String(v ?? ''); return /[",\n\r]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const tableText = (t) => [t.head.map(cell).join(','), ...t.rows.map((r) => t.head.map((h) => cell(r[h])).join(','))].join('\n') + '\n';
const hits = (r, where) => Object.entries(where).every(([k, v]) => String(r[k] ?? '').trim() === String(v));
function apply(tables, op, label) {
  const [kind, file] = op; const t = tables[file];
  if (!t) throw new Error(`${label}: no file ${file}`);
  if (kind === 'add') { t.rows.push(Object.fromEntries(t.head.map((h) => [h, op[2][h] ?? '']))); return; }
  const idx = t.rows.map((r, i) => (hits(r, op[2]) ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) throw new Error(`${label}: ${JSON.stringify(op[2])} matches no row of ${file}`);
  if (kind === 'drop') t.rows = t.rows.filter((_, i) => !idx.includes(i));
  else if (kind === 'dropLast') t.rows.splice(idx.at(-1), 1);
  else if (kind === 'set') for (const i of idx) for (const [k, v] of Object.entries(op[3])) {
    if (!t.head.includes(k)) throw new Error(`${label}: ${file} has no column ${k}`);
    t.rows[i][k] = v && typeof v === 'object' && v.replace ? String(t.rows[i][k]).replace(new RegExp(v.replace[0]), v.replace[1]) : v;
  } else throw new Error(`${label}: unknown edit ${kind}`);
}

// ------------------------------------------------------------------ checks ----
async function runCheck(manifest, prefix, files, dir, tables) {
  const root = mkdtempSync(join(tmpdir(), 'acc-'));
  try {
    cpSync(dir, root, { recursive: true, filter: (p) => !/[\\/](clean|intl)$/.test(p) });
    for (const [f, t] of Object.entries(tables || {})) writeFileSync(join(root, f), tableText(t));
    const r = await new AgentRuntime(manifest, { root, audit: false, memory: false }).call(`${prefix}_check`, { ...files, limit: 5000 });
    if (r.status !== 'executed') throw new Error(`${prefix}_check: ${r.status} ${r.error || ''}`);
    return r.result.items;
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const keyOf = (i) => String(Object.values(i)[0] ?? '');
function matcher(spec) {
  const [name, sub] = spec.split(' @ ');
  return (i) => (keyOf(i) === name || keyOf(i) === maskToken(name)) && (sub === undefined || String(i.sub ?? '') === sub);
}
const pairs = (items) => items.flatMap((i) => i.findings.map((f) => ({ item: keyOf(i), sub: i.sub, code: f.code })));

const results = []; let problems = 0;
const agents = readdirSync(PK).filter((n) => /^fairtable-(?!core$)/.test(n) && (!only.length || only.includes(n))).sort();
for (const n of agents) {
  const spec = SPECS[n];
  if (!spec) { console.log(`${n}: NO SPEC`); problems++; continue; }
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const { DEMO } = await import(pathToFileURL(join(PK, n, 'src', 'manifest.js')).href);
  const prefix = manifest.tools[0].name.replace(/_check$/, '');
  const dir = join(PK, n, 'fixtures');
  const csvs = Object.values(DEMO.files).filter((f) => /\.csv$/i.test(f));
  const r = { agent: n, planted_total: 0, planted_found: 0, missed: [], unplanned: [], clean_rows: null, clean_findings: null, clean_note: spec.clean_note || null, mutation_cases: spec.mutations.length, mutation_caught: 0, mutation_missed: [], mutation_side_findings: 0 };

  // 1. planted set
  const demo = await runCheck(manifest, prefix, DEMO.files, dir);
  const claimed = new Set();
  for (const [key, codes] of Object.entries(spec.planted)) {
    const m = matcher(key); const items = demo.filter(m);
    for (const c of codes) {
      r.planted_total++;
      const it = items.find((i) => i.findings.some((f) => f.code === c));
      if (it) { r.planted_found++; claimed.add(`${keyOf(it)}\u0001${it.sub ?? ''}\u0001${c}`); } else r.missed.push(`${key}: ${c}`);
    }
  }
  r.unplanned = pairs(demo).filter((p) => !claimed.has(`${p.item}\u0001${p.sub ?? ''}\u0001${p.code}`)).map((p) => `${p.item}${p.sub ? ` @ ${p.sub}` : ''}: ${p.code}`);

  // 2. clean set
  let clean = null;
  if (spec.clean) {
    clean = Object.fromEntries(csvs.map((f) => [f, readTable(join(dir, f))]));
    for (const op of spec.clean) apply(clean, op, `${n} clean`);
    const cdir = join(dir, 'clean');
    for (const [f, t] of Object.entries(clean)) {
      const want = tableText(t); const p = join(cdir, f);
      if (write) { mkdirSync(cdir, { recursive: true }); writeFileSync(p, want); }
      else if (!existsSync(p) || readFileSync(p, 'utf8') !== want) { console.log(`${n}: fixtures/clean/${f} is out of date (run with --write)`); problems++; }
    }
    if (write) writeFileSync(join(cdir, 'README.md'), `# Clean set\n\nThe demo files with every planted problem in [../README.md](../README.md) removed and nothing else changed, made by \`scripts/accuracy.mjs\` from \`scripts/accuracy-specs.mjs\` in the repository. The check must report no findings on these files (settings: \`../settings.json\`). Fictional data.\n`);
    r.clean_rows = Object.values(clean).reduce((t, x) => t + x.rows.length, 0);
    const items = await runCheck(manifest, prefix, DEMO.files, dir, clean);
    r.clean_findings = pairs(items).map((p) => `${p.item}${p.sub ? ` @ ${p.sub}` : ''}: ${p.code}`);
  }

  // 3. mutation cases (on the clean set; on the demo files where there is no clean set)
  for (const m of spec.mutations) {
    const base = clean || Object.fromEntries(csvs.map((f) => [f, readTable(join(dir, f))]));
    const tables = JSON.parse(JSON.stringify(base));
    apply(tables, m.op, `${n} mutation ${m.id}`);
    const items = await runCheck(manifest, prefix, DEMO.files, dir, tables);
    const hit = items.filter(matcher(m.expect[0])).some((i) => i.findings.some((f) => f.code === m.expect[1]));
    if (hit) r.mutation_caught++; else r.mutation_missed.push(`${m.id}: expected ${m.expect[0]}: ${m.expect[1]}`);
    if (clean) r.mutation_side_findings += items.reduce((t, i) => t + i.findings.filter((f) => !(matcher(m.expect[0])(i) && f.code === m.expect[1])).length, 0);
  }

  const ok = r.planted_found === r.planted_total && !r.unplanned.length && (r.clean_findings === null || !r.clean_findings.length) && r.mutation_caught === r.mutation_cases;
  if (!ok) problems++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: planted ${r.planted_found}/${r.planted_total}, unplanned ${r.unplanned.length}, clean ${r.clean_findings === null ? 'n/a' : `${r.clean_findings.length} finding(s) on ${r.clean_rows} rows`}, mutations ${r.mutation_caught}/${r.mutation_cases}`);
  for (const x of r.missed) console.log(`       missed      ${x}`);
  for (const x of r.unplanned) console.log(`       unplanned   ${x}`);
  for (const x of r.clean_findings || []) console.log(`       clean FP    ${x}`);
  for (const x of r.mutation_missed) console.log(`       not caught  ${x}`);
  results.push(r);
}

const sum = (k) => results.reduce((t, r) => t + (r[k] || 0), 0);
const fam = {
  date: DATE, agents: results.length,
  planted_total: sum('planted_total'), planted_found: sum('planted_found'), unplanned: results.reduce((t, r) => t + r.unplanned.length, 0),
  clean_agents: results.filter((r) => r.clean_findings !== null).length, clean_rows: sum('clean_rows'), clean_false_positives: results.reduce((t, r) => t + (r.clean_findings ? r.clean_findings.length : 0), 0),
  mutation_cases: sum('mutation_cases'), mutation_caught: sum('mutation_caught'),
};
console.log(`\n${fam.agents} agent(s): planted ${fam.planted_found}/${fam.planted_total} found, ${fam.unplanned} unplanned finding(s); clean set ${fam.clean_false_positives} false positive(s) on ${fam.clean_rows} rows (${fam.clean_agents} agents); mutations ${fam.mutation_caught}/${fam.mutation_cases} caught.`);

if (record) {
  mkdirSync(join(ROOT, 'docs'), { recursive: true });
  writeFileSync(join(ROOT, 'docs', `accuracy-${DATE}.json`), JSON.stringify({ family: fam, agents: results }, null, 2) + '\n');
  const L = [`# Accuracy on the fictional fixtures (${DATE})`, '', 'Made by `node scripts/accuracy.mjs --record`. Planted problems are the ones each `fixtures/README.md` lists; the clean set is `fixtures/clean/` (the same files with those problems removed); a mutation case changes one field of the clean set and expects one named finding. All data is fictional: these numbers say the rules do what they are written to do on data built to test them, not how they will do on a real restaurant\'s exports.', '',
    `**Family:** ${fam.planted_found} of ${fam.planted_total} planted problems found, ${fam.unplanned} unplanned findings on the planted set, ${fam.clean_false_positives} findings on ${fam.clean_rows} clean rows (${fam.clean_agents} of ${fam.agents} agents have a clean set), ${fam.mutation_caught} of ${fam.mutation_cases} mutation cases caught.`, '',
    '| Agent | Planted found | Unplanned | Clean rows | Findings on clean | Mutations caught |', '|---|---|---|---|---|---|',
    ...results.map((r) => `| ${r.agent} | ${r.planted_found}/${r.planted_total} | ${r.unplanned.length} | ${r.clean_rows ?? 'n/a'} | ${r.clean_findings === null ? 'n/a' : r.clean_findings.length} | ${r.mutation_caught}/${r.mutation_cases} |`), ''];
  for (const r of results.filter((x) => x.clean_note)) L.push(`- ${r.agent}: ${r.clean_note}`);
  writeFileSync(join(ROOT, 'docs', `accuracy-${DATE}.md`), L.join('\n') + '\n');
  console.log(`Wrote docs/accuracy-${DATE}.json and .md`);
}
process.exit(problems ? 1 : 0);
