// Menu engineering (the popularity x contribution margin grid), per category.
// Popularity: an item's share of the category's count against 70% of an even share.
// Margin: the item's contribution margin (average price - plate cost) against the
// category's weighted average margin.
import { str, num, round2, nameKey, pct, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ popularity_factor: 0.7, by_category: true });
const LEVELS = { dog: 'review', plowhorse: 'watch', puzzle: 'watch', no_cost: 'review' };
const ADVICE = { star: 'keep it visible and keep the recipe and price steady', plowhorse: 'popular but earns less than average: check the portion and plate cost, or a small price step', puzzle: 'earns well but sells little: move it on the menu, rename it, or have servers suggest it', dog: 'sells little and earns less than average: consider replacing it unless it serves a purpose (a vegetarian option, a signature)' };

export function menuMix({ sales = [], costs = [] }, s = DEFAULTS) {
  const cost = new Map(costs.filter((c) => str(c.item)).map((c) => [nameKey(c.item), num(c.plate_cost)]));
  const items = new Map();
  for (const x of sales) { if (!str(x.item)) continue; const k = nameKey(x.item); const e = items.get(k) || { item: str(x.item), category: str(x.category) || '(none)', qty: 0, sales: 0 }; e.qty += num(x.qty) || 0; e.sales += num(x.net_sales) || 0; items.set(k, e); }
  const groups = new Map(); for (const e of items.values()) { const g = s.by_category ? e.category : 'All items'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(e); }
  const out = []; let totalMargin = 0;
  for (const [g, list] of [...groups.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const qty = list.reduce((t, e) => t + e.qty, 0);
    const priced = list.filter((e) => cost.get(nameKey(e.item)) !== undefined && cost.get(nameKey(e.item)) !== null && e.qty > 0);
    const marginSum = priced.reduce((t, e) => t + (e.sales - e.qty * cost.get(nameKey(e.item))), 0); const pricedQty = priced.reduce((t, e) => t + e.qty, 0);
    const avgCm = pricedQty ? marginSum / pricedQty : 0; const threshold = list.length ? (1 / list.length) * s.popularity_factor * 100 : 0;
    totalMargin += marginSum;
    for (const e of list.sort((a, b) => cmp(nameKey(a.item), nameKey(b.item)))) {
      const f = []; const c = cost.get(nameKey(e.item)); const mix = pct(e.qty, qty); const price = e.qty ? e.sales / e.qty : null;
      let quadrant = null, cm = null;
      if (c === undefined || c === null) f.push(finding('no_cost', `${e.item} has no plate cost, so its margin and quadrant are unknown.`));
      else if (price !== null) {
        cm = round2(price - c); const pop = mix >= threshold; const high = cm >= avgCm;
        quadrant = pop && high ? 'star' : pop ? 'plowhorse' : high ? 'puzzle' : 'dog';
        if (quadrant !== 'star') f.push(finding(quadrant, `${e.item} (${g}): ${mix}% of the category's sales count against a ${round2(threshold)}% bar, margin ${cm} against an average of ${round2(avgCm)}: ${quadrant}, ${ADVICE[quadrant]}.`, quadrant === 'dog' ? e.qty * cm : null));
      }
      out.push({ item: e.item, category: g, qty: e.qty, net_sales: round2(e.sales), average_price: price === null ? null : round2(price), plate_cost: c ?? null, contribution_margin: cm, total_margin: cm === null ? null : round2(cm * e.qty), mix_pct: mix, popularity_bar_pct: round2(threshold), category_average_margin: round2(avgCm), quadrant, status: statusOf(f, LEVELS), findings: f });
    }
  }
  const count = (q) => out.filter((i) => i.quadrant === q).length;
  return { items: out, totals: { menu_items: out.length, total_margin: round2(totalMargin), stars: count('star'), plowhorses: count('plowhorse'), puzzles: count('puzzle'), dogs: count('dog') } };
}
