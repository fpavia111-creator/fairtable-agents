#!/usr/bin/env node
// Masking check: for every agent whose sources have personal fields (staff, guest and client
// names, phones, emails), run every eval case and assert that no personal value from the
// fixtures appears in anything returned to the model. Report and draft files may keep them.
import { readdirSync, existsSync, readFileSync, mkdtempSync, cpSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, parseCsv } from '../packages/fairtable-core/src/index.js';

const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
let checked = 0, leaks = 0, values = 0, agents = 0;
for (const n of readdirSync(PK).filter((x) => /^fairtable-(?!core$)/.test(x)).sort()) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const personal = Object.entries(manifest.sources || {}).flatMap(([, s]) => Object.entries(s.fields).filter(([, fd]) => fd && fd.personal).map(([f]) => [f, [f, ...(s.fields[f].aliases || [])]]));
  if (!personal.length) continue;
  agents++;
  const canaries = new Set();
  for (const f of readdirSync(join(PK, n, 'fixtures')).filter((x) => x.endsWith('.csv'))) {
    for (const row of parseCsv(readFileSync(join(PK, n, 'fixtures', f), 'utf8'))) for (const [, names] of personal) for (const h of Object.keys(row)) if (names.some((x) => x.toLowerCase() === h.toLowerCase()) && String(row[h]).trim().length > 3) canaries.add(String(row[h]).trim());
  }
  values += canaries.size;
  const data = JSON.parse(readFileSync(join(PK, n, 'evals', 'cases.json'), 'utf8'));
  for (const c of data.cases) {
    const root = mkdtempSync(join(tmpdir(), `mask-${n}-`)); cpSync(resolve(join(PK, n, 'evals'), data.root || '.'), root, { recursive: true, filter: (p) => !/node_modules|fairtable-out|\.fairtable/.test(p) });
    const rt = new AgentRuntime(manifest, { root, audit: false, mode: c.mode || 'assist', autoActions: c.auto_actions || [] });
    let out = await rt.call(c.tool, c.args || {}); if (out.status === 'needs_approval') { rt.approvals.approve(out.approval_id, 'Masking Check'); out = await rt.call(c.tool, c.args || {}); }
    const txt = JSON.stringify(out); checked++;
    for (const v of canaries) if (txt.includes(v)) { leaks++; console.log(`  LEAK ${n} ${c.id}: "${v.slice(0, 3)}..."`); }
  }
}
console.log(`${agents} agent(s) with personal fields, ${values} fictional personal value(s) planted as canaries, ${checked} call(s), ${leaks} leak(s).`);
process.exit(leaks ? 1 : 0);
