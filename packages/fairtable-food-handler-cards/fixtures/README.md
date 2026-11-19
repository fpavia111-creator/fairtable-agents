# Fixtures

A fictional roster and certificates; names are made up and the grace period is an example
setting. Planted: a prep cook hired 45 days ago with no card (missing_card), a dishwasher
hired 10 days ago (in_grace_period), a sous chef whose food handler card expired
(expired) and whose manager certificate expires in 16 days (expiring_soon), a line cook
whose card expires in 25 days (expiring_soon), a server with no alcohol server certificate
(alcohol_cert_missing), Harbor Road's only certified manager expired in May (expired,
no_certified_manager), and an inactive employee who is ignored.

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
