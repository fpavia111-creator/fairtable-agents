#!/usr/bin/env node
// Runs scripts/hostile-inputs.mjs once per agent, several agents at a time, and sums the
// results. Same checks as `npm run hostile:args`, only faster on a machine with many cores.
//   node scripts/hostile-parallel.mjs [--args] [--jobs 6] [agent ...]
import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cpus } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2); const withArgs = argv.includes('--args');
const ji = argv.indexOf('--jobs'); const jobs = ji >= 0 ? Number(argv[ji + 1]) : Math.max(1, cpus().length - 2);
const only = argv.filter((a, i) => !a.startsWith('--') && (ji < 0 || i !== ji + 1));
const agents = readdirSync(join(ROOT, 'packages')).filter((n) => /-of-/.test(n) && existsSync(join(ROOT, 'packages', n, 'src', 'manifest.js')) && (!only.length || only.includes(n))).sort();
const out = join(ROOT, 'fairtable-out', 'hostile'); mkdirSync(out, { recursive: true });
const results = [];
async function one(n) {
  return new Promise((resolve) => {
    let text = ''; const t0 = Date.now();
    const p = spawn(process.execPath, [join(ROOT, 'scripts', 'hostile-inputs.mjs'), ...(withArgs ? ['--args'] : []), n], { cwd: ROOT });
    p.stdout.on('data', (d) => { text += d; }); p.stderr.on('data', (d) => { text += d; });
    p.on('close', (code) => {
      const m = /(\d+) call\(s\), (\d+) planted value\(s\).*?(\d+) finding\(s\)/s.exec(text);
      const r = { agent: n, code, calls: m ? +m[1] : null, findings: m ? +m[3] : null, seconds: Math.round((Date.now() - t0) / 1000) };
      writeFileSync(join(out, `${n}${withArgs ? '-args' : ''}.log`), text);
      process.stderr.write(`${n}: ${r.findings === 0 && code === 0 ? 'ok' : 'FINDINGS'} (${r.calls} calls, ${r.seconds}s)\n`);
      results.push(r); resolve();
    });
  });
}
const queue = [...agents];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) await one(queue.shift()); }));
const calls = results.reduce((t, r) => t + (r.calls || 0), 0); const findings = results.reduce((t, r) => t + (r.findings ?? 1), 0); const bad = results.filter((r) => r.code !== 0 || r.findings !== 0);
console.log(`${results.length} agent(s), ${calls} call(s), ${findings} finding(s)${bad.length ? `; see fairtable-out/hostile for ${bad.map((r) => r.agent).join(', ')}` : ''}.`);
process.exit(bad.length ? 1 : 0);
