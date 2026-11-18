// Scheduled against actual labor, per employee and week: each punch matched to the shift
// scheduled that day, minutes early and late, no-shows and shifts nobody scheduled.
import { str, num, round2, isoDate, personKey, displayName, weekStart, hoursBetween, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ early_minutes: 7, late_out_minutes: 7, late_in_minutes: 7, flag_extra_hours: 2 });
const LEVELS = { over_schedule: 'flag', early_clock_in: 'watch', late_clock_out: 'watch', late_arrival: 'watch', no_show: 'review', unscheduled_shift: 'review' };
const iso = (v) => { const d = isoDate(v); if (!d) return null; const m = /[T ](\d{1,2}):(\d{2})/.exec(str(v)); return `${d}T${m ? `${m[1].padStart(2, '0')}:${m[2]}` : '00:00'}`; };
const mins = (a, b) => Math.round((hoursBetween(a, b) ?? 0) * 60);

export function schedules({ schedule = [], timecards = [] }, s = DEFAULTS) {
  const emp = new Map();
  const get = (name, at) => { const k = `${personKey(name)}|${weekStart(at) || 'no date'}`; if (!emp.has(k)) emp.set(k, { employee: displayName(name), week: weekStart(at) || 'no date', role: '', rate: null, sched: [], punch: [] }); return emp.get(k); };
  for (const x of schedule) { const a = iso(x.start), b = iso(x.end); if (!str(x.employee) || !a || !b) continue; const e = get(x.employee, a); e.role = e.role || str(x.role); e.sched.push({ a, b, day: isoDate(a) }); }
  for (const p of timecards) { const a = iso(p.clock_in), b = iso(p.clock_out); if (!str(p.employee) || !a) continue; const e = get(p.employee, a); e.role = e.role || str(p.role); if (num(p.rate) !== null) e.rate = num(p.rate); e.punch.push({ a, b, day: isoDate(a), brk: num(p.break_minutes) || 0 }); }
  const items = []; let sh = 0, ah = 0, extraCost = 0;
  for (const e of [...emp.values()].sort((x, y) => cmp(`${personKey(x.employee)}|${x.week}`, `${personKey(y.employee)}|${y.week}`))) {
    const f = []; let early = 0, lateOut = 0, lateIn = 0; const used = new Set();
    const schedH = e.sched.reduce((t, x) => t + (hoursBetween(x.a, x.b) ?? 0), 0);
    const actH = e.punch.reduce((t, x) => t + (x.b ? Math.max(0, (hoursBetween(x.a, x.b) ?? 0) - x.brk / 60) : 0), 0);
    const earlyDays = [], lateOutDays = [], lateInDays = [];
    for (const p of e.punch.sort((x, y) => cmp(x.a, y.a))) {
      const i = e.sched.findIndex((x, j) => !used.has(j) && x.day === p.day);
      if (i < 0) { f.push(finding('unscheduled_shift', `${e.employee} clocked in ${p.a.replace('T', ' ')} with no shift scheduled that day.`, e.rate !== null && p.b ? (Math.max(0, (hoursBetween(p.a, p.b) ?? 0) - p.brk / 60)) * e.rate : null)); continue; }
      used.add(i); const x = e.sched[i];
      const m1 = mins(p.a, x.a); if (m1 > s.early_minutes) { early += m1; earlyDays.push(`${p.day} (${m1} min)`); }
      const m2 = -m1; if (m2 > s.late_in_minutes) { lateIn += m2; lateInDays.push(`${p.day} (${m2} min)`); }
      if (p.b) { const m3 = mins(x.b, p.b); if (m3 > s.late_out_minutes) { lateOut += m3; lateOutDays.push(`${p.day} (${m3} min)`); } }
    }
    e.sched.forEach((x, j) => { if (!used.has(j)) f.push(finding('no_show', `${e.employee} was scheduled ${x.a.replace('T', ' ')} to ${x.b.slice(11)} and has no punch that day.`)); });
    if (earlyDays.length) f.push(finding('early_clock_in', `${e.employee} clocked in early: ${earlyDays.join(', ')}.`, e.rate !== null ? (early / 60) * e.rate : null));
    if (lateOutDays.length) f.push(finding('late_clock_out', `${e.employee} clocked out late: ${lateOutDays.join(', ')}.`, e.rate !== null ? (lateOut / 60) * e.rate : null));
    if (lateInDays.length) f.push(finding('late_arrival', `${e.employee} arrived late: ${lateInDays.join(', ')}.`));
    const extra = actH - schedH;
    if (extra >= s.flag_extra_hours && e.sched.length) f.push(finding('over_schedule', `${e.employee}, week of ${e.week}: worked ${round2(actH)} hours against ${round2(schedH)} scheduled (+${round2(extra)}).`, e.rate !== null ? extra * e.rate : null));
    if (extra > 0 && e.rate !== null) extraCost += extra * e.rate;
    sh += schedH; ah += actH;
    items.push({ employee: e.employee, sub: e.week, week: e.week, role: e.role, scheduled_shifts: e.sched.length, worked_shifts: e.punch.length, scheduled_hours: round2(schedH), actual_hours: round2(actH), extra_hours: round2(extra), early_minutes: early, late_out_minutes: lateOut, rate: e.rate, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { employee_weeks: items.length, scheduled_hours: round2(sh), actual_hours: round2(ah), extra_hours: round2(ah - sh), extra_cost: round2(extraCost) } };
}
