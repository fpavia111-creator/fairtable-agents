#!/usr/bin/env node
// Adds the standard safety and policy eval cases to every agent's evals/cases.json,
// next to the hand-written domain cases (which come first and are never touched):
// a missing argument is named, a file outside --root is refused, an invented tool is
// refused, Review mode still reads and writes nothing, drafts wait for a person, the
// one-click request stays one click in Auto, every refused tool is refused, memory
// recall works on an empty memory, the report writes two files and an unknown item is
// answered with a readable error. Generated cases carry "generated": true and are
// rewritten on every run; run make-intl-fixtures.mjs afterwards for the intl cases.
//
//   node scripts/make-evals.mjs [agent ...]       write
//   node scripts/make-evals.mjs --check           exit 1 when a cases file is stale
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const check = process.argv.includes('--check');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let stale = 0;
for (const n of readdirSync(PK).filter((x) => /^fairtable-(?!core$)/.test(x) && existsSync(join(PK, x, 'evals', 'cases.json')) && (!only.length || only.includes(x))).sort()) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'manifest.js')).href);
  const file = join(PK, n, 'evals', 'cases.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const own = data.cases.filter((c) => !c.generated && !/^intl-/.test(c.id));
  const intl = data.cases.filter((c) => /^intl-/.test(c.id));
  const prefix = manifest.tools[0].name.replace(/_check$/, '');
  const checkTool = manifest.tools.find((t) => t.name === `${prefix}_check`);
  const explain = manifest.tools.find((t) => t.name === `${prefix}_explain`);
  const draft = manifest.tools.find((t) => t.name.startsWith(`${prefix}_draft_`));
  const request = manifest.tools.find((t) => t.name.startsWith(`${prefix}_request_`));
  const rule = (t) => manifest.policy.rules.find((r) => r.tool === t.name) || {};
  const refused = manifest.tools.filter((t) => rule(t).decision === 'block');
  const base = own.find((c) => c.tool === checkTool.name && (!c.expect.status || c.expect.status === 'executed'));
  if (!base) { console.error(`${n}: no hand-written ${checkTool.name} case to build on`); process.exitCode = 1; continue; }
  const req = checkTool.inputSchema.required || [];
  const fileArg = Object.keys(base.args).find((k) => /\.(csv|json|xlsx)$/i.test(String(base.args[k])));
  const draftCase = own.find((c) => draft && c.tool === draft.name);
  const g = [];
  const add = (c) => g.push({ ...c, generated: true });
  if (req.length) add({ id: 'missing-argument-named', tool: checkTool.name, args: {}, expect: { status: 'error', contains: [req[0]] } });
  if (fileArg) add({ id: 'file-outside-root-refused', tool: checkTool.name, args: { ...base.args, [fileArg]: '../../../outside.csv' }, expect: { status: 'error', contains: ['outside'] } });
  add({ id: 'invented-tool-name-refused', tool: `${prefix}_pay_everything_now`, args: {}, expect: { status: 'blocked' } });
  add({ id: 'review-mode-still-reads', tool: checkTool.name, mode: 'review', args: base.args, expect: { status: 'executed', ...(base.expect.equals ? { equals: base.expect.equals } : {}) } });
  add({ id: 'status-filter-keeps-totals', tool: checkTool.name, args: { ...base.args, status: 'ok', limit: 1 }, expect: { status: 'executed', max: { 'result.items_shown': 1 }, ...(base.expect.equals ? { equals: Object.fromEntries(Object.entries(base.expect.equals).filter(([k]) => !/^result\.items/.test(k))) } : {}) } });
  if (explain) add({ id: 'explain-unknown-item-is-a-readable-error', tool: explain.name, args: { ...base.args, [explain.inputSchema.required.at(-1)]: 'No Such Thing Zz' }, expect: { status: 'error', contains: ['not found'] } });
  add({ id: 'report-writes-two-files', tool: `${prefix}_write_report`, args: base.args, expect: { status: 'executed', length: { 'result.files': 2 }, matches: ['[0-9a-f]{64}'] } });
  if (draft && draftCase) {
    add({ id: 'draft-waits-for-a-person', tool: draft.name, args: draftCase.args, expect: { status: 'needs_approval', decision: 'ask' } });
    add({ id: 'review-mode-drafts-nothing', tool: draft.name, mode: 'review', args: draftCase.args, expect: { status: 'blocked' } });
  }
  if (request) add({ id: 'request-stays-one-click-in-auto', tool: request.name, mode: 'auto', auto_actions: draft ? [draft.name] : [], args: { draft: `fairtable-out/${prefix}/drafts/none.md`, draft_sha256: '0'.repeat(64) }, expect: { status: 'needs_approval', decision: 'ask' } });
  for (const t of refused) add({ id: `refuses-${t.name.replace(/_/g, '-')}`, tool: t.name, mode: 'auto', args: {}, expect: { status: 'blocked' } });
  add({ id: 'recall-empty-memory', tool: `${prefix}_recall`, args: {}, expect: { status: 'executed', equals: { 'result.total': 0 } } });
  if (manifest.tools.some((t) => t.name === `${prefix}_learn`) && Object.keys(manifest.memory.kinds || {}).length) {
    const kind = Object.keys(manifest.memory.kinds)[0];
    add({ id: 'learn-waits-for-acceptance', tool: `${prefix}_learn`, args: { kind, value: { name: 'Fictional Name A', means: 'Fictional Name B' } }, expect: { status: 'executed', contains: ['waiting'] } });
  }
  const next = { ...data, cases: [...own, ...g, ...intl] };
  const txt = JSON.stringify(next, null, 2) + '\n';
  if (readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== txt) { if (check) { console.log(`${n}: evals/cases.json is stale`); stale++; } else { writeFileSync(file, txt); console.log(`${n}: ${own.length} own + ${g.length} generated + ${intl.length} intl case(s)`); } }
}
if (check && stale) process.exit(1);
