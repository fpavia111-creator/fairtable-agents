# Fairtable ver 1: review

18 Nov 2026, final pass 19 Nov 2026 (section at the end). The Fairtable family (restaurants, bars, cafés, multi-unit food service back office) built to the Mythos ver 6 bar from `BUILD-BRIEF.md`, without input from Kurt. What was built, every check with its numbers, what was found and fixed, what is not checked yet, and every decision made along the way.

## Scope

32 agents named after what they do (`fairtable-<job>`, Kurt's naming rule of 18 Nov; they were built under fruit names first and renamed before any release, see `docs/renamed-2026-11-18.md`) and `fairtable-core`, version 0.1.0 each, in five areas:

| Area | Agents |
|---|---|
| Food, purchasing and the bar (9) | fairtable-food-cost, fairtable-recipe-costs, fairtable-price-creep, fairtable-receiving-credits, fairtable-inventory-counts, fairtable-waste-log, fairtable-pour-cost, fairtable-menu-engineering, fairtable-stockouts |
| Front of house and cash (6) | fairtable-voids-comps, fairtable-discounts-promos, fairtable-cash-drawers, fairtable-gift-cards, fairtable-no-shows, fairtable-catering-deposits |
| Labor (5) | fairtable-tip-pooling, fairtable-overtime, fairtable-schedule-vs-actual, fairtable-labor-dayparts, fairtable-meal-breaks |
| Delivery apps, fees, tax and bills (6) | fairtable-delivery-payouts, fairtable-delivery-marketing, fairtable-card-fees, fairtable-sales-tax, fairtable-duplicate-invoices, fairtable-utility-bills |
| Compliance and multi-unit (6) | fairtable-equipment-maintenance, fairtable-health-inspections, fairtable-food-handler-cards, fairtable-allergen-matrix, fairtable-prime-cost, fairtable-location-comparison |

Every item on the brief's example list has an agent (actual vs theoretical food cost, recipe costing, price creep, invoice vs delivery and credits, count variance, waste, pour cost, comps and voids, discounts, cash over/short, tip pool and tip credit, overtime and split shifts, scheduled vs actual, labor by daypart, delivery payouts, marketing fees, gift cards, sales tax, menu engineering, 86s, no-shows, catering deposits, prime cost, utilities, equipment, inspections, food handler cards, allergens, multi-unit comparison). Three were added: card processing fees (fairtable-card-fees), duplicate invoices and GL coding (fairtable-duplicate-invoices), meal breaks and minors' hours (fairtable-meal-breaks).

Every agent is read and report only. Nothing pays, refunds, charges a card, changes the POS, publishes a schedule, runs payroll, files taxes or sends a message. Each agent writes one kind of draft (memo, letter, dispute, credit request, reminder, proposal) and a one-click request tool records a named person's approval; a person acts on it.

## The ver 6 checklist

| # | Bar | Result |
|---|---|---|
| 1 | One family core (Lodestar pattern), one job per agent, 30+ agents | `fairtable-core` copied from `lodestar-core` (18 Nov Windows fixes included), freight code removed, restaurant modules added. 32 agents, each built with the shared `tableAgent()` kit. |
| 2 | 20+ tests and 15+ eval cases per agent, all pass | 817 tests pass (128 core, 689 agents; fewest per agent 21). 703 eval cases pass (fewest per agent 21, most 24). |
| 3 | `npm run hostile` and `npm run hostile:args`: 0 findings | Both 0 findings. `hostile:args` (data, export and argument passes): 32 agents, 22,092 calls, 2,555 planted values. |
| 4 | Binding actions refused or one named click; release check's one-click policy check passes | Every request tool is in a one-click category (`binding_send`, `go_live`, `move_money`, `accept_learning`) and set to `ask`; release check: "no one-click tool is set to allow". 3 refused tools per agent (96 in all), each an eval case. |
| 5 | Reads exports in the 9 languages; `--lang` for pages | `npm run intl`: every spreadsheet eval case (403) rerun as a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export (legacy encodings, `1.234,56`, local dates, local column names): all pass. Report pages in nine languages (contract test per agent). |
| 6 | Root README in 9 languages; every agent has README, CHANGELOG, LICENSE (MIT) | Done. Agent READMEs are generated from the agent (`scripts/readme-head.mjs`, `scripts/readme-sections.mjs`); `npm run readme:check` passes on Windows. |
| 7 | `npm run bench` (10,000 rows) and `release:check:offline` pass | Bench: 96 tools, 0 need attention. Release check (offline, full) passes. |
| 8 | `npm test` passes on Windows with Node 24 | Node v24.20.0, Windows 10: 817/817. |
| 9 | MCP Registry ready | `node ..\add-mcp-registry.cjs fairtable-agents fairtable.html`: `mcpName` and `server.json` for all 32 agents. |
| 10 | Masking on for personal data; fictional data only | 14 agents have personal fields (staff, guest, client and card holder names, phones, emails). `npm run masking`: 101 fictional personal values planted as canaries, 306 calls, 0 leaks. Every fixture is fictional (Example/Sample company names, made-up people). |

## Checks run, and results

| Check | Result |
|---|---|
| `npm test` (all 33 workspaces, Node 24.20.0, Windows) | 817 tests, 817 pass |
| `npm run evals` | 703 eval cases across 32 agents, all pass (21 to 24 per agent) |
| `npm run hostile` (formulas, HTML, `../` ids, AI-aimed instructions planted in every fixture, every eval case) | 3,515 calls, 2,555 planted values, 142 results flagged for instruction-like text, 0 findings |
| `npm run hostile:args` (data, exports and broken arguments to every tool) | 22,092 calls, 0 findings, under 2 minutes. It first hung: see the core path-length fix below. |
| `npm run intl` (8 languages) | 403 cases with spreadsheet inputs per language, all pass; 320 of 412 column names translated (German count; the rest keep their English names and still match) |
| `npm run masking` | 14 agents, 101 canaries, 306 calls, 0 leaks |
| `npm run bench` (1,000 and 10,000 rows per input file) | 96 tools across 32 agents, all executed at 10,000 rows per file, 0 need attention; mean 374 ms, slowest 1.3 s, peak memory 253 MB. The first run flagged 16 tools growing faster than their input; fixed (see below). Report: `docs/bench-2026-11-18.md` |
| `npm run release:check:offline` | Passes, full run: workspaces, metadata, clean git tree, secret scan (1,025 files), honest copy, one-click categories and policy, 817 tests, 703/703 evals, hostile data and export passes 0 findings, `npm pack` of all 33 packages (597 KB). npm names skipped offline; checked separately (all 33 free). |
| `npm run readme:check`, `npm run plugin:check` | both pass |
| `npm view <name>` for all 33 names (read-only) | all 33 free on npm (E404); see `docs/npm-names-2026-11-18.md` |
| Demos | every `demo` run on its fictional files; output captured in each README |
| Sample reports | `sample-reports/`: an HTML page and a CSV worklist for every agent (64 files) plus `index.html`, all in English, all on fictional data |

## Found and fixed during the build

- **Core, letter case of headers (found by the Fairmake session, ported here):** a header that is a field's own name in another case ("Item" for `item`) was left under its own key, so the agent read a blank column. Re-keyed now, with a core test. Lodestar's fixtures use lowercase names, so its tests never hit it.
- **Core, Italian column words:** "Articolo" was listed for both the item name and the SKU, so in an Italian export the SKU field took the item column. The intl check caught it (fairtable-pour-cost 7 cases, fairtable-duplicate-invoices 5 cases failed in Italian only). Removed from the SKU list.
- **Core, units:** bar recipes say "oz" for fluid ounces; fairtable-pour-cost read them as weight and could not convert. Bar recipes now read `oz` as fluid ounces, and centiliters were added to the core units.
- **fairtable-inventory-counts:** a total named `items` collided with the result's item list (an eval caught it); renamed `counted_items`. Counts that look like the wrong unit were still added to the counted value; they are left out now.
- **fairtable-overtime:** one spread-of-hours finding per day made noisy reports; one finding per week listing the days now.
- **fairtable-equipment-maintenance:** the explain tool's `equipment` argument collided with the `equipment` file argument; renamed `equipment_name`.
- **readme-sections (from Lodestar):** the captured demo output held Windows temp paths, so `readme:check` could never pass on Windows; paths are normalised now.
- **hostile and bench scripts (from Lodestar):** column patterns extended to restaurant files (employee, guest, client, recipe, platform, check, card, account columns), so restaurant ids and names are planted and grown like freight ones were.
- **Eval expectations:** two `not_contains` checks matched a settings key name (`repeat_shorts`, `rate_jump_pct`) instead of a finding; replaced with counts.
- **Speed at 10,000 rows (bench):** five agents compared every row with every other one: fairtable-price-creep scanned every bid per item (39 s), fairtable-delivery-marketing every campaign per charge (121 s), fairtable-equipment-maintenance every service-log line per equipment row (58 s), fairtable-allergen-matrix every recipe line per matrix row (33 s), fairtable-duplicate-invoices every earlier invoice per invoice (31 s), and "By vendor" report sections scanned all rows per vendor (fairtable-receiving-credits 4.7 s). Now indexed once (a `rollup()` helper in the core for report sections); all under 2 s.
- **Core, path length (found by the hostile argument pass):** an `out_dir` of 200,000 characters made Node's recursive `mkdir` loop for ever on Windows, which is why the argument pass never finished before. Paths over 1,024 characters are now refused before any file call, with a core test.
- **Core, after the rename:** the memory and approval checks only accepted one-word tool prefixes, so a fact accepted through `food_cost_accept_learning` was marked unverified and never used (a domain test caught it). Underscores are accepted now. The arg-docs glossary and the scripts read the prefix from the check tool name instead of splitting on the first underscore.
- **hostile:args on Windows:** a fresh temp folder per mutation and replaying every earlier eval case made one agent take many minutes; it now uses one sandbox per tool, replays only draft-writing cases, and still checks for files written beside the root after every call.
- **Fixtures:** fairtable-prime-cost's example prime cost target was so tight that 6 of 8 weeks flagged; the example now uses 65%.
- **Honest copy:** the release check flagged "certified managers" in the root README; reworded to "manager certificates".

## Not checked yet (say this out loud)

- **Export layouts:** the column names for Toast, Square, Clover, Lightspeed, Revel, 7shifts, Homebase, MarginEdge, Restaurant365, xtraCHEF, Sysco, US Foods, DoorDash, Uber Eats, Grubhub, OpenTable and Resy were written from knowledge of those exports (marked `recalled`), not from a live account or the vendors' documentation. The first setup confirms them with `inspect`.
- **Rules:** minimum and tipped wages (defaults are the US federal 7.25 and 2.13), overtime, split-shift, spread-of-hours and break rules, minors' hours, sales tax rates, marketplace facilitator treatment, gift card dormancy, inspection intervals, food handler grace periods and the allergen list are settings with example values. A payroll professional, an employment lawyer, an accountant and the local health department should read the defaults before a client relies on them.
- **Node 20 and 22:** only Node 24 on Windows was run here. `engines` says Node 20 or newer; the CI workflow runs Linux and Windows on 20, 22 and 24.
- **MCP conformance with the official SDK client** (`npm run mcp:check`) was not run: it needs `@modelcontextprotocol/sdk` installed from npm. The zero-dependency stdio server is tested per agent (initialize, list, refuse an unknown tool, audit log).
- **Translations:** root READMEs and report headings in eight languages were written by Claude and not reviewed by native speakers. Agent READMEs, finding texts and sales copy are English only.
- **Real data:** no real restaurant export has been read. Two public datasets were run in the final pass (NYC restaurant inspections, BLS average prices; see Final pass). No restaurateur, accountant, lawyer or health inspector has reviewed the agents.
- **Lost sales, premiums and makeup pay** are arithmetic on the restaurant's own numbers and settings, not forecasts or legal determinations.

## Decisions made without Kurt

- **Names:** first built as `<fruit>-of-<job>`; renamed the same day to `fairtable-<job>` with job-word tool prefixes (`tips_check`, `food_cost_check`) under Kurt's new rule. Display titles are "Fairtable <Job>". All 33 new names are free on npm (`docs/npm-names-2026-11-18.md`).
- **One kit for every agent:** `tableAgent()` gives every agent the same tool shape (check, explain, write_report, draft, one-click request, memory, refused tools), the same report layout and the same row handling (declared columns only, trimmed, sorted), so results never depend on row or column order. Agents only write their own calculation.
- **Masking:** staff names are masked too, not only guests. A manager reading the report file sees real names; the AI model never does. Tokens look like `A.R.#3f9a2c`; explain accepts the token.
- **Memory:** a name-alias kind (invoice item names, vendor names, location names, campaign names) on agents where names differ between files; none on agents whose names are people, because memory refuses personal identifiers.
- **Settings:** every threshold, target and rule is a setting in the customer's JSON file with working defaults; results list `settings_used`. A settings file merges into the defaults per key (a rule set to `[]` switches a default rule off).
- **Delivery-marketplace tax:** marketplace orders are kept on their own line and expected to carry no tax in the POS, because the marketplace usually collects it; tax found there is flagged for review, not as underpayment.
- **Drafts and categories:** letters, memos, disputes and reminders use `binding_send`; menu price and menu proposals use `go_live` (a manager changes the POS); every request is one named click, even in Auto.
- **Pricing (in `sales/`):** below the medical families. Packs from 1,200 to 2,000 for one location, whole restaurant 5,500, small group (2 to 5 locations) 9,500, partner rollout (up to 15 locations, for multi-unit groups, franchise operators and accounting firms) 15,000, support 150 to 300 a month or 200 per location for groups.
- **Pairing:** the site copy says these pair with G6daddy's restaurant-and-bar AI agent (that one talks with guests; these check the back office).

## For the main session

- `sales/site.json` is in the brief's exact shape (10 packages, 5 groups, 32 checks); `sales/pricing-page-ver1.md` has plain-number prices.
- MCP Registry metadata points at `https://fair-agents.com/fairtable.html`; change the page name if the site uses another.
- Nothing was published, pushed, uploaded or sent. All work is in local commits in this folder.

## Final pass (19 Nov 2026)

Run on the request in `FINAL-PASS-REQUEST.md`: the eight-point "Final pass" list in `BUILD-BRIEF.md`, Kurt's five review questions with numbers, and tests on real public data. Everything below was run on Windows 10 with Node 24.20.0, most of it from a fresh clone of this folder after `npm install --offline`. The website summary is `sales/final-pass.json`.

### Final numbers

| Check | Result |
|---|---|
| `npm test` (fresh clone, all 33 workspaces) | 817 tests, 817 pass (128 core, 689 agents; was 808 before this pass) |
| Evals | 703 of 703 cases pass (21 to 24 per agent) |
| Accuracy, planted set (`npm run accuracy`) | 217 of 217 planted problems found, 0 findings that the fixture notes do not list |
| Accuracy, clean set | 0 findings on 490 clean rows (31 of 32 agents; menu engineering has no clean set, see below) |
| Accuracy, one-field mutations | 64 of 64 caught (2 per agent) |
| `npm run hostile` (data and export passes) | 3,515 calls, 4,473 planted values, 0 findings |
| `npm run hostile:args` (run as `hostile-parallel.mjs --args`) | 22,092 calls, 0 findings |
| `npm run intl` | every case that passes in English passes in all 8 other languages (403 cases with spreadsheet inputs) |
| `npm run masking` | 14 agents, 118 fictional personal values as canaries (101 before this pass), 306 calls, 0 leaks |
| `npm run bench` (1,000 and 10,000 rows) | 96 tools. The full run from the fresh clone flagged the 3 health-inspections tools at 116 to 119 s, a slowdown this pass had added; after the fix they take 0.4 to 0.6 s, and a re-run of the 5 changed agents (15 tools) shows 0 needing attention |
| `npm run readme:check`, `plugin:check`, `evals:make --check` | pass, also on the fresh clone (they failed there before this pass, see below) |
| `npm run release:check:offline` | FINAL_RELEASE |
| Real public data | 2 sources, 2 agents (below) |

### The eight points

1. **Names.** `git grep` for every old fruit name outside the rename record (`docs/renamed-2026-11-18.md`) and the changelogs found five leftovers in this review's own history notes; they now use the `fairtable-<job>` names. Packages, bins, tool prefixes, titles and READMEs were already clean.
2. **Read as a buyer.** Every agent README now opens with what it does, what it never does (from the package description), a new **What it needs** list of the files it reads, and the sentence "a person on your team decides and acts on every finding". The fixture notes of 15 agents were wrong or incomplete; they now list every finding the demo data gives (see accuracy below). The demo and sample reports were regenerated.
3. **Honest copy.** The release check's honest-copy scan passes. One fixture used a real brand name for a fire suppression system; it is now "Hood fire suppression". The pricing page, `site.json` and `final-pass.json` contain no compliance, certification, savings or advice claims.
4. **Binding actions.** Unchanged and re-checked by the release check: every draft is `binding_send` or `go_live`, one named click even in Auto; paying, refunding, POS changes, payroll, posting, ordering and filing are refused tools.
5. **The full bar from a clean install.** See the table. The fresh clone found a real problem: Git on Windows checks files out with CRLF line endings, and `readme:check`, `plugin:check`, `evals:make --check` and the intl check compared bytes, so all 32 READMEs and 65 plugin files showed as out of date and `release:check` would have failed on any fresh Windows clone. All four now compare without line endings, as does the new accuracy check.
6. **Fixtures.** All fictional: made-up names, `Example`/`Sample` vendors, 555-01xx phone numbers, `example.test` emails. Real system names appear only where they are the system being read (DoorDash, Uber Eats, Grubhub, OpenTable, Resy as platform values; Visa and Mastercard as card brands on the fictional card statement). Masking now also covers gift card numbers, certificate numbers and employee IDs (below).
7. **`site.json` against the pricing page and the agents.** The 10 packages, prices and agent counts match `sales/pricing-page-ver1.md` (7 + 3 + 6 + 5 + 3 + 4 + 4 single-location agents, with discounts in two packs, 31 in all, plus location comparison = 32). No agent was added or removed.
8. **`npm pack`.** The release check packs all 33 packages; no secrets, no `.fairtable` or `fairtable-out` state, no stray files. Each package now also ships `fixtures/clean/`.

### Question 1: accuracy

`scripts/accuracy.mjs` measures three things per agent, from `scripts/accuracy-specs.mjs`:

- **Planted set:** the demo fixtures. Each `fixtures/README.md` lists what is planted; recall is planted (item, finding) pairs found over pairs listed.
- **Clean set:** `fixtures/clean/`, the same files with every planted problem removed and nothing else changed. Every finding there is a false positive.
- **Mutations:** one edit to the clean set that must raise one named finding, two per agent: 62 change one field in one row, one removes a row (a closing count), one changes two fields of one reservation.

Family result: **217/217 planted found, 0 unplanned, 0 findings on 490 clean rows, 64/64 mutations caught.** Per agent: `docs/accuracy-2026-11-19.md`; every agent is at 100% on all three. What it took to get there:

- The first run on the planted set found **22 findings the fixture notes did not list**. 21 were correct on the data (for example four small over-usages in food cost, the ice machine due for service, a third server with no cash tips declared, Harbor Road's routine inspection past its usual interval); the notes now list them. The notes also named 3 codes the data does not produce (`weekly_ot` for what the agent calls `overtime_high`, `price_up` for fryer oil, which is `small_price_up` under the 25.00 flag amount, and `repeat_reason` for salmon thrown out for two different reasons); corrected. **One finding was wrong**: stockouts watched key lime pie as "86ed before the rush" although it was back at 15:00, three hours before the 18:00 rush. Fixed: an item is watched only if it is still off when the rush starts. A test was added.
- The first run on the clean set gave **2 findings**, both correct on the data: my clean files still had a voids-and-comps rate over the 1.5% watch level and a day with no waste logged. The clean files were corrected, not the agents.
- **Menu engineering** has no clean set: it sorts every dish into star, plowhorse, puzzle or dog against the menu's own averages, so a menu with no labels does not exist. Its one data finding (`no_cost`) is in the planted set and a mutation.
- These are numbers on fictional data built to test the rules. They show the rules do what they are written to do, not how often a real restaurant's exports will produce a wrong or missed finding. That needs real exports.

### Question 2: security, what reaches the model

`scripts/model-view.mjs` runs every check on its fixtures and looks for every fixture value in the JSON the assistant's model receives. Per agent: `docs/model-view-2026-11-19.md`.

- **Masked** (replaced by tokens such as `A.R.#3f9a2c`; the same value always gives the same token, and the report and draft files on disk keep real values): staff names (employee, approver, received_by), guest names, phones and emails, catering clients, gift card holders, and, new in this pass, **gift card numbers** (`card#…`; a Square GAN is a bearer number), **food handler and manager certificate numbers** (`cert#…`) and **employee IDs** (`id#…`). The canary check now plants 118 fictional values in 14 agents: 0 leaks in 306 calls.
- **Sent in clear:** amounts, quantities, dates, times, rates, finding codes; item, recipe, ingredient, vendor, campaign and location names; check, order, invoice, event and reservation numbers; utility account numbers; roles.
- **Free text that could carry personal data:** void, comp, discount, waste and 86 reasons (`fairtable-voids-comps`, `fairtable-waste-log`, `fairtable-stockouts`) and receiving notes (`fairtable-receiving-credits`) are sent as typed. If a server types a guest's name into a void reason, the model sees it. Item and vendor names could also be a person's name (a farmer selling under their own name).
- Results go to whatever model the user's assistant uses. For staff pay, schedule and certificate data, use a model covered by the restaurant's own agreements or a local model. No compliance claim is made. The hostile passes (0 findings in 25,607 calls) and the masking canaries were re-run after the masking change.

### Question 3: compatibility

| Source | Count | How it was made |
|---|---|---|
| Named vendor exports (Toast ×4, Square ×2, Clover, Lightspeed, Revel, 7shifts ×2, Homebase, MarginEdge, Restaurant365 ×2, xtraCHEF, Sysco, US Foods, DoorDash, Uber Eats, Grubhub, OpenTable, Resy) | 23 | Written from knowledge of each vendor's export and its documentation, recalled and **not checked against a real export or the current documents**. None has been tested on a real file. |
| NYC restaurant inspection results (open data CSV) | 1 | Tested on the public file (after grouping its one-row-per-violation layout into one row per inspection) |
| BLS average price series via FRED (CSV) | 1 | Tested on the public files (each month written as one invoice line) |
| Encodings and number formats (Windows-1252 with `1.234,56`, Shift_JIS, semicolons, day-first dates, eight languages of column names) | - | Tested on fictional files only (`npm run intl`) |

`sales/final-pass.json` labels the 23 vendor layouts "written from documentation", the closest of the three labels the site uses. Strictly, they were written from recalled knowledge of the documentation; Kurt may want the site to say so.

### Question 4: commercial traction

None. No paying customers, no design partners and no live checkout for Fairtable (main session's answer for the whole suite).

### Question 5: support, every dated rule

Rules that change with the law or a contract are settings, never code. The defaults are in each agent's `src/logic.js` (`DEFAULTS`). A customer's settings JSON is merged over them key by key, and every result lists `settings_used`. A customer updates a rule by editing that file (each README's Settings table names every key). Customers on a support plan get rule and rate updates from Mythos Machines (Kurt) when they ask; nothing updates itself, and no feed watches for changes. Sources below are named from knowledge at build time; they were **not re-checked against the agencies' sites in this pass** (the US Department of Labor and FDA pages did not load from this machine).

| Agent | Setting (default) | Rule and source | Rule dated |
|---|---|---|---|
| tip-pooling | `full_min_wage` 7.25 | US federal minimum wage, FLSA 29 U.S.C. 206 | in force since 24 Jul 2009 |
| tip-pooling | `tipped_cash_wage` 2.13, `tip_credit_allowed` true | Federal tip credit, FLSA 29 U.S.C. 203(m); seven states allow no tip credit | 2.13 since 1991 |
| tip-pooling | `excluded_roles` managers, supervisors, owners | Employers, managers and supervisors may not keep employees' tips, FLSA 203(m)(2)(B), Consolidated Appropriations Act 2018 | 23 Mar 2018 |
| overtime | `weekly_ot_after` 40, `ot_multiplier` 1.5 | FLSA 29 U.S.C. 207 | 1940 |
| overtime | `daily_ot_after`, `daily_dt_after`, `spread_hours`, `premium_hourly` (empty) | State rules, for example California daily overtime, New York spread of hours | set per state |
| overtime | `clopen_rest_hours` 10 | City and state fair workweek laws (10 or 11 hours) | example |
| meal-breaks | `meal_after_hours` 5, `meal_minutes` 30, `meal_start_by_hours` 5, `second_meal_after_hours` 10, `premium_hours` 1 | Modelled on California Labor Code 512 and 226.7; no federal meal break rule | example |
| meal-breaks | `minor_max_daily_hours.under_16` 3, `minor_latest_end.under_16` 19:00 | Federal child labor rules, 29 CFR 570.35 (3 hours on a school day; 7 p.m., 9 p.m. from 1 June to Labor Day) | 29 CFR 570.35 |
| meal-breaks | `minor_max_daily_hours.under_18` 8, `minor_latest_end.under_18` 22:30, `minimum_wage` (empty) | State rules | example / set per state |
| sales-tax | `marketplace_channels` DoorDash, Uber Eats, Grubhub; rates (none) | State marketplace facilitator laws after South Dakota v. Wayfair | from 2018; rates set per location |
| allergen-matrix | `allergens` the nine major allergens | FALCPA 2004 and the FASTER Act 2021 (sesame from 1 Jan 2023), FDA | 1 Jan 2023 |
| food-handler-cards | `grace_days` 30 | Example: California Health and Safety Code 113948 (card within 30 days of hire); varies by state | example |
| food-handler-cards | `manager_per_location` true | Certified food protection manager, FDA Food Code 2-102.12, as each state adopts it | 2022 Food Code |
| health-inspections | `routine_interval_days` 180, `followup_score` (empty) | Planning estimate, not a published schedule; New York City re-inspects from 14 points | example |
| equipment-maintenance | `default_intervals` (none built in) | Fixture examples follow NFPA 96 (hoods), NFPA 17A (wet chemical systems, 6 months) and NFPA 10 (extinguishers, yearly) | set by the customer |
| gift-cards | `dormancy_months` 24 | Example; the federal CARD Act rule (Regulation E, 12 CFR 1005.20) and state unclaimed property laws differ | example |
| delivery-payouts | commission rates (none) | Each platform contract; some cities cap commissions (New York City's cap made permanent in 2021) | set per contract |
| card-fees | `markup_bps`, `allowed_fees` (none) | The processor contract | set per contract |

### Real data

`node scripts/realdata.mjs --download` fetches the public files into `_realdata/` (git-ignored, not committed); `node scripts/realdata.mjs` converts them, runs the agents, re-counts every finding independently from the same rows and writes `docs/realdata-2026-11-19.json`. No private data was used.

**1. NYC Department of Health and Mental Hygiene, "DOHMH New York City Restaurant Inspection Results"** (NYC Open Data `43nn-pn8j`, public, NYC Open Data terms of use), ZIP code 10003, inspections from 1 Jan 2024, downloaded 19 Nov 2026: 5,479 rows (one per violation) grouped into 1,758 inspections at 648 restaurants, run through `fairtable-health-inspections` as of 18 Nov 2026.

- **Wrong before this pass, now fixed.** NYC scores count violation points (lower is better); the agent assumed higher is better, so 195 restaurants got `score_drop` when their score improved, and real worsenings were missed (110 with the fix). New setting `lower_score_is_better`.
- **Wrong before this pass, now fixed.** NYC calls a routine visit "Cycle Inspection / Initial Inspection"; the agent only knew "Routine", so `routine_due` never fired. New setting `routine_words` (default `routine`, `initial inspection`); re-inspections never count as routine.
- **Wrong before this pass, now fixed.** When two inspections share a date (a cycle inspection and an administrative record), whether a critical violation counted as "open" depended on row order; 35 of 887 re-checks disagreed. A critical violation is now open only if no inspection on a later date exists. A test was added.
- **Noisy, now a setting.** 543 of 648 restaurants had a critical violation at their last inspection with no later inspection, most of them after an A-grade visit that NYC does not re-inspect. New setting `followup_score` (14 for NYC) reports only those at a score that brings a re-inspection: 153.
- **Result with the NYC settings:** 153 `critical_open`, 110 `score_drop`, 236 `routine_due`; **0 disagreements in 499 checks** against an independent re-count from the same rows.
- **`routine_due` against what happened next.** Run as of 18 Nov 2025 with only the earlier inspections, it flagged 199 of 520 restaurants. 57 of them (29%) had a routine inspection within 90 days, against 76 of all 520 (15%). Of the 48 restaurants inspected within 45 days, 36 (75%) had been flagged. A one-year interval is a rough planning guide, not a forecast; NYC's cycle depends on the last grade.

**2. U.S. Bureau of Labor Statistics average retail prices, U.S. city average** (series APU0000708111 eggs, APU0000703112 ground beef, APU0000FF1101 chicken breast, APU0000710212 cheddar, APU0000711211 bananas, APU0000712311 tomatoes, APU0000717311 coffee, APU0000702111 white bread; BLS data, public domain, served by FRED, Federal Reserve Bank of St. Louis), downloaded 19 Nov 2026. The last 13 monthly prices of each item (Sep 2025 to Oct 2026) were written as invoice lines of 20 units from one "vendor" and run through `fairtable-price-creep`.

- `price_up` for ground beef (+6.8%) and tomatoes (+9.1%), the two items up 5% or more; nothing for the six that moved less or fell. Correct.
- **Noisy before this pass, now fixed.** `steady_creep` (three rises in a row anywhere in the file) fired for 7 of 8 items, including eggs (−33.5% over the year), bananas and bread, which ended cheaper. It now needs the run of rises to reach the latest invoice and add up to `creep_min_pct` (default 5%). Result: 1 item, eggs, up three months running at the end of the series. Two tests were added.
- **0 disagreements** with an independent re-count.

**Not tested on real data:** the other 30 agents. Nothing public fits them: POS item sales, timecards, tips, cash drawers, voids, gift cards, reservations, delivery statements, vendor invoices, counts, recipes and card statements are private business records, and no vendor publishes a downloadable sample export we could find without an account. The first customer setup is the first real test.

### Changed in this pass

- `fairtable-stockouts`: `early_86` only when the item is still off when the rush starts.
- `fairtable-health-inspections`: same-day order fixed; `lower_score_is_better`, `routine_words`, `followup_score`; past-due wording; later inspections found by the last date (the first version of the same-day fix compared every pair and took 119 s at 10,000 rows).
- `fairtable-price-creep`: `steady_creep` needs a current run that adds up (`creep_min_pct`).
- Core masking: labelled tokens (`card#`, `cert#`, `id#`); gift card numbers, certificate numbers and employee IDs masked.
- Scripts: `accuracy.mjs` (+ `accuracy-specs.mjs`, `fixtures/clean/` in every agent but one), `realdata.mjs`, `model-view.mjs`; line-ending-safe checks; READMEs gain "What it needs".
- Fixture notes corrected in 15 agents; one fixture brand name replaced.

### For Kurt to decide

- **Format labels on the site:** the 23 vendor layouts are labelled "written from documentation"; they were written from recalled knowledge of the documentation and never checked against a real export. Keep the label, or show "written from documentation, not yet tested on a real export".
- **Rules review:** the dated defaults above (federal wage and tip rules, meal break and minors' rules modelled on California and federal child labor rules, the allergen list) should be read by a payroll or employment professional and a food safety professional before a client relies on them.
- **First real exports:** the accuracy numbers are on fictional data. The most useful next evidence is one restaurant's real Toast or Square exports, run with them at a setup.
