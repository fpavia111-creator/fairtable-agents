#!/usr/bin/env node
// Real public data, in its published format, through the agents. Nothing private is used.
// Downloads go to _realdata/ (git-ignored); only this script and the results are committed.
//
//   node scripts/realdata.mjs --download     fetch the public files (needs the network)
//   node scripts/realdata.mjs                convert, run the agents, check them, write docs/realdata-<date>.md
//
// Sources
//   1. New York City Department of Health and Mental Hygiene, "DOHMH New York City Restaurant
//      Inspection Results" (NYC Open Data 43nn-pn8j), one ZIP code, inspections since 2024-01-01.
//      Published one row per violation; converted to one row per inspection for
//      fairtable-health-inspections.
//   2. U.S. Bureau of Labor Statistics average retail prices (CPI average price data, U.S. city
//      average), monthly, as published on FRED (Federal Reserve Bank of St. Louis). Each month is
//      written as one invoice line from one "vendor" for fairtable-price-creep.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, parseCsv } from '../packages/fairtable-core/src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RD = join(ROOT, '_realdata');
const DATE = '2026-11-19';
const UA = { 'User-Agent': 'fairtable-agents real-data test (open source; github.com/fpavia111-creator/fairtable-agents)' };

const NYC_ZIP = '10003';
const NYC_URL = `https://data.cityofnewyork.us/resource/43nn-pn8j.csv?${new URLSearchParams({ $where: `zipcode='${NYC_ZIP}' AND inspection_date>='2024-01-01T00:00:00'`, $order: 'camis,inspection_date', $limit: '50000' })}`;
const SERIES = [
  ['APU0000708111', 'Eggs, grade A, large', '1/1 DZ'],
  ['APU0000703112', 'Ground beef, 100% beef', '1/1 LB'],
  ['APU0000FF1101', 'Chicken breast, boneless', '1/1 LB'],
  ['APU0000710212', 'Cheddar cheese, natural', '1/1 LB'],
  ['APU0000711211', 'Bananas', '1/1 LB'],
  ['APU0000712311', 'Tomatoes, field grown', '1/1 LB'],
  ['APU0000717311', 'Coffee, 100%, ground roast', '1/1 LB'],
  ['APU0000702111', 'Bread, white, pan', '1/1 LB'],
];
const fredUrl = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;

async function get(url, file) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(90000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      writeFileSync(file, Buffer.from(await r.arrayBuffer())); return;
    } catch (e) { if (i === 3) throw new Error(`${url}: ${e.message}`); }
  }
}

if (process.argv.includes('--download')) {
  mkdirSync(join(RD, 'raw'), { recursive: true });
  await get(NYC_URL, join(RD, 'raw', `nyc-inspections-${NYC_ZIP}.csv`));
  for (const [id] of SERIES) await get(fredUrl(id), join(RD, 'raw', `fred-${id}.csv`));
  writeFileSync(join(RD, 'raw', 'downloaded.json'), JSON.stringify({ date: new Date().toISOString(), nyc: NYC_URL, fred: SERIES.map(([id]) => fredUrl(id)) }, null, 2));
  console.log(`Downloaded to ${RD}`);
}
if (!existsSync(join(RD, 'raw', 'downloaded.json'))) { console.error('Run with --download first.'); process.exit(1); }
const downloaded = JSON.parse(readFileSync(join(RD, 'raw', 'downloaded.json'), 'utf8'));

async function run(agent, args, root) {
  const { manifest } = await import(pathToFileURL(join(ROOT, 'packages', agent, 'src', 'index.js')).href);
  const p = manifest.tools[0].name.replace(/_check$/, '');
  const r = await new AgentRuntime(manifest, { root, audit: false, memory: false }).call(`${p}_check`, { ...args, limit: 5000 });
  if (r.status !== 'executed') throw new Error(`${agent}: ${r.status} ${r.error || ''}`);
  return r.result;
}
const work = join(RD, 'work'); rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true });
const report = { date: DATE, downloaded: downloaded.date, sources: [] };
const count = (items) => { const c = {}; for (const i of items) for (const f of i.findings) c[f.code] = (c[f.code] || 0) + 1; return c; };

// ------------------------------------------------- 1. NYC restaurant inspections ----
{
  const raw = parseCsv(readFileSync(join(RD, 'raw', `nyc-inspections-${NYC_ZIP}.csv`), 'utf8'));
  const groups = new Map();
  for (const r of raw) {
    const d = String(r.inspection_date || '').slice(0, 10);
    if (!d || d < '2000-01-01') continue; // 1900-01-01 = not inspected yet
    const k = `${r.camis}|${d}|${r.inspection_type}`;
    if (!groups.has(k)) groups.set(k, { location: `${String(r.dba || '').trim()} (${r.camis})`, date: d, type: r.inspection_type, score: r.score, critical_violations: 0, violations: 0, reinspection_due: '', camis: r.camis });
    const g = groups.get(k);
    if (String(r.violation_code || '').trim()) g.violations++;
    if (/^critical$/i.test(String(r.critical_flag || '').trim())) g.critical_violations++;
    if (r.score !== '' && (g.score === '' || g.score === undefined)) g.score = r.score;
  }
  const rows = [...groups.values()];
  const head = ['location', 'date', 'type', 'score', 'critical_violations', 'violations', 'reinspection_due'];
  const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
  writeFileSync(join(work, 'inspections.csv'), [head.join(','), ...rows.map((r) => head.map((h) => q(r[h])).join(','))].join('\n') + '\n');
  const asOf = '2026-11-18';
  const nycSettings = { as_of: asOf, routine_interval_days: 365, routine_warn_days: 45, score_drop_points: 5, lower_score_is_better: true, followup_score: 14 };
  writeFileSync(join(work, 'nyc-settings.json'), JSON.stringify(nycSettings));
  writeFileSync(join(work, 'old-settings.json'), JSON.stringify({ as_of: asOf, routine_interval_days: 365, routine_warn_days: 45, score_drop_points: 5, lower_score_is_better: false, routine_words: ['routine'] }));
  const now = await run('fairtable-health-inspections', { inspections: 'inspections.csv', settings: 'nyc-settings.json' }, work);
  const before = await run('fairtable-health-inspections', { inspections: 'inspections.csv', settings: 'old-settings.json' }, work);
  const locs = now.items.filter((i) => i.kind === 'inspections');

  // Independent re-check of each finding from the converted rows.
  const byLoc = new Map(); for (const r of rows) { if (!byLoc.has(r.location)) byLoc.set(r.location, []); byLoc.get(r.location).push(r); }
  const k3 = (r) => `${r.date}|${r.type}|${r.score}`; for (const l of byLoc.values()) l.sort((a, b) => (k3(a) < k3(b) ? -1 : k3(a) > k3(b) ? 1 : 0));
  let checked = 0, wrong = 0; const wrongList = []; let critA = 0, critOther = 0;
  for (const it of locs) {
    const list = byLoc.get(it.location) || []; const last = list.at(-1);
    const scored = list.filter((r) => r.score !== '' && r.score !== undefined);
    const expect = new Set();
    const lastDate = last ? last.date : null; if (list.some((r) => r.date === lastDate && r.critical_violations > 0 && r.score !== '' && Number(r.score) >= 14)) expect.add('critical_open');
    if (scored.length >= 2 && Number(scored.at(-1).score) - Number(scored.at(-2).score) >= 5) expect.add('score_drop');
    const routine = list.filter((r) => /initial inspection/i.test(r.type) && !/re-?inspection/i.test(r.type)).at(-1);
    if (routine) { const next = new Date(Date.parse(routine.date) + 365 * 864e5).toISOString().slice(0, 10); if ((Date.parse(next) - Date.parse(asOf)) / 864e5 <= 45) expect.add('routine_due'); }
    const got = new Set(it.findings.map((f) => f.code));
    for (const c of new Set([...expect, ...got])) { checked++; if (expect.has(c) !== got.has(c)) { wrong++; wrongList.push(`${it.location}: ${c} ${got.has(c) ? 'reported, not expected' : 'expected, not reported'}`); } }
    if (before.items.find((x) => x.item === it.item)?.findings.some((f) => f.code === 'critical_open')) { if (/initial inspection/i.test(last.type) && !/re-?inspection/i.test(last.type) && Number(last.score) <= 13) critA++; else critOther++; }
  }
  // Backtest of routine_due: as of the same day a year earlier, with only the inspections before it.
  const btAsOf = '2025-11-18'; const btEnd90 = '2026-02-16'; const btEnd45 = '2026-01-02';
  const head2 = head; writeFileSync(join(work, 'inspections-before.csv'), [head2.join(','), ...rows.filter((r) => r.date < btAsOf).map((r) => head2.map((h) => q(r[h])).join(','))].join('\n') + '\n');
  writeFileSync(join(work, 'bt-settings.json'), JSON.stringify({ ...nycSettings, as_of: btAsOf }));
  const bt = await run('fairtable-health-inspections', { inspections: 'inspections-before.csv', settings: 'bt-settings.json' }, work);
  const isRoutine = (r) => /initial inspection/i.test(r.type) && !/re-?inspection/i.test(r.type);
  const inspectedBy = (end) => new Set(rows.filter((r) => r.date >= btAsOf && r.date <= end && isRoutine(r)).map((r) => r.location));
  const known = new Set(rows.filter((r) => r.date < btAsOf).map((r) => r.location));
  const flagged = new Set(bt.items.filter((i) => i.kind === 'inspections' && i.findings.some((f) => f.code === 'routine_due')).map((i) => i.location));
  const in90 = inspectedBy(btEnd90), in45 = inspectedBy(btEnd45);
  const hit90 = [...flagged].filter((l) => in90.has(l)).length; const base90 = [...known].filter((l) => in90.has(l)).length;
  const due45 = [...known].filter((l) => in45.has(l)); const caught45 = due45.filter((l) => flagged.has(l)).length;
  const backtest = { as_of: btAsOf, restaurants_with_history: known.size, flagged_routine_due: flagged.size, flagged_inspected_within_90_days: hit90, all_inspected_within_90_days: base90, inspected_within_45_days: due45.length, of_those_flagged_beforehand: caught45 };
  console.log(`NYC backtest as of ${btAsOf}: ${flagged.size} of ${known.size} restaurants flagged routine_due; ${hit90} of them had a routine inspection within 90 days (all restaurants: ${base90} of ${known.size}); of ${due45.length} inspected within 45 days, ${caught45} had been flagged`);
  report.sources.push({
    name: 'NYC DOHMH Restaurant Inspection Results', agent: 'fairtable-health-inspections', url: 'https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j', query: downloaded.nyc,
    licence: 'NYC Open Data, public; NYC Open Data terms of use (no restrictions on use, no warranty)', format: 'CSV, one row per violation (Socrata export), converted to one row per inspection by this script',
    rows_downloaded: raw.length, inspections: rows.length, restaurants: byLoc.size, settings: nycSettings,
    findings_now: count(now.items), findings_before_fix: count(before.items), recheck: { pairs_checked: checked, disagreements: wrong, examples: wrongList.slice(0, 10) },
    critical_open_before_fix_after_a_grade_initial: critA, critical_open_before_fix_other: critOther, routine_due_backtest: backtest,
  });
  console.log(`NYC ${NYC_ZIP}: ${raw.length} rows -> ${rows.length} inspections at ${byLoc.size} restaurants; now ${JSON.stringify(count(now.items))}; before the fix ${JSON.stringify(count(before.items))}; re-check ${wrong} disagreement(s) in ${checked}; before the fix critical_open after an A-grade initial inspection ${critA}, other ${critOther}`);
}

// ------------------------------------------------- 2. BLS average prices (FRED) ----
{
  const lines = []; const truth = {};
  for (const [id, label, pack] of SERIES) {
    const obs = parseCsv(readFileSync(join(RD, 'raw', `fred-${id}.csv`), 'utf8')).map((r) => ({ date: String(r.observation_date || r.DATE || '').slice(0, 10), v: Number(r[id]) })).filter((o) => o.date && Number.isFinite(o.v) && o.v > 0);
    const last13 = obs.slice(-13);
    for (const o of last13) lines.push({ vendor: 'BLS average price, U.S. city average', invoice_number: `BLS-${o.date}`, invoice_date: o.date, item_code: id, item: label, pack, qty: 20, unit_price: o.v.toFixed(3), extended: (o.v * 20).toFixed(2) });
    let run = 0, maxRun = 0, runStart = 0, extra = 0;
    for (let i = 1; i < last13.length; i++) { const d = last13[i].v - last13[i - 1].v; if (d > 1e-9) { if (!run) runStart = i - 1; run++; maxRun = Math.max(maxRun, run); } else if (d < -1e-9) run = 0; extra += Math.max(0, last13[i].v - last13[0].v) * 20; }
    const change = Math.round(((last13.at(-1).v - last13[0].v) / last13[0].v) * 1000) / 10;
    truth[label] = { from: last13[0].date, to: last13.at(-1).date, first: last13[0].v, last: last13.at(-1).v, change_pct: change, max_rises_in_a_row: maxRun, expect: [...(change >= 5 ? [extra >= 25 ? 'price_up' : 'small_price_up'] : []), ...(run >= 3 && ((last13.at(-1).v - last13[runStart].v) / last13[runStart].v) * 100 >= 5 ? ['steady_creep'] : [])], old_rule_steady_creep: maxRun >= 3 };
  }
  const head = Object.keys(lines[0]);
  writeFileSync(join(work, 'bls-invoices.csv'), [head.join(','), ...lines.map((l) => head.map((h) => (/[",]/.test(String(l[h])) ? `"${String(l[h]).replace(/"/g, '""')}"` : l[h])).join(','))].join('\n') + '\n');
  const res = await run('fairtable-price-creep', { invoices: 'bls-invoices.csv' }, work);
  let checked = 0, wrong = 0; const per = [];
  for (const [label, t] of Object.entries(truth)) {
    const it = res.items.find((i) => i.item === label); const got = new Set(it ? it.findings.map((f) => f.code) : []);
    for (const c of new Set([...t.expect, ...got])) { checked++; if (t.expect.includes(c) !== got.has(c)) wrong++; }
    per.push({ item: label, ...t, reported: [...got], agent_change_pct: it ? it.change_pct : null });
  }
  report.sources.push({
    name: 'BLS average retail prices (U.S. city average), via FRED', agent: 'fairtable-price-creep', url: 'https://fred.stlouisfed.org/ (series ' + SERIES.map(([id]) => id).join(', ') + ')',
    licence: 'U.S. Bureau of Labor Statistics data, public domain; served by FRED, Federal Reserve Bank of St. Louis (cite FRED and BLS)', format: 'FRED CSV (observation_date, value), the last 13 monthly values per series, each written as one invoice line of 20 units',
    series: SERIES.length, invoice_lines: lines.length, findings: count(res.items), steady_creep_before_fix: Object.values(truth).filter((t) => t.old_rule_steady_creep).length, recheck: { pairs_checked: checked, disagreements: wrong }, per_item: per,
  });
  console.log(`BLS via FRED: ${SERIES.length} series, ${lines.length} lines; ${JSON.stringify(count(res.items))}; re-check ${wrong} disagreement(s) in ${checked}`);
  for (const p of per) console.log(`  ${p.item}: ${p.from} ${p.first} -> ${p.to} ${p.last} (${p.change_pct}%), rises in a row ${p.max_rises_in_a_row}; reported ${p.reported.join(', ') || 'nothing'}`);
}

mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', `realdata-${DATE}.json`), JSON.stringify(report, null, 2) + '\n');
console.log(`Wrote docs/realdata-${DATE}.json`);
