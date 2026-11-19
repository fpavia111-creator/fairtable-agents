# Fixtures

A fictional week of the 86 board and item sales. Planted: short rib 86ed three nights,
once at 17:15 and still off when the rush started (repeated_86, early_86, long_86),
oysters 86ed with no time back (long_86, never_returned). Not problems, and not reported:
key lime pie off for an hour at lunch and back before the rush, and fish tacos out for the
last half hour.

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
