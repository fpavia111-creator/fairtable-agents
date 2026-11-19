# Fixtures

Fictional cash-outs; names are made up. Planted: one bartender short on all four
nights (short, repeat_shorts), a front drawer over by 8 (over), a paid-out with no
receipt (paid_out_no_receipt), a deposit 79.50 less than the count left after the bank
(deposit_mismatch), and a drawer never counted (missing_count).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
