// Recipe costs at the latest invoice prices: plate cost, food cost % against the target,
// the menu price that would meet the target, and how much each plate rose since the
// earliest price in the file.
import { str, num, round2, isoDate, nameKey, convertQty, normUnit, packSize, pct, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ target_food_cost_pct: 30, category_targets: {}, flag_points: 3, rise_pct: 8, price_step: 0.25 });
const LEVELS = { over_target: 'flag', near_target: 'watch', cost_rose: 'watch', no_price: 'review', unit_mismatch: 'review', no_menu_price: 'review' };

/** Price of one `unit` of an invoice line's item, or null. */
function perUnit(line, unit) {
  const p = num(line.unit_price); if (p === null) return null;
  const pk = packSize(line.pack);
  if (pk) { const q = convertQty(pk.total, pk.unit, unit); return q ? p / q : null; }
  const u = normUnit(line.unit); if (!u) return null;
  const q = convertQty(1, u, unit); return q ? p / q : null;
}

export function recipeCosts({ recipes = [], invoices = [] }, s = DEFAULTS) {
  const lines = new Map();
  for (const l of invoices) { if (!str(l.item) || num(l.unit_price) === null) continue; const k = nameKey(l.item); if (!lines.has(k)) lines.set(k, []); lines.get(k).push(l); }
  for (const list of lines.values()) list.sort((a, b) => cmp(isoDate(a.invoice_date) || '', isoDate(b.invoice_date) || '') || cmp(str(a.invoice_number), str(b.invoice_number)));
  const byRecipe = new Map();
  for (const r of recipes) { if (!str(r.recipe) || !str(r.ingredient)) continue; const k = nameKey(r.recipe); if (!byRecipe.has(k)) byRecipe.set(k, []); byRecipe.get(k).push(r); }
  const items = [];
  for (const rows of byRecipe.values()) {
    const name = str(rows[0].recipe); const f = [];
    const price = rows.map((r) => num(r.menu_price)).find((x) => x !== null) ?? null;
    const category = rows.map((r) => str(r.category)).find(Boolean) || '';
    const target = (s.category_targets && category && s.category_targets[category] !== undefined) ? Number(s.category_targets[category]) : Number(s.target_food_cost_pct);
    let now = 0, then = 0; const parts = [];
    for (const r of rows) {
      const y = num(r.yield_pct); const qty = (num(r.qty) || 0) / (y && y > 0 && y <= 100 ? y / 100 : 1);
      const list = lines.get(nameKey(r.ingredient));
      if (!list) { f.push(finding('no_price', `${str(r.ingredient)} has no invoice price, so ${name} is costed without it.`)); continue; }
      const latest = perUnit(list.at(-1), r.unit), first = perUnit(list[0], r.unit);
      if (latest === null) { f.push(finding('unit_mismatch', `${str(r.ingredient)} is used in ${str(r.unit)} but bought as "${str(list.at(-1).pack) || str(list.at(-1).unit)}"; add a conversion or name the pack.`)); continue; }
      now += qty * latest; then += qty * (first ?? latest);
      parts.push({ ingredient: str(r.ingredient), qty: round2(qty), unit: normUnit(r.unit) || str(r.unit), cost: round2(qty * latest), price_date: isoDate(list.at(-1).invoice_date) });
    }
    const plate = round2(now); const before = round2(then);
    const fc = price ? pct(plate, price) : null;
    const step = Number(s.price_step) || 0.25;
    const atTarget = target > 0 ? Math.ceil(plate / (target / 100) / step) * step : null;
    if (!price) f.push(finding('no_menu_price', `${name} has no menu price in the recipe file, so its food cost % cannot be worked out.`));
    else if (fc > target + Number(s.flag_points)) f.push(finding('over_target', `${name}: plate cost ${plate} is ${fc}% of the ${price} menu price, over the ${target}% target; ${round2(atTarget)} would meet it.`, plate - (target / 100) * price));
    else if (fc > target) f.push(finding('near_target', `${name}: ${fc}% against a ${target}% target.`, plate - (target / 100) * price));
    const rise = before > 0 ? pct(plate - before, before) : null;
    if (rise !== null && rise >= Number(s.rise_pct)) f.push(finding('cost_rose', `${name}: plate cost rose from ${before} to ${plate} (${rise}%) between the earliest and the latest invoice prices.`, plate - before));
    items.push({ recipe: name, category, menu_price: price, plate_cost: plate, food_cost_pct: fc, target_pct: target, price_at_target: atTarget === null ? null : round2(atTarget), earliest_plate_cost: before, cost_change_pct: rise, ingredients: parts, status: statusOf(f, LEVELS), findings: f });
  }
  const priced = items.filter((i) => i.food_cost_pct !== null);
  return { items, totals: { recipes: items.length, over_target: items.filter((i) => i.findings.some((x) => x.code === 'over_target')).length, average_food_cost_pct: priced.length ? round2(priced.reduce((t, i) => t + i.food_cost_pct, 0) / priced.length) : null } };
}
