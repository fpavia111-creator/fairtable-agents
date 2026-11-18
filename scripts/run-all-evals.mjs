#!/usr/bin/env node
// Runs every agent's private eval cases and prints a table; exit 1 when a case fails or an
// agent has fewer than the minimum number of cases (15, the ver 6 bar).
import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runEvalFile } from '../packages/fairtable-core/src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages');
const MIN = 15;
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let total = 0, failed = 0, short = 0; const rows = [];
for (const n of readdirSync(PK).filter((x) => /-of-/.test(x) && existsSync(join(PK, x, 'evals', 'cases.json')) && (!only.length || only.includes(x))).sort()) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const r = await runEvalFile(manifest, join(PK, n, 'evals', 'cases.json'));
  const bad = r.results.filter((c) => !c.pass);
  total += r.total; failed += bad.length; if (r.total < MIN) short++;
  rows.push({ agent: n, cases: r.total, passed: r.passed });
  for (const b of bad) console.log(`  FAIL ${n} ${b.id}: ${b.fails.join('; ')}`);
}
for (const r of rows) console.log(`${r.agent.padEnd(32)} ${String(r.passed).padStart(3)}/${String(r.cases).padEnd(3)}${r.cases < MIN ? '  (fewer than 15)' : ''}`);
console.log(`\n${rows.length} agent(s), ${total} eval case(s), ${failed} failed, ${short} agent(s) under ${MIN} cases; fewest ${Math.min(...rows.map((r) => r.cases))}, most ${Math.max(...rows.map((r) => r.cases))}.`);
const out = join(ROOT, 'fairtable-out', 'evals'); mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'summary.json'), JSON.stringify({ ran_at: new Date().toISOString(), node: process.version, agents: rows, total, failed }, null, 2));
process.exit(failed || short ? 1 : 0);
