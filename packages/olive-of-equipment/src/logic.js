// Equipment maintenance schedule: next due date from the last service and the interval
// (the equipment list's own, else the default for its type in the settings), as of a date.
import { str, num, isoDate, addDays, daysBetween, nameKey, cmp, finding, statusOf, round2 } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ as_of: null, due_soon_days: 30, repeat_repairs: 3, repair_window_days: 120, default_intervals: {} });
const LEVELS = { overdue: 'flag', due_soon: 'watch', no_last_service: 'review', no_interval: 'review', repeat_repairs: 'watch' };

export function equipment({ equipment: list = [], service_log = [] }, s = DEFAULTS) {
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const log = new Map(); for (const l of service_log) { if (!str(l.equipment)) continue; const k = nameKey(l.equipment); if (!log.has(k)) log.set(k, []); log.get(k).push(l); }
  // Each name's last service and recent repairs are worked out once, however many list rows share the name.
  const fromLog = new Map();
  const logFor = (k) => {
    if (!fromLog.has(k)) { const entries = log.get(k) || []; const repairs = entries.filter((x) => /repair/i.test(str(x.kind)) && isoDate(x.date) && daysBetween(x.date, asOf) <= s.repair_window_days); fromLog.set(k, { lastService: entries.filter((x) => !/repair/i.test(str(x.kind))).map((x) => isoDate(x.date)).filter(Boolean).sort().at(-1) || null, repairs, cost: repairs.reduce((t, x) => t + (num(x.cost) || 0), 0) }); }
    return fromLog.get(k);
  };
  const items = []; let overdue = 0, soon = 0;
  for (const e of [...list].sort((a, b) => cmp(nameKey(a.equipment), nameKey(b.equipment)))) {
    if (!str(e.equipment)) continue;
    const f = []; const L = logFor(nameKey(e.equipment));
    const last = [isoDate(e.last_service), L.lastService].filter(Boolean).sort().at(-1) || null;
    const def = Object.entries(s.default_intervals || {}).find(([k]) => nameKey(k) === nameKey(e.type));
    const interval = num(e.interval_days) ?? (def ? Number(def[1]) : null);
    let due = null, left = null;
    if (!last) f.push(finding('no_last_service', `${str(e.equipment)} (${str(e.type) || 'no type'}) has no service date on record.`));
    if (interval === null) f.push(finding('no_interval', `${str(e.equipment)}: no service interval on the list and no default for "${str(e.type)}" in the settings.`));
    if (last && interval !== null) {
      due = addDays(last, interval); left = daysBetween(asOf, due);
      if (left < 0) { overdue++; f.push(finding('overdue', `${str(e.equipment)}: last serviced ${last}, every ${interval} days, due ${due}: ${-left} days overdue.`)); }
      else if (left <= s.due_soon_days) { soon++; f.push(finding('due_soon', `${str(e.equipment)}: due ${due}, in ${left} days.`)); }
    }
    const repairs = L.repairs;
    if (repairs.length >= s.repeat_repairs) f.push(finding('repeat_repairs', `${str(e.equipment)} was repaired ${repairs.length} times in ${s.repair_window_days} days for ${round2(L.cost)}; compare with the cost of replacing it.`, L.cost));
    items.push({ equipment: str(e.equipment), type: str(e.type), location: str(e.location), vendor: str(e.vendor), last_service: last, interval_days: interval, due_date: due, days_left: left, repairs: repairs.length, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { equipment: items.length, overdue, due_soon: soon, repair_cost: round2(items.reduce((t, i) => t + (i.findings.find((x) => x.code === 'repeat_repairs')?.amount || 0), 0)) }, extra: { as_of: asOf } };
}
