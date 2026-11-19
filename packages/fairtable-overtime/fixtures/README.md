# Fixtures

A fictional kitchen week; names are made up and the rules are example settings. Planted:
a line cook at 48 hours (overtime_high), a prep cook with a split shift spread over 14
hours (split_shift, spread_of_hours), a dishwasher who closed at 01:00 and opened at 07:00
(clopen) and has a shift with no clock-out (missing_clock_out), and a sous chef at four
10.5-hour days: 40 hours, no weekly overtime, but over the 10-hour spread these settings
pay a premium for (spread_of_hours; daily overtime only under daily rules).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
