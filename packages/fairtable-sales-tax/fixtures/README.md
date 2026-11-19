# Fixtures

A fictional day at three locations; every rate is an example, not a real jurisdiction's
rate. Planted: alcohol at Main Street taxed at the food rate (under_collected), bottled
sauces taxed though grocery is 0% in the settings (over_collected), Uber Eats orders with
tax in the POS although the marketplace collects it (marketplace_tax_in_pos), a tax-exempt
school order to document (exempt_sales) and a kiosk with no rate in the settings
(unknown_location).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
