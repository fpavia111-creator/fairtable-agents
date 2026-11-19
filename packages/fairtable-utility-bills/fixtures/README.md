# Fixtures

Fictional utility bills for two fictional locations. Planted: October electricity 45%
over the account's usual use per day (usage_spike), gas billed on estimated reads two
months running (estimated_read, estimated_twice) and then at a 30% higher rate with a late
fee (rate_jump, late_fee), and a September water bill charged twice (duplicate_bill).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
