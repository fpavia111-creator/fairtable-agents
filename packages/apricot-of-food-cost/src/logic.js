// Actual against theoretical food cost, per ingredient.
//
// Theoretical use = what the POS says was sold x what the recipe says goes into each
// portion (divided by the recipe's yield). Actual use = opening count + purchases -
// closing count. The gap, priced at the latest unit cost, is what the kitchen used
// beyond the recipes (waste, over-portioning, theft, a recipe that is out of date)
// or, when it is negative, a missed invoice, a count error or a recipe that uses less.
import { str, num, round2, round4, isoDate, nameKey, convertQty, normUnit, packSize, unitPrice, pct, inWindow, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ flag_amount: 50, flag_pct: 10, watch_amount: 25, watch_pct: 5, target_food_cost_pct: 30, period_start: null, period_end: null });

const LEVELS = { over_usage: 'flag', under_usage: 'review', unit_mismatch: 'review', no_open_count: 'review', no_close_count: 'review', not_in_recipes: 'review', item_sold_no_recipe: 'review', purchase_not_matched: 'review', no_unit_cost: 'review', small_over_usage: 'watch', small_under_usage: 'watch' };

/** data: { sales, recipes, counts, purchases } rows; s: settings. */
export function foodCost({ sales = [], recipes = [], counts = [], purchases = [] }, s = DEFAULTS) {
  const dates = counts.map((c) => isoDate(c.count_date)).filter(Boolean).sort();
  const start = isoDate(s.period_start) || dates[0] || null;
  const end = isoDate(s.period_end) || dates.at(-1) || null;
  const inPeriod = (d) => !isoDate(d) || !start || !end || inWindow(d, start, end);

  // Ingredients known from counts (their count unit) and recipes.
  const ing = new Map();
  const get = (name) => { const k = nameKey(name); if (!ing.has(k)) ing.set(k, { item: str(name), unit: null, open: null, close: null, unit_cost: null, purchased: 0, purchase_issue: null, theoretical: 0, uses: [], mismatch: [] }); return ing.get(k); };
  for (const c of counts) {
    if (!str(c.item)) continue;
    const d = isoDate(c.count_date); const g = get(c.item);
    g.unit = g.unit || normUnit(c.unit) || str(c.unit) || null;
    const q = num(c.counted_qty);
    if (d && d === start) g.open = (g.open || 0) + (q || 0);
    if (d && d === end && end !== start) g.close = (g.close || 0) + (q || 0);
    if (num(c.unit_cost) !== null && (d === end || g.unit_cost === null)) g.unit_cost = num(c.unit_cost);
  }
  // Theoretical use from sales x recipes.
  const recipeOf = new Map();
  for (const r of recipes) { if (!str(r.recipe) || !str(r.ingredient)) continue; const k = nameKey(r.recipe); if (!recipeOf.has(k)) recipeOf.set(k, []); recipeOf.get(k).push(r); }
  const sold = new Map(); let netSales = 0;
  for (const x of sales) {
    if (!str(x.item) || !inPeriod(x.date)) continue;
    const k = nameKey(x.item); const q = num(x.qty) || 0; netSales += num(x.net_sales) || 0;
    const e = sold.get(k) || { item: str(x.item), qty: 0, net_sales: 0 }; e.qty += q; e.net_sales += num(x.net_sales) || 0; sold.set(k, e);
  }
  const items = [];
  for (const [k, e] of sold) {
    const rec = recipeOf.get(k);
    if (!rec) { items.push({ item: e.item, sub: 'menu item', kind: 'menu_item', qty_sold: e.qty, net_sales: round2(e.net_sales), status: 'review', findings: [finding('item_sold_no_recipe', `${e.item}: ${e.qty} sold for ${round2(e.net_sales)} but no recipe, so its ingredients are missing from theoretical use.`)] }); continue; }
    for (const r of rec) {
      const g = get(r.ingredient); const y = num(r.yield_pct); const per = (num(r.qty) || 0) / (y && y > 0 && y <= 100 ? y / 100 : 1);
      const want = g.unit || normUnit(r.unit);
      const conv = convertQty(per * e.qty, r.unit, want);
      if (conv === null) { g.mismatch.push(`${e.item} uses ${str(r.qty)} ${str(r.unit)}, counted in ${g.unit || '?'}`); continue; }
      g.theoretical += conv; g.uses.push(e.item);
    }
  }
  // Purchases in the count unit.
  for (const p of purchases) {
    if (!str(p.item) || !inPeriod(p.invoice_date)) continue;
    const k = nameKey(p.item);
    if (!ing.has(k)) { items.push({ item: str(p.item), sub: 'invoice line', kind: 'purchase', invoice_number: str(p.invoice_number), extended: round2(num(p.extended) ?? (num(p.qty) || 0) * (num(p.unit_price) || 0)), status: 'review', findings: [finding('purchase_not_matched', `Invoice ${str(p.invoice_number)} line "${str(p.item)}" matches no counted or recipe ingredient, so it is not in actual use. Teach the agent the name, or add it to the count sheet.`, num(p.extended))] }); continue; }
    const g = ing.get(k); const q = num(p.qty) || 0; const pk = packSize(p.pack);
    let inUnit = null;
    if (pk) inUnit = convertQty(pk.total * q, pk.unit, g.unit || pk.unit);
    else if (normUnit(p.unit)) inUnit = convertQty(q, p.unit, g.unit || normUnit(p.unit));
    if (inUnit === null) { g.purchase_issue = `invoice ${str(p.invoice_number)} pack "${str(p.pack) || str(p.unit)}" cannot be read in ${g.unit || '?'}`; continue; }
    g.purchased += inUnit;
    if (g.unit_cost === null && num(p.unit_price) !== null) { const up = pk ? unitPrice(p.unit_price, pk, g.unit) : num(p.unit_price); if (up !== null) g.unit_cost = up; }
  }
  let theoCost = 0, actCost = 0;
  for (const g of [...ing.values()]) {
    const f = [];
    const theo = round4(g.theoretical);
    const known = g.open !== null && g.close !== null;
    const actual = known ? round4(g.open + g.purchased - g.close) : null;
    if (g.open === null && g.close !== null) f.push(finding('no_open_count', `${g.item} has a closing count but no opening count on ${start}.`));
    if (g.close === null && g.open !== null) f.push(finding('no_close_count', `${g.item} has an opening count but no closing count on ${end}.`));
    if (g.open === null && g.close === null && g.theoretical > 0) f.push(finding('no_close_count', `${g.item} is in recipes but was not counted on ${start} or ${end}.`));
    if (g.mismatch.length) f.push(finding('unit_mismatch', `${g.item}: ${g.mismatch[0]}; weight, volume and each cannot be converted without a conversion in the recipe.`));
    if (g.purchase_issue) f.push(finding('unit_mismatch', `${g.item}: ${g.purchase_issue}.`));
    if (!g.uses.length && !g.mismatch.length && known && actual > 0) f.push(finding('not_in_recipes', `${g.item}: ${round2(actual)} ${g.unit || ''} used but no recipe uses it (oil, garnish or a missing recipe line). It counts in actual cost only.`.replace(' .', '.'), g.unit_cost !== null ? actual * g.unit_cost : null));
    if (g.unit_cost === null && known) f.push(finding('no_unit_cost', `${g.item} has no unit cost on the counts or invoices.`));
    let variance = null, varianceCost = null, variancePct = null;
    if (known && g.uses.length && !g.mismatch.length && !g.purchase_issue) {
      variance = round4(actual - theo); variancePct = pct(variance, theo);
      if (g.unit_cost !== null) {
        varianceCost = round2(variance * g.unit_cost);
        const ac = Math.abs(varianceCost), ap = Math.abs(variancePct ?? 0);
        const big = ac >= s.flag_amount && ap >= s.flag_pct; const some = ac >= s.watch_amount || ap >= s.watch_pct;
        const text = `${g.item}: used ${round2(actual)} ${g.unit} (open ${round2(g.open)} + bought ${round2(g.purchased)} - close ${round2(g.close)}), recipes say ${round2(theo)} for ${g.uses.length} menu item(s). Gap ${round2(variance)} ${g.unit} (${variancePct}%), ${varianceCost} at ${round4(g.unit_cost)} per ${g.unit}.`;
        if (variance > 0) { if (big) f.push(finding('over_usage', text, varianceCost)); else if (some) f.push(finding('small_over_usage', text, varianceCost)); }
        else if (variance < 0) { if (ap >= s.flag_pct) f.push(finding('under_usage', `${text} Less than the recipes: look for a missing invoice, a count error or a recipe that uses less.`, varianceCost)); else if (some) f.push(finding('small_under_usage', text, varianceCost)); }
      }
    }
    if (g.unit_cost !== null && !g.mismatch.length && !g.purchase_issue) { theoCost += theo * g.unit_cost; if (known) actCost += actual * g.unit_cost; }
    items.push({ item: g.item, sub: 'ingredient', kind: 'ingredient', unit: g.unit, open: g.open === null ? null : round2(g.open), purchased: round2(g.purchased), close: g.close === null ? null : round2(g.close), actual_qty: actual === null ? null : round2(actual), theoretical_qty: round2(theo), variance_qty: variance === null ? null : round2(variance), variance_pct: variancePct, unit_cost: g.unit_cost === null ? null : round4(g.unit_cost), variance_cost: varianceCost, used_in: [...new Set(g.uses)].sort(), status: statusOf(f, LEVELS), findings: f });
  }
  const theoretical_cost = round2(theoCost), actual_cost = round2(actCost); const net_sales = round2(netSales);
  const theoretical_pct = pct(theoretical_cost, net_sales), actual_pct = pct(actual_cost, net_sales);
  return {
    items,
    totals: { net_sales, theoretical_cost, actual_cost, gap_cost: round2(actual_cost - theoretical_cost), theoretical_food_cost_pct: theoretical_pct, actual_food_cost_pct: actual_pct, gap_points: theoretical_pct === null || actual_pct === null ? null : Math.round((actual_pct - theoretical_pct) * 10) / 10, over_usage_cost: round2(items.filter((i) => i.variance_cost > 0).reduce((t, i) => t + i.variance_cost, 0)) },
    extra: { period: { start, end }, target_food_cost_pct: s.target_food_cost_pct },
  };
}
