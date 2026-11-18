#!/usr/bin/env node
// Writes sample-reports/: every agent's report (HTML page and CSV worklist) on its own
// fictional demo files, in English, plus an index page. Run after changing an agent.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, htmlPage, escapeHtml } from '../packages/fairtable-core/src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages'); const OUT = join(ROOT, 'sample-reports');
mkdirSync(OUT, { recursive: true });
const rows = [];
for (const n of readdirSync(PK).filter((x) => /^fairtable-(?!core$)/.test(x)).sort()) {
  const { manifest, DEMO } = await import(pathToFileURL(join(PK, n, 'src', 'manifest.js')).href);
  const prefix = manifest.tools[0].name.replace(/_check$/, '');
  const root = mkdtempSync(join(tmpdir(), `${n}-sample-`)); cpSync(join(PK, n, 'fixtures'), root, { recursive: true });
  const r = await new AgentRuntime(manifest, { root, audit: false, memory: false }).call(`${prefix}_write_report`, DEMO.files);
  if (r.status !== 'executed') { console.error(`${n}: ${r.reason}`); process.exitCode = 1; continue; }
  const short = n.replace(/^fairtable-/, '');
  for (const f of r.result.files) { const ext = f.split('.').pop(); writeFileSync(join(OUT, `${short}.${ext}`), readFileSync(join(root, f))); }
  rmSync(root, { recursive: true, force: true });
  rows.push({ n, short, title: manifest.tools.find((t) => t.name === `${prefix}_write_report`).title.replace(/^Write the /, '').replace(/ report$/, ''), summary: r.result.summary.replace(/^[^:]+ written: /, '') });
  console.log(`${n}: sample report written`);
}
const body = `<h1>Fairtable sample reports</h1><p class="mut">Every report below was written by the agent on its own fictional demo files (no real restaurant, person, vendor or guest). Staff and guest names in the files are made up; the agents mask them only in what they return to an AI model, so the reports show them as written.</p><table><thead><tr><th>Agent</th><th>Report</th><th>Summary</th><th>Files</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${escapeHtml(x.n)}</td><td>${escapeHtml(x.title)}</td><td>${escapeHtml(x.summary)}</td><td><a href="${x.short}.html">HTML</a> · <a href="${x.short}.csv">CSV</a></td></tr>`).join('')}</tbody></table>`;
writeFileSync(join(OUT, 'index.html'), htmlPage({ title: 'Fairtable sample reports', bodyHtml: body, footer: 'Fictional data. Written by the Fairtable agents; nothing was sent or paid.', lang: 'en' }));
console.log(`${rows.length} sample report(s) in sample-reports/`);
