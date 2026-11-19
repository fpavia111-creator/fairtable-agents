# Fixtures

Fictional data for one week at a fictional restaurant ("Main Street"). Vendors,
items, prices and counts are made up. Planted on purpose:

- Chicken Breast and Cheddar Cheese used well beyond the recipes (over_usage).
- Cod, frozen fries, ground beef and romaine used 6% to 52% beyond the recipes but under
  the 50.00 flag amount, so only watched (small_over_usage).
- Corn Tortilla used less than the recipes say (under_usage).
- Seasonal Soup sold with no recipe (item_sold_no_recipe).
- Anchovy Paste in the recipe by weight but counted by the tube (unit_mismatch).
- Lemons counted on the opening day only (no_close_count).
- Fryer Oil used but in no recipe (not_in_recipes).
- An invoice line "LEMON 165CT" that matches no ingredient name (purchase_not_matched).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
