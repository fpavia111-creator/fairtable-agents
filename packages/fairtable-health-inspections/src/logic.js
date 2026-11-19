// Health inspection and permit calendar per location, as of a date.
import { str, num, isoDate, addDays, daysBetween, nameKey, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ as_of: null, routine_interval_days: 180, routine_warn_days: 45, permit_warn_days: 60, score_drop_points: 5 });
const LEVELS = { reinspection_overdue: 'flag', critical_open: 'flag', permit_expired: 'flag', permit_expiring: 'watch', routine_due: 'watch', score_drop: 'review', no_expiry: 'review' };

export function inspections({ inspections: rows = [], permits = [] }, s = DEFAULTS) {
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const byLoc = new Map(); for (const r of rows) { if (!str(r.location) || !isoDate(r.date)) continue; const k = nameKey(r.location); if (!byLoc.has(k)) byLoc.set(k, []); byLoc.get(k).push(r); }
  const items = [];
  for (const [, list] of [...byLoc.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    list.sort((a, b) => cmp(isoDate(a.date), isoDate(b.date)));
    const loc = str(list[0].location); const f = []; const last = list.at(-1); const lastDate = isoDate(last.date);
    for (const [i, r] of list.entries()) {
      const later = list.slice(i + 1);
      const due = isoDate(r.reinspection_due);
      if (due && !later.length && due < asOf) f.push(finding('reinspection_overdue', `${loc}: a re-inspection was due ${due} after the ${isoDate(r.date)} inspection and none is on file.`));
      if ((num(r.critical_violations) || 0) > 0 && !later.length) f.push(finding('critical_open', `${loc}: ${num(r.critical_violations)} critical violation(s) at the ${isoDate(r.date)} inspection with no later inspection on file to show they were corrected.`));
    }
    const scored = list.filter((r) => num(r.score) !== null);
    if (scored.length >= 2) { const a = num(scored.at(-2).score), b = num(scored.at(-1).score); if (a - b >= s.score_drop_points) f.push(finding('score_drop', `${loc}: score fell from ${a} to ${b}.`)); }
    const routine = list.filter((r) => /routine/i.test(str(r.type))).at(-1);
    const nextRoutine = routine ? addDays(routine.date, s.routine_interval_days) : null; const toNext = nextRoutine ? daysBetween(asOf, nextRoutine) : null;
    if (toNext !== null && toNext <= s.routine_warn_days) f.push(finding('routine_due', `${loc}: last routine inspection ${isoDate(routine.date)}; at about every ${s.routine_interval_days} days ${toNext < 0 ? `the next was expected around ${nextRoutine}, ${-toNext} days ago, and could come any day` : `the next could come around ${nextRoutine}`}. Walk the kitchen with the inspection form before then.`));
    items.push({ item: `${loc} | inspections`, location: loc, kind: 'inspections', last_inspection: lastDate, last_score: num(last.score), next_date: nextRoutine, days_left: toNext, status: statusOf(f, LEVELS), findings: f });
  }
  for (const p of [...permits].sort((a, b) => cmp(`${nameKey(a.location)}|${nameKey(a.permit)}`, `${nameKey(b.location)}|${nameKey(b.permit)}`))) {
    if (!str(p.permit)) continue;
    const f = []; const exp = isoDate(p.expires); const left = exp ? daysBetween(asOf, exp) : null;
    if (!exp) f.push(finding('no_expiry', `${str(p.location)}: ${str(p.permit)} has no expiry date on file.`));
    else if (left < 0) f.push(finding('permit_expired', `${str(p.location)}: ${str(p.permit)} ${str(p.number)} expired on ${exp}, ${-left} days ago.`));
    else if (left <= s.permit_warn_days) f.push(finding('permit_expiring', `${str(p.location)}: ${str(p.permit)} ${str(p.number)} expires ${exp}, in ${left} days.`));
    items.push({ item: `${str(p.location)} | ${str(p.permit)}`, location: str(p.location), kind: 'permit', last_inspection: null, last_score: null, next_date: exp, days_left: left, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { locations: byLoc.size, permits: permits.filter((p) => str(p.permit)).length, overdue: items.filter((i) => i.status === 'flag').length, due_soon: items.filter((i) => i.status === 'watch').length }, extra: { as_of: asOf } };
}
