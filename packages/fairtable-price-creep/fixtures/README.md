# Fixtures

Fictional invoices from three fictional vendors over five weeks, and a bid sheet.
Planted: ground beef rising four weeks running (steady_creep, price_up), salmon over the
bid price (over_contract, price_up), fryer oil over the bid price but 18.00 extra in all,
under the 25.00 flag amount (over_contract, small_price_up), chicken breast in a smaller
pack at the same case price, so more per pound (pack_changed, price_up), avocados up 3%
(below the threshold), romaine down.

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
