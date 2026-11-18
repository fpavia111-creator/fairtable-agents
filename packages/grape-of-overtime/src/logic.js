// Overtime and split shifts per employee and workweek, under the rules in the settings.
// Daily overtime and double time (when the settings have them) are counted first; weekly
// overtime is counted on the remaining regular hours over the weekly limit, so no hour is
// paid as overtime twice. Premiums are the extra over straight time.
import { str, num, round2, isoDate, personKey, displayName, weekStart, hoursBetween, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ rules: 'not set', weekly_ot_after: 40, daily_ot_after: null, daily_dt_after: null, ot_multiplier: 1.5, split_gap_hours: 1, spread_hours: null, premium_hourly: null, clopen_rest_hours: 10, flag_ot_hours: 5, long_shift_hours: 12 });
const LEVELS = { overtime_high: 'flag', overtime: 'watch', double_time: 'flag', split_shift: 'review', spread_of_hours: 'review', clopen: 'watch', long_shift: 'watch', missing_clock_out: 'review' };
const iso = (v) => { const s = str(v); const d = isoDate(s); if (!d) return null; const m = /[T ](\d{1,2}):(\d{2})/.exec(s); return `${d}T${m ? `${m[1].padStart(2, '0')}:${m[2]}` : '00:00'}`; };

export function overtime({ timecards = [] }, s = DEFAULTS) {
  const byEmp = new Map();
  for (const t of timecards) {
    if (!str(t.employee)) continue;
    const a = iso(t.clock_in), b = iso(t.clock_out);
    const k = `${personKey(t.employee)}|${weekStart(a || b) || 'no date'}`;
    const e = byEmp.get(k) || { employee: displayName(t.employee), role: str(t.role), week: weekStart(a || b) || 'no date', rate: null, shifts: [], missing: [] };
    if (num(t.rate) !== null) e.rate = Math.max(e.rate ?? 0, num(t.rate));
    if (!a || !b) e.missing.push(a || b || '?');
    else e.shifts.push({ a, b, day: isoDate(a), hours: Math.max(0, round2((hoursBetween(a, b) ?? 0) - (num(t.break_minutes) || 0) / 60)) });
    byEmp.set(k, e);
  }
  const items = []; let premium = 0, otHours = 0;
  for (const e of [...byEmp.values()].sort((x, y) => cmp(`${personKey(x.employee)}|${x.week}`, `${personKey(y.employee)}|${y.week}`))) {
    const f = []; e.shifts.sort((x, y) => cmp(x.a, y.a));
    const days = new Map(); for (const sh of e.shifts) { if (!days.has(sh.day)) days.set(sh.day, []); days.get(sh.day).push(sh); }
    let regular = 0, dailyOt = 0, dt = 0; const spreads = []; const total = e.shifts.reduce((t, x) => t + x.hours, 0);
    for (const [day, list] of [...days.entries()].sort((x, y) => cmp(x[0], y[0]))) {
      const h = list.reduce((t, x) => t + x.hours, 0);
      if (s.daily_ot_after) { const d2 = s.daily_dt_after ? Math.max(0, h - s.daily_dt_after) : 0; const d1 = Math.max(0, Math.min(h, s.daily_dt_after || Infinity) - s.daily_ot_after); dt += d2; dailyOt += d1; regular += h - d1 - d2; } else regular += h;
      if (list.length > 1) for (let i = 1; i < list.length; i++) { const gap = hoursBetween(list[i - 1].b, list[i].a); if (gap !== null && gap > s.split_gap_hours) f.push(finding('split_shift', `${e.employee} worked a split shift on ${day}: ${list[i - 1].a.slice(11)}-${list[i - 1].b.slice(11)} and ${list[i].a.slice(11)}-${list[i].b.slice(11)} (${round2(gap)} h unpaid between).${s.premium_hourly ? ` A split-shift premium of one hour (${s.premium_hourly}) may be owed under the settings.` : ''}`, s.premium_hourly || null)); }
      const span = hoursBetween(list[0].a, list.at(-1).b);
      if (s.spread_hours && span !== null && span > s.spread_hours) spreads.push(`${day} (${round2(span)} h)`);
    }
    if (spreads.length) f.push(finding('spread_of_hours', `${e.employee} had ${spreads.length} day(s) spread over more than ${s.spread_hours} hours from first in to last out: ${spreads.join(', ')}.${s.premium_hourly ? ` A spread-of-hours premium of one hour (${s.premium_hourly}) a day may be owed under the settings.` : ''}`, s.premium_hourly ? s.premium_hourly * spreads.length : null));
    for (const sh of e.shifts) if (sh.hours > s.long_shift_hours) f.push(finding('long_shift', `${e.employee} worked ${sh.hours} hours from ${sh.a}.`));
    for (let i = 1; i < e.shifts.length; i++) { const rest = hoursBetween(e.shifts[i - 1].b, e.shifts[i].a); if (rest !== null && rest > 0 && rest < s.clopen_rest_hours && e.shifts[i - 1].day !== e.shifts[i].day) f.push(finding('clopen', `${e.employee} clocked out at ${e.shifts[i - 1].b.replace('T', ' ')} and back in at ${e.shifts[i].a.replace('T', ' ')}: ${round2(rest)} hours of rest.`)); }
    for (const m of e.missing) f.push(finding('missing_clock_out', `${e.employee} has a shift from ${String(m).replace('T', ' ')} with no clock-out; its hours are not counted.`));
    const weeklyOt = Math.max(0, regular - s.weekly_ot_after);
    const ot = round2(dailyOt + weeklyOt); const rate = e.rate || 0;
    const prem = round2(ot * rate * (s.ot_multiplier - 1) + dt * rate);
    if (ot > 0) f.push(finding(ot >= s.flag_ot_hours ? 'overtime_high' : 'overtime', `${e.employee}, week of ${e.week}: ${round2(total)} hours, ${round2(weeklyOt)} weekly and ${round2(dailyOt)} daily overtime hours; premium ${round2(ot * rate * (s.ot_multiplier - 1))} at ${rate} an hour.`, ot * rate * (s.ot_multiplier - 1)));
    if (dt > 0) f.push(finding('double_time', `${e.employee}: ${round2(dt)} double-time hours (over ${s.daily_dt_after} in a day); premium ${round2(dt * rate)}.`, dt * rate));
    premium += prem; otHours += ot;
    items.push({ employee: e.employee, sub: e.week, week: e.week, role: e.role, shifts: e.shifts.length, hours: round2(total), regular_hours: round2(regular - weeklyOt), overtime_hours: ot, double_time_hours: round2(dt), rate: e.rate, premium_cost: prem, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { employee_weeks: items.length, overtime_hours: round2(otHours), premium_cost: round2(premium), split_shifts: items.reduce((t, i) => t + i.findings.filter((f) => f.code === 'split_shift').length, 0) }, extra: { rules: s.rules } };
}
