# Fixtures

A fictional equipment list and service log. The intervals are example settings, not a
fire code or a manufacturer's schedule. Planted: the hood cleaning and the fire
suppression service overdue (overdue), the grease trap, the extinguishers and the ice
machine due within 30 days (due_soon), a freezer with no service date (no_last_service),
a dish machine with no interval (no_interval), and a walk-in repaired three times in two
months (repeat_repairs).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
