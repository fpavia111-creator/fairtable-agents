# Changelog

## 0.1.0 (unreleased)

- Final pass, from New York City's public inspection file: a later inspection on the same day no longer decides whether a critical violation is open (the result depended on row order); new settings lower_score_is_better (scores that count violation points), routine_words (Cycle Inspection / Initial Inspection counts as routine; re-inspections never do) and followup_score (report criticals as open only at a score that brings a re-inspection); a past-due routine visit is worded as past due.
- Named after what it does: `fairtable-health-inspections`, tools `inspections_*` (built first as `orange-of-inspections`; nothing was published under that name).
- First version (Fairtable ver 1).
