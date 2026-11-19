# Fixtures

Fictional recipes and invoices. Planted: Steak Frites over its target after the ribeye
price rose 19% (over_target, cost_rose), Herb Butter with no invoice price (no_price),
House Lemonade just over its target (near_target), Truffle Fries with no menu price and
truffle oil bought by weight but used by volume (no_menu_price, unit_mismatch).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
