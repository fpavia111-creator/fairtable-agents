# Fixtures

Two fictional weeks; names are made up and the wage settings are examples, not any
state's current law. Planted: a manager whose card tips were not pooled
(manager_kept_tips), a host paid under the tipped cash wage (below_cash_wage,
tip_credit_shortfall), two servers whose slow second week leaves cash wage plus tips under
the minimum (tip_credit_shortfall), and three server-weeks with card tips and no cash tips
declared (no_cash_declared).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
