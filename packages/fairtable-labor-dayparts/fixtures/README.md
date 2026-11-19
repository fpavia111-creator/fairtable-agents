# Fixtures

One fictional day of hourly sales and timecards; names are made up. Planted: an
afternoon with six people on the clock and 60 in sales (labor_over_target, low_splh),
prep before opening with no sales (labor_no_sales), and a catering sale with no time
(sales_no_time).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
