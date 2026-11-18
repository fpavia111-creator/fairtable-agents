// The menu's allergen matrix against the recipes: what each dish contains (the union of its
// ingredients' allergens) against what the matrix declares and the free-from claims it makes.
import { str, nameKey, cmp, finding, statusOf } from 'fairtable-core';

export const DEFAULTS = Object.freeze({ allergens: ['milk', 'egg', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soy', 'sesame'], synonyms: { gluten: 'wheat', dairy: 'milk', nuts: 'tree nuts', crustacean: 'shellfish', eggs: 'egg' }, free_from_rules: { 'gluten-free': ['wheat'], 'dairy-free': ['milk'], 'nut-free': ['tree nuts', 'peanuts'] } });
const LEVELS = { undeclared_allergen: 'flag', free_from_broken: 'flag', declared_not_found: 'review', ingredient_no_data: 'review', no_recipe: 'review', not_on_matrix: 'review', unknown_allergen: 'review' };

export function allergens({ recipes = [], ingredients = [], matrix = [] }, s = DEFAULTS) {
  const known = new Set((s.allergens || []).map(nameKey));
  const syn = new Map(Object.entries(s.synonyms || {}).map(([k, v]) => [nameKey(k), nameKey(v)]));
  const unknown = new Set();
  const parse = (text) => str(text).split(/[;,/|]+/).map((x) => nameKey(x)).filter(Boolean).map((x) => syn.get(x) || x).filter((x) => { if (!known.has(x)) unknown.add(x); return true; });
  const ing = new Map(ingredients.filter((i) => str(i.ingredient)).map((i) => [nameKey(i.ingredient), new Set(parse(i.allergens))]));
  const rec = new Map(); for (const r of recipes) { if (!str(r.recipe) || !str(r.ingredient)) continue; const k = nameKey(r.recipe); if (!rec.has(k)) rec.set(k, { name: str(r.recipe), parts: [] }); rec.get(k).parts.push(str(r.ingredient)); }
  const rules = Object.entries(s.free_from_rules || {}).map(([k, v]) => [nameKey(k), v.map((x) => syn.get(nameKey(x)) || nameKey(x))]);
  const items = []; const onMatrix = new Set();
  for (const m of [...matrix].sort((a, b) => cmp(nameKey(a.item), nameKey(b.item)))) {
    if (!str(m.item)) continue; onMatrix.add(nameKey(m.item));
    const f = []; const declared = new Set(parse(m.allergens)); const claims = str(m.free_from).split(/[;,]+/).map((x) => nameKey(x)).filter(Boolean);
    const r = rec.get(nameKey(m.item)); const contains = new Map();
    if (!r) f.push(finding('no_recipe', `${str(m.item)} is on the allergen matrix but has no recipe, so its declarations cannot be checked.`));
    else for (const p of r.parts) { const a = ing.get(nameKey(p)); if (!a) { f.push(finding('ingredient_no_data', `${str(m.item)}: ingredient "${p}" has no allergen data; ask the supplier for its specification sheet.`)); continue; } for (const x of a) { if (!contains.has(x)) contains.set(x, []); contains.get(x).push(p); } }
    for (const [a, from] of [...contains.entries()].sort((x, y) => cmp(x[0], y[0]))) if (!declared.has(a)) f.push(finding('undeclared_allergen', `${str(m.item)} contains ${a} (from ${from.join(', ')}) but the matrix does not declare it.`));
    for (const [claim, banned] of rules) if (claims.includes(claim)) { const hit = banned.filter((b) => contains.has(b)); if (hit.length) f.push(finding('free_from_broken', `${str(m.item)} is marked ${claim} but contains ${hit.map((h) => `${h} (from ${contains.get(h).join(', ')})`).join(', ')}.`)); }
    if (r) for (const d of [...declared].sort()) if (!contains.has(d)) f.push(finding('declared_not_found', `${str(m.item)} declares ${d} but no ingredient on file contains it. Keep it if it is a cross-contact warning; otherwise update the matrix.`));
    items.push({ item: str(m.item), declared: [...declared].sort().join(', '), contains: [...contains.keys()].sort().join(', '), free_from: claims.join(', '), status: statusOf(f, LEVELS), findings: f });
  }
  for (const [k, r] of [...rec.entries()].sort((a, b) => cmp(a[0], b[0]))) if (!onMatrix.has(k)) items.push({ item: r.name, declared: '', contains: '', free_from: '', status: 'review', findings: [finding('not_on_matrix', `${r.name} has a recipe but is not on the allergen matrix.`)] });
  if (unknown.size) items.push({ item: 'Allergen names', declared: '', contains: '', free_from: '', status: 'review', findings: [finding('unknown_allergen', `These allergen names are not in the settings list: ${[...unknown].filter((u) => !known.has(u)).sort().join(', ')}. Add them or a synonym.`)] });
  const real = items.filter((i) => i.item !== 'Allergen names');
  return { items: items.filter((i) => i.item !== 'Allergen names' || [...unknown].some((u) => !known.has(u))), totals: { menu_items: real.length, undeclared: real.reduce((t, i) => t + i.findings.filter((f) => f.code === 'undeclared_allergen').length, 0), broken_claims: real.reduce((t, i) => t + i.findings.filter((f) => f.code === 'free_from_broken').length, 0) } };
}
