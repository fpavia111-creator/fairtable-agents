# Fixtures

A fictional menu. Planted: Caesar salad declares no fish though its dressing has anchovy
(undeclared_allergen), the gluten-free pasta has a panko topping (free_from_broken,
undeclared_allergen), fish tacos declare shellfish no ingredient has (declared_not_found),
fryer oil has no allergen data (ingredient_no_data), and a seasonal soup on the matrix
has no recipe (no_recipe). The allergen list is an example setting.

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
