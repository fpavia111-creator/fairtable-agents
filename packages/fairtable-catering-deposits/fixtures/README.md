# Fixtures

Fictional bookings and payments; client names are made up. Planted: a wedding two weeks
out with 1,880 of its 2,880 deposit missing (deposit_missing), an offsite five days past
with its balance unpaid (balance_overdue), a lunch overpaid by 62.50 (overpaid), a party
cancelled 29 days before with its deposit not refunded (cancelled_refund_due), and a check
for an event that is not booked (payment_no_event).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
