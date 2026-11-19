# Fixtures

Fictional delivery-app statement lines and campaigns. Planted: a sponsored listing that
ran 15.00 against a 12.00 budget (over_budget), an ad fee charged after the listing ended
(fee_outside_campaign), an Uber Eats promotion the restaurant never opted into
(not_opted_in), and promotion spend over the 10% target share of sales on DoorDash and,
because of that promotion, on Uber Eats (marketing_share_high, twice).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
