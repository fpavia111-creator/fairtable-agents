#!/usr/bin/env node
// Development helper: replace the "expect" of one eval case.
//   node scripts/edit-case.mjs <agent> <case-id> '<expect json>'
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const [n, id, expect] = process.argv.slice(2);
const f = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', n, 'evals', 'cases.json');
const d = JSON.parse(readFileSync(f, 'utf8')); const c = d.cases.find((x) => x.id === id);
if (!c) { console.error(`no case ${id}`); process.exit(1); }
c.expect = JSON.parse(expect); writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
