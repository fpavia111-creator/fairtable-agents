// Meal breaks and minors' hours per employee and shift, under the rules in the settings.
// A premium (an hour of pay at the regular rate, under the example rules) is shown where a
// meal break was missed, short or late; whether it is owed is the employer's decision.
import { str, num, round2, isoDate, personKey, displayName, hoursBetween, minutesOf, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ rules: 'not set', meal_after_hours: 5, meal_minutes: 30, meal_start_by_hours: 5, second_meal_after_hours: 10, premium_hours: 1, minimum_wage: 0, minor_max_daily_hours: { under_16: 3, under_18: 8 }, minor_latest_end: { under_16: '19:00', under_18: '22:30' } });
const LEVELS = { missed_meal_break: 'flag', short_meal_break: 'flag', late_meal: 'review', missed_second_meal: 'flag', minor_over_hours: 'flag', minor_late_shift: 'flag', missing_clock_out: 'review' };
const iso = (v) => { const d = isoDate(v); if (!d) return null; const m = /[T ](\d{1,2}):(\d{2})/.exec(str(v)); return `${d}T${m ? `${m[1].padStart(2, '0')}:${m[2]}` : '00:00'}`; };

export function breaks({ timecards = [] }, s = DEFAULTS) {
  const items = []; let premium = 0;
  for (const t of [...timecards].sort((a, b) => cmp(`${personKey(a.employee)}|${iso(a.clock_in)}`, `${personKey(b.employee)}|${iso(b.clock_in)}`))) {
    if (!str(t.employee)) continue;
    const a = iso(t.clock_in), b = iso(t.clock_out); const name = displayName(t.employee); const f = [];
    const rate = Math.max(num(t.rate) || 0, s.minimum_wage || 0); const prem = round2(rate * s.premium_hours);
    if (!a || !b) { f.push(finding('missing_clock_out', `${name}: shift from ${String(a || '?').replace('T', ' ')} has no clock-out.`)); items.push({ employee: name, sub: a, shift: a ? a.replace('T', ' ') : '', hours: null, break_minutes: num(t.break_minutes), age: num(t.age), premium: 0, status: statusOf(f, LEVELS), findings: f }); continue; }
    const span = hoursBetween(a, b) ?? 0; const brk = num(t.break_minutes) || 0; const worked = round2(span - brk / 60);
    let owed = 0;
    if (span > s.meal_after_hours) {
      if (brk === 0) { f.push(finding('missed_meal_break', `${name} worked ${round2(span)} hours on ${isoDate(a)} with no meal break recorded (rules: a ${s.meal_minutes}-minute meal after ${s.meal_after_hours} hours).${s.premium_hours ? ` Premium under the settings: ${prem}.` : ''}`, prem)); owed += prem; }
      else if (brk < s.meal_minutes) { f.push(finding('short_meal_break', `${name}: ${brk}-minute meal break on ${isoDate(a)}, shorter than ${s.meal_minutes}.${s.premium_hours ? ` Premium under the settings: ${prem}.` : ''}`, prem)); owed += prem; }
      else if (str(t.break_start)) { const startAfter = hoursBetween(a, iso(t.break_start) || t.break_start); if (startAfter !== null && startAfter > s.meal_start_by_hours) { f.push(finding('late_meal', `${name}: meal started ${round2(startAfter)} hours into the shift on ${isoDate(a)}, after the ${s.meal_start_by_hours}th hour.`, prem)); } }
    }
    if (s.second_meal_after_hours && span > s.second_meal_after_hours && brk < s.meal_minutes * 2) { f.push(finding('missed_second_meal', `${name}: ${round2(span)} hours on ${isoDate(a)} with ${brk} minutes of meal breaks; a second meal is due after ${s.second_meal_after_hours} hours under the settings.`, prem)); owed += prem; }
    const age = num(t.age);
    if (age !== null && age < 18) {
      const band = age < 16 ? 'under_16' : 'under_18';
      const max = (s.minor_max_daily_hours || {})[band]; const latest = (s.minor_latest_end || {})[band];
      if (max !== undefined && worked > max) f.push(finding('minor_over_hours', `${name} (age ${age}) worked ${worked} hours on ${isoDate(a)}; the settings allow ${max} for ${band.replace('_', ' ')}.`));
      const end = minutesOf(b); const lim = minutesOf(latest);
      if (latest && end !== null && lim !== null && (end > lim || isoDate(b) > isoDate(a))) f.push(finding('minor_late_shift', `${name} (age ${age}) clocked out at ${b.slice(11)} on ${isoDate(b)}; the settings say ${latest} for ${band.replace('_', ' ')}.`));
    }
    premium += owed;
    items.push({ employee: name, sub: a, shift: `${a.replace('T', ' ')} to ${b.slice(11)}`, hours: worked, break_minutes: brk, age, premium: round2(owed), status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { shifts: items.length, breaks_missed: items.filter((i) => i.findings.some((f) => /meal/.test(f.code) && f.code !== 'late_meal')).length, minor_issues: items.filter((i) => i.findings.some((f) => /minor/.test(f.code))).length, premium_shown: round2(premium) }, extra: { rules: s.rules } };
}
