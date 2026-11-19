# Fixtures

Fictional inspections and permits for three fictional locations; the inspection interval is
an example setting. Planted: Main Street with two critical violations in August and the
re-inspection due 1 September never recorded (reinspection_overdue, critical_open,
score_drop), a liquor licence expired on 1 November (permit_expired), a liquor licence
and a food service permit expiring within 60 days (permit_expiring), a certificate with
no expiry date (no_expiry), the kiosk's next routine visit coming up and Harbor Road's
already past the usual interval (routine_due).

[`clean/`](clean) holds the same files with every planted problem removed and nothing
else changed; the check reports no findings on them. `node scripts/accuracy.mjs` in the
repository measures both sets and the one-field mutation cases.
