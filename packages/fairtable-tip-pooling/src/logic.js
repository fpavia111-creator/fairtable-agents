// Tip pool and tip credit, per employee and workweek.
// Pool = card tips (and cash, when the settings say so) of everyone in a pool role, plus
// tips a manager collected, which belong to the pool. Shares = pool x hours x role points.
// Tip credit: when the cash wage is under the full minimum wage, cash wage + share +
// declared cash tips over the week must reach the full minimum; the gap is a makeup amount.
import { str, num, round2, nameKey, personKey, displayName, weekStart, isoDate, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ state: 'not set', full_min_wage: 7.25, tipped_cash_wage: 2.13, tip_credit_allowed: true, pool_roles: ['Server', 'Bartender', 'Busser', 'Runner', 'Host'], excluded_roles: ['Manager', 'General Manager', 'Owner', 'Supervisor'], role_points: {}, include_cash_in_pool: false });
const LEVELS = { manager_kept_tips: 'flag', tip_credit_shortfall: 'flag', tip_credit_not_allowed: 'flag', below_cash_wage: 'flag', no_cash_declared: 'watch', no_role: 'review', no_hours: 'review' };

export function tipPools({ timecards = [] }, s = DEFAULTS) {
  const inRole = (list, role) => (list || []).some((r) => nameKey(r) === nameKey(role));
  const points = (role) => { const e = Object.entries(s.role_points || {}).find(([r]) => nameKey(r) === nameKey(role)); return e ? Number(e[1]) : 1; };
  const rows = new Map();
  for (const t of timecards) {
    if (!str(t.employee)) continue;
    const week = weekStart(t.clock_in) || weekStart(t.clock_out) || 'no date';
    const k = `${week}|${personKey(t.employee)}|${nameKey(t.role)}`;
    const e = rows.get(k) || { week, employee: displayName(t.employee), role: str(t.role), hours: 0, wages: 0, rate: null, cash: 0, card: 0 };
    const h = num(t.hours) ?? 0; const r = num(t.rate);
    e.hours += h; if (r !== null) { e.wages += r * h; e.rate = e.rate === null ? r : Math.min(e.rate, r); }
    e.cash += num(t.cash_tips) || 0; e.card += num(t.card_tips) || 0; rows.set(k, e);
  }
  const weeks = new Map(); for (const e of rows.values()) { if (!weeks.has(e.week)) weeks.set(e.week, []); weeks.get(e.week).push(e); }
  const items = []; let poolTotal = 0, makeup = 0;
  for (const [week, list] of [...weeks.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const members = list.filter((e) => inRole(s.pool_roles, e.role));
    const pool = list.filter((e) => inRole(s.pool_roles, e.role) || inRole(s.excluded_roles, e.role)).reduce((t, e) => t + e.card + (s.include_cash_in_pool ? e.cash : 0), 0);
    const weight = members.reduce((t, e) => t + e.hours * points(e.role), 0);
    poolTotal += pool;
    for (const e of list.sort((a, b) => cmp(personKey(a.employee), personKey(b.employee)))) {
      const f = []; const member = inRole(s.pool_roles, e.role); const excluded = inRole(s.excluded_roles, e.role);
      const share = member && weight ? (pool * e.hours * points(e.role)) / weight : 0;
      if (!str(e.role)) f.push(finding('no_role', `${e.employee} (week of ${week}) has no role, so pool eligibility cannot be decided.`));
      if (excluded && (e.card > 0 || e.cash > 0)) f.push(finding('manager_kept_tips', `${e.employee} is a ${e.role} and has ${round2(e.card + e.cash)} of tips on their own timecard in the week of ${week}. Tips a manager or supervisor collects go into the pool; they were added to it here.`, e.card + e.cash));
      if (!e.hours) f.push(finding('no_hours', `${e.employee}: no hours in the week of ${week}.`));
      const tipped = member && e.rate !== null && e.rate < s.full_min_wage;
      if (tipped && !s.tip_credit_allowed) f.push(finding('tip_credit_not_allowed', `${e.employee} is paid ${e.rate} an hour, under the ${s.full_min_wage} minimum, and the settings say this state allows no tip credit: ${round2((s.full_min_wage - e.rate) * e.hours)} for the week of ${week}.`, (s.full_min_wage - e.rate) * e.hours));
      else if (tipped && e.rate < s.tipped_cash_wage) f.push(finding('below_cash_wage', `${e.employee} is paid ${e.rate} an hour, under the ${s.tipped_cash_wage} tipped cash wage in the settings.`, (s.tipped_cash_wage - e.rate) * e.hours));
      let effective = null;
      if (e.hours && e.rate !== null) {
        effective = round2((e.wages + share + e.cash) / e.hours);
        if (tipped && s.tip_credit_allowed && effective < s.full_min_wage) f.push(finding('tip_credit_shortfall', `${e.employee}, week of ${week}: wages ${round2(e.wages)} + pool share ${round2(share)} + cash tips ${round2(e.cash)} over ${e.hours} hours is ${effective} an hour, under the ${s.full_min_wage} minimum. Makeup ${round2((s.full_min_wage - effective) * e.hours)}.`, (s.full_min_wage - effective) * e.hours));
      }
      if (member && e.card > 0 && e.cash === 0) f.push(finding('no_cash_declared', `${e.employee} has card tips and no cash tips declared in the week of ${week}.`));
      const owed = f.filter((x) => ['tip_credit_shortfall', 'tip_credit_not_allowed', 'below_cash_wage'].includes(x.code)).reduce((t, x) => t + (x.amount || 0), 0); makeup += owed;
      items.push({ employee: e.employee, sub: week, week, role: e.role, hours: round2(e.hours), rate: e.rate, card_tips: round2(e.card), cash_tips: round2(e.cash), pool_share: round2(share), effective_hourly: effective, makeup_owed: round2(owed), status: statusOf(f, LEVELS), findings: f });
    }
  }
  return { items, totals: { employee_weeks: items.length, weeks: weeks.size, tip_pool: round2(poolTotal), makeup_owed: round2(makeup) }, extra: { state: s.state } };
}
