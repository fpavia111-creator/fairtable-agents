# Fixtures

Fictional timecards; names are made up and the break rules are example settings, not any
state's law. Planted: a cook with no meal break on an 8.5-hour shift (missed_meal_break), a
prep cook whose meal started after the 6th hour (late_meal), a dishwasher on a 12.5-hour
day with one meal (missed_second_meal), a 17-year-old with a 20-minute break who worked to
22:45 (short_meal_break, minor_late_shift), and a 15-year-old who worked 6.5 hours until
22:30 (minor_over_hours, minor_late_shift).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
