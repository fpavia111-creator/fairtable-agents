# Fixtures

A fictional week of schedule and timecards; names are made up. Planted: a line cook
clocking in 30 to 45 minutes early and staying late every day (early_clock_in,
late_clock_out, over_schedule), a server 20 minutes late (late_arrival), a server who
did not come in on Friday (no_show) and a dishwasher shift on Saturday nobody scheduled
(unscheduled_shift, over_schedule).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
