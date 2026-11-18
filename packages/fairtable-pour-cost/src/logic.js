// Bar pour cost and liquor variance, per spirit, in bottles.
// Theoretical = drinks sold x recipe pour. Actual = opening count + bottles bought -
// closing count (partial bottles in tenths, as most bars count). Pour cost = cost of the
// liquor actually used / bar sales.
import { str, num, round2, round4, isoDate, nameKey, convertQty, normUnit, packSize, pct, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ flag_amount: 30, flag_pct: 10, watch_amount: 10, watch_pct: 5, target_pour_cost_pct: 20, default_bottle_ml: 750 });
const LEVELS = { over_pour: 'flag', small_over_pour: 'watch', under_pour: 'review', no_close_count: 'review', no_open_count: 'review', not_in_recipes: 'review', drink_no_recipe: 'review', pour_cost_over_target: 'flag', unit_mismatch: 'review' };

export function pours({ sales = [], recipes = [], counts = [], purchases = [] }, s = DEFAULTS) {
  const dates = counts.map((c) => isoDate(c.count_date)).filter(Boolean).sort();
  const start = dates[0] || null, end = dates.at(-1) || null;
  const sp = new Map(); const get = (n) => { const k = nameKey(n); if (!sp.has(k)) sp.set(k, { item: str(n), size: null, cost: null, open: null, close: null, bought: 0, theo_ml: 0, uses: new Set(), mismatch: null }); return sp.get(k); };
  for (const c of counts) { if (!str(c.item)) continue; const g = get(c.item); const d = isoDate(c.count_date); g.size = num(c.size_ml) || g.size; if (num(c.unit_cost) !== null) g.cost = num(c.unit_cost); const q = num(c.counted_qty); if (d === start) g.open = (g.open || 0) + (q || 0); if (d === end && end !== start) g.close = (g.close || 0) + (q || 0); }
  const rec = new Map(); for (const r of recipes) { if (!str(r.recipe) || !str(r.ingredient)) continue; const k = nameKey(r.recipe); if (!rec.has(k)) rec.set(k, []); rec.get(k).push(r); }
  const items = []; let barSales = 0;
  const sold = new Map(); for (const x of sales) { if (!str(x.item)) continue; const k = nameKey(x.item); const e = sold.get(k) || { item: str(x.item), qty: 0, net: 0 }; e.qty += num(x.qty) || 0; e.net += num(x.net_sales) || 0; barSales += num(x.net_sales) || 0; sold.set(k, e); }
  for (const [k, e] of sold) {
    const r = rec.get(k);
    if (!r) { items.push({ item: e.item, sub: 'drink', qty_sold: e.qty, net_sales: round2(e.net), status: 'review', findings: [finding('drink_no_recipe', `${e.item}: ${e.qty} sold for ${round2(e.net)} with no recipe, so its pours are missing from theoretical use.`)] }); continue; }
    for (const line of r) { const g = get(line.ingredient); const ml = convertQty((num(line.qty) || 0) * e.qty, normUnit(line.unit) === 'oz' ? 'floz' : line.unit, 'ml'); if (ml === null) { g.mismatch = `${e.item} pours "${str(line.unit)}"`; continue; } g.theo_ml += ml; g.uses.add(e.item); }
  }
  for (const p of purchases) {
    if (!str(p.item)) continue; const g = sp.get(nameKey(p.item)); if (!g) continue;
    const pk = packSize(p.pack); const size = g.size || s.default_bottle_ml; const q = num(p.qty) || 0;
    if (pk) { const ml = convertQty(pk.total * q, pk.unit, 'ml'); if (ml !== null) g.bought += ml / size; else if (pk.unit === 'ea') g.bought += pk.total * q; }
    else g.bought += q;
  }
  let actualCost = 0, theoCost = 0;
  for (const g of sp.values()) {
    const f = []; const size = g.size || s.default_bottle_ml;
    const theoB = round4(g.theo_ml / size); const known = g.open !== null && g.close !== null;
    const actB = known ? round4(g.open + g.bought - g.close) : null;
    let varB = null, varPct = null, varCost = null;
    if (g.open !== null && g.close === null) f.push(finding('no_close_count', `${g.item}: opening count ${g.open} but no closing count on ${end}.`));
    if (g.open === null && g.close !== null) f.push(finding('no_open_count', `${g.item}: closing count but no opening count on ${start}.`));
    if (g.mismatch) f.push(finding('unit_mismatch', `${g.item}: ${g.mismatch}, which cannot be read as a volume.`));
    if (known && !g.uses.size && actB > 0) f.push(finding('not_in_recipes', `${g.item}: ${round2(actB)} bottle(s) used and no drink recipe uses it (a missing recipe, a spill, or pours rung under another button).`, g.cost !== null ? actB * g.cost : null));
    if (known && g.uses.size && !g.mismatch) {
      varB = round4(actB - theoB); varPct = pct(varB, theoB);
      if (g.cost !== null) {
        varCost = round2(varB * g.cost);
        const text = `${g.item}: used ${round2(actB)} bottles (open ${g.open} + bought ${round2(g.bought)} - close ${g.close}), pours say ${round2(theoB)} (${round2(g.theo_ml / 29.5735295625)} oz). Gap ${round2(varB)} bottles (${varPct}%), ${varCost} at ${g.cost} a bottle.`;
        const big = Math.abs(varCost) >= s.flag_amount && Math.abs(varPct) >= s.flag_pct; const some = Math.abs(varCost) >= s.watch_amount || Math.abs(varPct) >= s.watch_pct;
        if (varB > 0 && big) f.push(finding('over_pour', text, varCost));
        else if (varB > 0 && some) f.push(finding('small_over_pour', text, varCost));
        else if (varB < 0 && Math.abs(varPct) >= s.flag_pct) f.push(finding('under_pour', `${text} Less than the pours: a missing invoice or a count error.`, varCost));
      }
    }
    if (g.cost !== null && known) actualCost += actB * g.cost;
    if (g.cost !== null && !g.mismatch) theoCost += theoB * g.cost;
    items.push({ item: g.item, sub: 'spirit', bottle_ml: size, open: g.open, bought: round2(g.bought), close: g.close, actual_bottles: actB === null ? null : round2(actB), theoretical_bottles: round2(theoB), variance_bottles: varB === null ? null : round2(varB), variance_pct: varPct, unit_cost: g.cost, variance_cost: varCost, used_in: [...g.uses].sort(), status: statusOf(f, LEVELS), findings: f });
  }
  const pc = pct(actualCost, barSales), tpc = pct(theoCost, barSales);
  if (pc !== null && pc > s.target_pour_cost_pct) items.push({ item: 'Pour cost', sub: 'total', status: 'flag', findings: [finding('pour_cost_over_target', `Pour cost ${pc}% (liquor used ${round2(actualCost)} on bar sales ${round2(barSales)}) is over the ${s.target_pour_cost_pct}% target; the recipes alone would give ${tpc}%.`, actualCost - (s.target_pour_cost_pct / 100) * barSales)] });
  return { items, totals: { bar_sales: round2(barSales), liquor_cost_actual: round2(actualCost), liquor_cost_theoretical: round2(theoCost), pour_cost_pct: pc, theoretical_pour_cost_pct: tpc, variance_cost: round2(actualCost - theoCost) }, extra: { period: { start, end }, target_pour_cost_pct: s.target_pour_cost_pct } };
}
