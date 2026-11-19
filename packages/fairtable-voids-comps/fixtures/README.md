# Fixtures

Fictional checks at a fictional restaurant; every name is made up. Planted: one server
who approved their own voids, voided a drink after the check was paid and left reasons
blank (self_approved, after_close, no_reason, high_void_rate); a comp over the approval
limit with no approver (no_approver); a whole check voided as a walkout, which also takes
that server's void rate over 3% (full_check_void, high_void_rate).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
