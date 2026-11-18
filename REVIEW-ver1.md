# Fairtable ver 1: review

18 Nov 2026. The Fairtable family (restaurants, bars, cafés, multi-unit food service back office) built to the Mythos ver 6 bar from `BUILD-BRIEF.md`, without input from Kurt. What was built, every check with its numbers, what was found and fixed, what is not checked yet, and every decision made along the way.

## Scope

32 agents (fruit names) and `fairtable-core`, version 0.1.0 each, in five areas:

| Area | Agents |
|---|---|
| Food, purchasing and the bar (9) | apricot-of-food-cost, banana-of-recipe-costs, blackberry-of-price-creep, blueberry-of-deliveries, cherry-of-counts, clementine-of-waste, coconut-of-pours, lime-of-menu-mix, lychee-of-stockouts |
| Front of house and cash (6) | cranberry-of-voids, date-of-discounts, elderberry-of-drawers, kumquat-of-gift-cards, mango-of-no-shows, melon-of-catering |
| Labor (5) | fig-of-tip-pools, grape-of-overtime, guava-of-schedules, huckleberry-of-dayparts, raspberry-of-breaks |
| Delivery apps, fees, tax and bills (6) | jackfruit-of-delivery-payouts, kiwi-of-marketing-fees, plum-of-card-fees, lemon-of-sales-tax, quince-of-invoices, nectarine-of-utilities |
| Compliance and multi-unit (6) | olive-of-equipment, orange-of-inspections, papaya-of-food-handlers, peach-of-allergens, mulberry-of-prime-cost, pear-of-locations |

Every item on the brief's example list has an agent (actual vs theoretical food cost, recipe costing, price creep, invoice vs delivery and credits, count variance, waste, pour cost, comps and voids, discounts, cash over/short, tip pool and tip credit, overtime and split shifts, scheduled vs actual, labor by daypart, delivery payouts, marketing fees, gift cards, sales tax, menu engineering, 86s, no-shows, catering deposits, prime cost, utilities, equipment, inspections, food handler cards, allergens, multi-unit comparison). Three were added: card processing fees (plum), duplicate invoices and GL coding (quince), meal breaks and minors' hours (raspberry).

Every agent is read and report only. Nothing pays, refunds, charges a card, changes the POS, publishes a schedule, runs payroll, files taxes or sends a message. Each agent writes one kind of draft (memo, letter, dispute, credit request, reminder, proposal) and a one-click request tool records a named person's approval; a person acts on it.

## The ver 6 checklist

| # | Bar | Result |
|---|---|---|
| 1 | One family core (Lodestar pattern), one job per agent, 30+ agents | `fairtable-core` copied from `lodestar-core` (18 Nov Windows fixes included), freight code removed, restaurant modules added. 32 agents, each built with the shared `tableAgent()` kit. |
| 2 | 20+ tests and 15+ eval cases per agent, all pass | 807 tests pass (125 core, 682 agents; fewest per agent 21). 703 eval cases pass (fewest per agent 21, most 24). |
| 3 | `npm run hostile` and `npm run hostile:args`: 0 findings | Data pass: 0 findings (3,515 calls, 2,555 planted values). Argument pass: see below. |
| 4 | Binding actions refused or one named click; release check's one-click policy check passes | Every request tool is in a one-click category (`binding_send`, `go_live`, `move_money`, `accept_learning`) and set to `ask`; release check: "no one-click tool is set to allow". 3 refused tools per agent (96 in all), each an eval case. |
| 5 | Reads exports in the 9 languages; `--lang` for pages | `npm run intl`: every spreadsheet eval case (403) rerun as a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export (legacy encodings, `1.234,56`, local dates, local column names): all pass. Report pages in nine languages (contract test per agent). |
| 6 | Root README in 9 languages; every agent has README, CHANGELOG, LICENSE (MIT) | Done. Agent READMEs are generated from the agent (`scripts/readme-head.mjs`, `scripts/readme-sections.mjs`); `npm run readme:check` passes on Windows. |
| 7 | `npm run bench` (10,000 rows) and `release:check:offline` pass | See below. |
| 8 | `npm test` passes on Windows with Node 24 | Node v24.20.0, Windows 10: 807/807. |
| 9 | MCP Registry ready | `node ..\add-mcp-registry.cjs fairtable-agents fairtable.html`: `mcpName` and `server.json` for all 32 agents. |
| 10 | Masking on for personal data; fictional data only | 14 agents have personal fields (staff, guest, client and card holder names, phones, emails). `npm run masking`: 101 fictional personal values planted as canaries, 306 calls, 0 leaks. Every fixture is fictional (Example/Sample company names, made-up people). |

## Checks run, and results

| Check | Result |
|---|---|
| `npm test` (all 33 workspaces, Node 24.20.0, Windows) | 807 tests, 807 pass |
| `npm run evals` | 703 eval cases across 32 agents, all pass (21 to 24 per agent) |
| `npm run hostile` (formulas, HTML, `../` ids, AI-aimed instructions planted in every fixture, every eval case) | 3,515 calls, 2,555 planted values, 142 results flagged for instruction-like text, 0 findings |
| `npm run hostile:args` | HOSTILE_ARGS_RESULT |
| `npm run intl` (8 languages) | 403 cases with spreadsheet inputs per language, all pass; 320 of 412 column names translated (German count; the rest keep their English names and still match) |
| `npm run masking` | 14 agents, 101 canaries, 306 calls, 0 leaks |
| `npm run bench` (1,000 and 10,000 rows per input file) | 96 tools across 32 agents, all executed at 10,000 rows per file, 0 need attention; mean 533 ms, slowest 1.8 s (melon explain), peak memory 261 MB. The first run flagged 16 tools growing faster than their input; fixed (see below). Report: `docs/bench-2026-11-18.md` |
| `npm run release:check:offline` | RELEASE_RESULT |
| `npm run readme:check`, `npm run plugin:check` | both pass |
| `npm view <name>` for all 33 names (read-only) | all 33 free on npm (E404); see `docs/npm-names-2026-11-18.md` |
| Demos | every `demo` run on its fictional files; output captured in each README |
| Sample reports | `sample-reports/`: an HTML page and a CSV worklist for every agent (64 files) plus `index.html`, all in English, all on fictional data |

## Found and fixed during the build

- **Core, letter case of headers (found by the Fairmake session, ported here):** a header that is a field's own name in another case ("Item" for `item`) was left under its own key, so the agent read a blank column. Re-keyed now, with a core test. Lodestar's fixtures use lowercase names, so its tests never hit it.
- **Core, Italian column words:** "Articolo" was listed for both the item name and the SKU, so in an Italian export the SKU field took the item column. The intl check caught it (coconut 7 cases, quince 5 cases failed in Italian only). Removed from the SKU list.
- **Core, units:** bar recipes say "oz" for fluid ounces; coconut read them as weight and could not convert. Bar recipes now read `oz` as fluid ounces, and centiliters were added to the core units.
- **cherry-of-counts:** a total named `items` collided with the result's item list (an eval caught it); renamed `counted_items`. Counts that look like the wrong unit were still added to the counted value; they are left out now.
- **grape-of-overtime:** one spread-of-hours finding per day made noisy reports; one finding per week listing the days now.
- **olive-of-equipment:** the explain tool's `equipment` argument collided with the `equipment` file argument; renamed `equipment_name`.
- **readme-sections (from Lodestar):** the captured demo output held Windows temp paths, so `readme:check` could never pass on Windows; paths are normalised now.
- **hostile and bench scripts (from Lodestar):** column patterns extended to restaurant files (employee, guest, client, recipe, platform, check, card, account columns), so restaurant ids and names are planted and grown like freight ones were.
- **Eval expectations:** two `not_contains` checks matched a settings key name (`repeat_shorts`, `rate_jump_pct`) instead of a finding; replaced with counts.
- **Speed at 10,000 rows (bench):** five agents compared every row with every other one: blackberry scanned every bid per item (39 s), kiwi every campaign per charge (121 s), olive every service-log line per equipment row (58 s), peach every recipe line per matrix row (33 s), quince every earlier invoice per invoice (31 s), and "By vendor" report sections scanned all rows per vendor (blueberry 4.7 s). Now indexed once (a `rollup()` helper in the core for report sections); all under 2 s.
- **Fixtures:** mulberry's example prime cost target was so tight that 6 of 8 weeks flagged; the example now uses 65%.
- **Honest copy:** the release check flagged "certified managers" in the root README; reworded to "manager certificates".

## Not checked yet (say this out loud)

- **Export layouts:** the column names for Toast, Square, Clover, Lightspeed, Revel, 7shifts, Homebase, MarginEdge, Restaurant365, xtraCHEF, Sysco, US Foods, DoorDash, Uber Eats, Grubhub, OpenTable and Resy were written from knowledge of those exports (marked `recalled`), not from a live account or the vendors' documentation. The first setup confirms them with `inspect`.
- **Rules:** minimum and tipped wages (defaults are the US federal 7.25 and 2.13), overtime, split-shift, spread-of-hours and break rules, minors' hours, sales tax rates, marketplace facilitator treatment, gift card dormancy, inspection intervals, food handler grace periods and the allergen list are settings with example values. A payroll professional, an employment lawyer, an accountant and the local health department should read the defaults before a client relies on them.
- **Node 20 and 22:** only Node 24 on Windows was run here. `engines` says Node 20 or newer; the CI workflow runs Linux and Windows on 20, 22 and 24.
- **MCP conformance with the official SDK client** (`npm run mcp:check`) was not run: it needs `@modelcontextprotocol/sdk` installed from npm. The zero-dependency stdio server is tested per agent (initialize, list, refuse an unknown tool, audit log).
- **Translations:** root READMEs and report headings in eight languages were written by Claude and not reviewed by native speakers. Agent READMEs, finding texts and sales copy are English only.
- **Real data:** no real restaurant export has been read. No restaurateur, accountant, lawyer or health inspector has reviewed the agents.
- **Lost sales, premiums and makeup pay** are arithmetic on the restaurant's own numbers and settings, not forecasts or legal determinations.

## Decisions made without Kurt

- **Names and count:** 32 agents named `<fruit>-of-<job>`, alphabetical by fruit from apricot to raspberry; all 33 names are free on npm.
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
