# Fixtures

Fictional reservations; every guest name, phone and email is made up. Planted: one guest
who no-showed three times under two name orders and one phone number (repeat_no_show),
a party of eight booked by phone with no deposit (large_party_no_deposit), a party of six
with a deposit and no fee charged (fee_not_charged), and a no-show rate over the target.

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
