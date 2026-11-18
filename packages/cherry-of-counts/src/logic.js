// Inventory count variance: each item's count against the quantity the system expected,
// priced at its unit cost, with counts that look like a unit mistake picked out.
import { str, num, round2, nameKey, pct, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ flag_amount: 40, flag_pct: 10, watch_amount: 10, watch_pct: 5, unit_factors: [4, 6, 8, 12, 16, 24, 48] });
const LEVELS = { big_variance: 'flag', small_variance: 'watch', unit_suspect: 'review', missing_count: 'review', negative_count: 'review', no_cost: 'review', no_expected: 'watch' };

export function countVariance({ counts = [] }, s = DEFAULTS) {
  const groups = new Map();
  for (const c of counts) { if (!str(c.item)) continue; const k = `${nameKey(c.location)}|${nameKey(c.item)}`; const e = groups.get(k) || { item: str(c.item), location: str(c.location), area: str(c.area), unit: str(c.unit), counted: null, expected: null, cost: null, date: c.count_date || null }; const q = num(c.counted_qty); if (q !== null) e.counted = (e.counted || 0) + q; const x = num(c.expected_qty); if (x !== null) e.expected = x; if (num(c.unit_cost) !== null) e.cost = num(c.unit_cost); groups.set(k, e); }
  const items = []; let countedValue = 0, expectedValue = 0, shrink = 0;
  for (const e of groups.values()) {
    const f = []; let variance = null, value = null, vp = null, suspect = false;
    if (e.counted === null) f.push(finding('missing_count', `${e.item} (${e.area || 'no area'}) has no count; it is left out of the totals. Count it or write 0.`));
    else if (e.counted < 0) f.push(finding('negative_count', `${e.item} was counted as ${e.counted}; a count cannot be negative.`));
    if (e.cost === null) f.push(finding('no_cost', `${e.item} has no unit cost, so its variance cannot be priced.`));
    if (e.counted !== null && e.counted >= 0) {
      if (e.expected === null) f.push(finding('no_expected', `${e.item} has no expected quantity; only its value is counted.`));
      else {
        variance = round2(e.counted - e.expected); vp = pct(variance, e.expected);
        const ratio = e.expected ? e.counted / e.expected : null;
        suspect = ratio && (s.unit_factors || []).find((k) => Math.abs(ratio - k) / k < 0.03 || Math.abs(ratio - 1 / k) / (1 / k) < 0.03);
        if (suspect) f.push(finding('unit_suspect', `${e.item}: counted ${e.counted}, expected ${e.expected} ${e.unit}; that is about ${ratio > 1 ? `${suspect} times` : `1/${suspect} of`} what was expected, which looks like a count in the wrong unit (case, pack or ounce). Recount before trusting the variance.`));
        else if (e.cost !== null) {
          value = round2(variance * e.cost);
          const big = Math.abs(value) >= s.flag_amount && Math.abs(vp ?? 100) >= s.flag_pct; const some = Math.abs(value) >= s.watch_amount || Math.abs(vp ?? 0) >= s.watch_pct;
          const text = `${e.item}: counted ${e.counted}, expected ${e.expected} ${e.unit} (${variance > 0 ? '+' : ''}${variance}, ${vp}%), ${value} at ${e.cost}.`;
          if (big) f.push(finding('big_variance', text, value)); else if (some && variance !== 0) f.push(finding('small_variance', text, value));
          if (value < 0) shrink += value;
        }
      }
      if (e.cost !== null && !suspect) { countedValue += e.counted * e.cost; if (e.expected !== null) expectedValue += e.expected * e.cost; }
    }
    items.push({ item: e.item, sub: e.location, location: e.location, area: e.area, unit: e.unit, counted_qty: e.counted, expected_qty: e.expected, variance_qty: variance, variance_pct: vp, unit_cost: e.cost, variance_cost: value, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { counted_items: items.length, counted_value: round2(countedValue), expected_value: round2(expectedValue), variance_value: round2(countedValue - expectedValue), shrink_value: round2(shrink), recounts: items.filter((i) => i.status === 'flag' || i.status === 'review').length } };
}
