#!/usr/bin/env node
// Development helper: run one agent's demo files through its check and print what came back.
//   node scripts/try.mjs <agent> [tool] [json-args]
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const [n, tool, extra] = process.argv.slice(2);
const m = await import(pathToFileURL(join(PK, n, 'src', 'manifest.js')).href);
const { AgentRuntime } = await import(pathToFileURL(join(PK, 'fairtable-core', 'src', 'index.js')).href);
const rt = new AgentRuntime(m.manifest, { root: join(PK, n, 'fixtures'), audit: false, memory: false });
const prefix = m.manifest.tools[0].name.split('_')[0];
const r = await rt.call(tool || `${prefix}_check`, { ...m.DEMO.files, ...(extra ? JSON.parse(extra) : {}) });
if (r.status !== 'executed') { console.log(JSON.stringify(r, null, 1).slice(0, 2000)); process.exit(0); }
const { items, settings_used: _s, ...rest } = r.result;
console.log(JSON.stringify(rest).slice(0, 2500));
for (const i of items || []) console.log(i.status.padEnd(7), JSON.stringify(Object.fromEntries(Object.entries(i).filter(([k]) => k !== 'findings' && k !== 'status'))).slice(0, 220), '|', i.findings.map((f) => `${f.code}${f.amount !== null ? `(${f.amount})` : ''}`).join(', '));
