# Fixtures

A fictional week of waste logs and daily sales. Planted: chicken breast thrown out
expired three times (high_waste, repeat_reason), salmon thrown out twice for different
reasons (high_waste), fries overproduced on four nights (some_waste, repeat_reason), buns
with no reason (no_reason), a soup batch with no cost (no_value), Thursday 5 Nov with sales
and no waste logged (unlogged_day).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
