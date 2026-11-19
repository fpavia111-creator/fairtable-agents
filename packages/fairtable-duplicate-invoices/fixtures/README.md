# Fixtures

Fictional vendor invoices; the GL accounts and rules are examples. Planted: invoice
EF-50311 entered again a week later (duplicate_number), two produce invoices for the same
amount two days apart (possible_duplicate), tequila coded to food cost and to-go
containers coded to food (gl_miscoded), a salmon line where 2 x 132 is not 246
(line_math), and a linen invoice with no number (missing_number).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
