import { mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentRuntime } from './runtime.js';

/** Copy bundled fixtures into a temp folder and return a runtime rooted there. */
export function demoRuntime(manifest, fixturesDir, options = {}) {
  const root = mkdtempSync(join(tmpdir(), `${manifest.name}-demo-`));
  cpSync(fixturesDir, root, { recursive: true });
  return new AgentRuntime(manifest, { root, ...options });
}

export function printStep(label, r) {
  const head = `\n▶ ${label}\n  status: ${r.status}  decision: ${r.decision}${r.approved_by ? `  approved by: ${r.approved_by}` : ''}${r.auto ? '  (auto)' : ''}`;
  process.stdout.write(head + '\n');
  if (r.reason && r.status !== 'executed') process.stdout.write(`  reason: ${r.reason}\n`);
  if (r.result && r.result.summary) process.stdout.write(`  ${r.result.summary}\n`);
}

/**
 * The standard demo of a Fairtable agent: check, explain one item, write the report,
 * draft (Auto is opted in for the draft), ask for the one-click approval, approve it as
 * a named person, and show that a refused tool stays refused.
 * opts: { title, files, explain: { arg, value }, draft: { ...extra args }, refused }
 */
export async function tableDemo(manifest, fixturesDir, opts) {
  const prefix = manifest.tools[0].name.split('_')[0];
  const draftTool = manifest.tools.find((t) => t.name.startsWith(`${prefix}_draft_`));
  const reqTool = manifest.tools.find((t) => t.name.startsWith(`${prefix}_request_`));
  const rt = demoRuntime(manifest, fixturesDir, { mode: 'auto', autoActions: draftTool ? [draftTool.name] : [] });
  process.stdout.write(`${opts.title} demo (fictional restaurant data) in ${rt.root}, Auto mode on\n`);
  const c = await rt.call(`${prefix}_check`, opts.files);
  printStep('Run the check on the exported files', c);
  for (const i of (c.result && c.result.items) || []) if (i.status !== 'ok') process.stdout.write(`    ${String(i.status).padEnd(7)} ${String(Object.values(i)[0]).slice(0, 34).padEnd(35)} ${i.findings.map((f) => f.code).join(', ')}\n`);
  if (opts.explain) printStep(`Explain ${opts.explain.value}`, await rt.call(`${prefix}_explain`, { ...opts.files, [opts.explain.arg]: opts.explain.value }));
  printStep('Write the report (CSV worklist and HTML page)', await rt.call(`${prefix}_write_report`, opts.files));
  if (draftTool) {
    const d = await rt.call(draftTool.name, { ...opts.files, ...(opts.draft || {}) });
    printStep('Write a draft (Auto is opted in for drafts here)', d);
    if (d.status === 'executed' && reqTool) {
      const args = { draft: d.result.draft, draft_sha256: d.result.draft_sha256, accept_open_issues: true, note: 'Checked against the paper copy' };
      const s = await rt.call(reqTool.name, args);
      printStep('Auto: approving the draft stays one named click', s);
      rt.approvals.approve(s.approval_id, 'Morgan Manager (fictional)');
      printStep('Same call after the named click (recorded; a person acts on it)', await rt.call(reqTool.name, args));
    }
  }
  const refused = opts.refused || manifest.tools.find((t) => (manifest.policy.rules.find((r) => r.tool === t.name) || {}).decision === 'block')?.name;
  if (refused) printStep(`The agent tries ${refused} itself`, await rt.call(refused, {}));
  process.stdout.write(`\nAudit log: ${rt.stateDir}/audit.jsonl\n`);
}
