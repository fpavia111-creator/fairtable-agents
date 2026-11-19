# Fixtures

A fictional bar week. Planted: bourbon 35% over its recipe pours (over_pour), triple sec
and vodka a little over (small_over_pour), coffee liqueur with no closing count
(no_close_count), gin used with no drink recipe (not_in_recipes), and a house shot sold
with no recipe (drink_no_recipe).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
