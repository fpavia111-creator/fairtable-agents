// Food handler cards, food protection manager and alcohol server certificates against the
// active roster, as of a date, and a certified manager for every location.
import { str, isoDate, daysBetween, nameKey, personKey, displayName, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ as_of: null, grace_days: 30, warn_days: 45, food_handler_types: ['Food handler'], manager_cert_types: ['Food protection manager'], alcohol_cert_types: ['Alcohol server'], alcohol_roles: ['Bartender'], manager_per_location: true });
const LEVELS = { missing_card: 'flag', expired: 'flag', no_certified_manager: 'flag', expiring_soon: 'watch', in_grace_period: 'watch', alcohol_cert_missing: 'review', no_expiry: 'review' };
const isType = (list, t) => (list || []).some((x) => nameKey(x) === nameKey(t));

export function foodHandlers({ roster = [], certificates = [] }, s = DEFAULTS) {
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const certs = new Map(); for (const c of certificates) { const k = personKey(c.employee); if (!k) continue; if (!certs.has(k)) certs.set(k, []); certs.get(k).push(c); }
  const best = (list, types) => (list || []).filter((c) => isType(types, c.cert_type)).sort((a, b) => cmp(isoDate(b.expires) || '9999', isoDate(a.expires) || '9999'))[0] || null;
  const items = []; const managers = new Map();
  for (const r of [...roster].sort((a, b) => cmp(personKey(a.employee), personKey(b.employee)))) {
    if (!str(r.employee) || /inactive|terminated|left/i.test(str(r.status))) continue;
    const f = []; const mine = certs.get(personKey(r.employee)) || []; const name = displayName(r.employee); const loc = str(r.location) || '(none)';
    if (!managers.has(loc)) managers.set(loc, []);
    const card = best(mine, s.food_handler_types);
    const tenure = isoDate(r.hire_date) ? daysBetween(r.hire_date, asOf) : null;
    const check = (c, label, missingCode, missingText) => {
      if (!c) { if (missingCode) f.push(finding(missingCode, missingText)); return null; }
      const exp = isoDate(c.expires); if (!exp) { f.push(finding('no_expiry', `${name}: ${label} ${str(c.number)} has no expiry date on file.`)); return null; }
      const left = daysBetween(asOf, exp);
      if (left < 0) f.push(finding('expired', `${name}: ${label} ${str(c.number)} expired on ${exp}.`));
      else if (left <= s.warn_days) f.push(finding('expiring_soon', `${name}: ${label} ${str(c.number)} expires ${exp}, in ${left} days.`));
      return left;
    };
    if (!card) {
      if (tenure !== null && tenure <= s.grace_days) f.push(finding('in_grace_period', `${name} started ${isoDate(r.hire_date)}; a food handler card is due within ${s.grace_days} days (by ${isoDate(r.hire_date) ? new Date(Date.parse(`${isoDate(r.hire_date)}T00:00:00Z`) + s.grace_days * 86400000).toISOString().slice(0, 10) : '?'}).`));
      else f.push(finding('missing_card', `${name} (${str(r.role)}, ${loc}) has no food handler card on file${tenure !== null ? ` after ${tenure} days` : ''}.`));
    } else check(card, 'food handler card');
    const mgr = best(mine, s.manager_cert_types);
    if (mgr) { const left = check(mgr, 'food protection manager certificate'); if (left !== null && left >= 0) managers.get(loc).push(name); }
    if (isType(s.alcohol_roles, r.role)) check(best(mine, s.alcohol_cert_types), 'alcohol server certificate', 'alcohol_cert_missing', `${name} works as ${str(r.role)} with no alcohol server certificate on file.`);
    const expiries = mine.map((c) => isoDate(c.expires)).filter(Boolean).sort();
    items.push({ employee: name, role: str(r.role), location: loc, hire_date: isoDate(r.hire_date), certificates: mine.map((c) => str(c.cert_type)).sort().join(', '), next_expiry: expiries.find((d) => d >= asOf) || null, status: statusOf(f, LEVELS), findings: f });
  }
  if (s.manager_per_location) for (const [loc, list] of [...managers.entries()].sort((a, b) => cmp(a[0], b[0]))) if (!list.length) items.push({ employee: `${loc} (location)`, role: '', location: loc, hire_date: null, certificates: '', next_expiry: null, status: 'flag', findings: [finding('no_certified_manager', `${loc} has no one on the active roster with a current food protection manager certificate.`)] });
  return { items, totals: { staff: items.filter((i) => i.role !== '' || !i.employee.endsWith('(location)')).length, locations: managers.size, action_needed: items.filter((i) => i.status === 'flag').length }, extra: { as_of: asOf } };
}
