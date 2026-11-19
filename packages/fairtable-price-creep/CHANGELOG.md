# Changelog

## 0.1.0 (unreleased)

- Final pass, from BLS average price series: steady_creep now needs the run of rises to reach the latest invoice and add up to creep_min_pct (default 5%); before, three small rises anywhere in the file were reported, which on real monthly prices fired for 7 of 8 items, including items that ended cheaper.
- Named after what it does: `fairtable-price-creep`, tools `price_creep_*` (built first as `blackberry-of-price-creep`; nothing was published under that name).
- First version (Fairtable ver 1).
