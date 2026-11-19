# Fixtures

A fictional closing count with the system's expected quantity. Planted: chicken,
salmon and vodka well short (big_variance), cheddar half a pound short (small_variance:
11%, under the 10.00 watch amount but over the 5% watch percentage), heavy cream counted
in pints or ounces against quarts (unit_suspect: 72 is 12 x 6), olive oil not counted
(missing_count), tequila counted negative (negative_count), shrimp with no unit cost
(no_cost).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
