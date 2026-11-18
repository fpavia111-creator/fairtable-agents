# Fairtable restaurant agents

[Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

Thirty-two small MCP agents for the back office of restaurants, bars, cafes and multi-unit groups. Each one owns **one job**, such as actual against theoretical food cost, tip pool math, delivery-app payouts or the allergen matrix, and cannot act outside it. They read the files you already export from Toast, Square, Clover, Lightspeed, Revel, 7shifts, Homebase, MarginEdge, Restaurant365, xtraCHEF, Sysco and US Foods invoices, DoorDash, Uber Eats and Grubhub statements, OpenTable and Resy; write their reports on your computer; and wait for one named person before anything that moves money, sends a message or changes a live system.

Part of Fair Agents by Mythos Machines. MIT licence · Node 20 or newer · local files only · no credentials · no runtime dependencies. The software is free; the paid part is a fixed-price setup on your own files.

## Try one

```bash
npx -y apricot-of-food-cost demo        # actual against theoretical food cost, fictional data
npx -y jackfruit-of-delivery-payouts demo   # delivery-app payouts against orders
```

Every agent has a `demo` on fictional files, an `eval` with its own test cases and an MCP server (`npx -y <agent> mcp --root <folder>`) for Claude Desktop, Claude Code, Cursor and other MCP hosts.

## The agents

**Food, purchasing and the bar (9):** `apricot-of-food-cost` (actual against theoretical food cost), `banana-of-recipe-costs` (recipes costed at the latest invoice prices), `blackberry-of-price-creep` (vendor price creep, prices over your bid, shrinking packs), `blueberry-of-deliveries` (invoices against the receiving log and credit memos), `cherry-of-counts` (inventory count variance and unit mistakes), `clementine-of-waste` (waste log against sales), `coconut-of-pours` (bar pour cost and liquor variance), `lime-of-menu-mix` (menu engineering: stars, plowhorses, puzzles, dogs), `lychee-of-stockouts` (items 86ed and the sales they cost).

**Front of house and cash (6):** `cranberry-of-voids` (voids and comps by employee), `date-of-discounts` (discounts and promotions against your promo list), `elderberry-of-drawers` (cash over and short by drawer, deposits), `kumquat-of-gift-cards` (gift card liability), `mango-of-no-shows` (reservation no-shows, deposits and fees), `melon-of-catering` (catering deposits and balances).

**Labor (5):** `fig-of-tip-pools` (tip pool shares and the tip credit, with settings per state), `grape-of-overtime` (overtime, double time, split shifts, spread of hours, clopens), `guava-of-schedules` (scheduled against actual labor), `huckleberry-of-dayparts` (labor percentage by daypart), `raspberry-of-breaks` (meal breaks and minors' hours).

**Delivery apps, fees, tax and bills (6):** `jackfruit-of-delivery-payouts` (DoorDash, Uber Eats and Grubhub payouts against orders and contract rates), `kiwi-of-marketing-fees` (delivery marketing against the campaigns you opted into), `plum-of-card-fees` (card processing fees and effective rate), `lemon-of-sales-tax` (sales tax by jurisdiction and category), `quince-of-invoices` (duplicate invoices and GL coding), `nectarine-of-utilities` (utility bills).

**Compliance and multi-unit (6):** `olive-of-equipment` (equipment maintenance schedule), `orange-of-inspections` (health inspection and permit calendar), `papaya-of-food-handlers` (food handler cards and food protection manager certificates), `peach-of-allergens` (allergen matrix against recipes), `mulberry-of-prime-cost` (weekly prime cost by location), `pear-of-locations` (every location against the group median).

They pair with the restaurant-and-bar AI agent from G6daddy: that agent talks with guests, these check the back office.

## How they stay safe

- **One job each.** Every agent has its own tool allowlist; any other tool name, including ones a model invents, is blocked.
- **Nothing binding happens on its own.** No agent pays, refunds, charges a card, changes the POS, publishes a schedule, runs payroll, files taxes or sends a message. Paying, sending and changing a live system are refused outright or wait for one named person's click, even in Auto mode. Drafts are written to a file marked DRAFT; approving one records the decision, and a person acts on it.
- **Personal data is masked.** Staff, guest and client names, phone numbers and emails are replaced with tokens such as `A.R.#3f9a2c` in everything returned to the AI model. The report and draft files written on your computer keep the real values, so keep them in a private folder.
- **Local files only.** No network calls, no telemetry, no credentials. Every call goes to a hash-chained audit log under `.fairtable/`.
- **Your rules, not ours.** Targets, thresholds, wage figures, tax rates, break rules, inspection intervals and allergen lists are settings in your own file. The defaults are working examples; the result always says which settings it used.

## Use with Claude Code

```bash
claude mcp add apricot-of-food-cost -- npx -y apricot-of-food-cost mcp --root .
```

or add this repository as a plugin marketplace and install the agents you want (`.claude-plugin/marketplace.json`).

## Develop

```bash
npm install
npm test                      # every package (core and 32 agents)
npm run evals                 # every agent's private eval cases
npm run hostile               # planted formulas, HTML, path tricks and AI-directed text
npm run hostile:args          # broken arguments to every tool
npm run bench                 # 1,000 and 10,000 rows per input file
npm run intl                  # every spreadsheet eval case as a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export
npm run masking               # no staff or guest name reaches the model
npm run release:check:offline # metadata, honest copy, secrets, one-click policy, npm pack
node scripts/new-agent.mjs <fruit>-of-<job> "<description>"   # scaffold a new agent
```

## How they are tested

See [REVIEW-ver1.md](REVIEW-ver1.md) for every check with its numbers. In short: 806 tests (21 or more per agent) and 703 eval cases (21 or more per agent) pass on Windows with Node 24; the hostile data and argument passes find nothing; every agent reads its demo files in eight other languages and encodings with the same result; the bench runs every agent at 10,000 rows per file.

## Limits

- The column layouts of named exports were written from knowledge of those systems and not checked against a live account. `inspect` shows how a file was read; `fairtable-sources.json` names columns by hand.
- Wage, tip, overtime, break, tax, inspection and allergen rules differ by country, state and city and change. They are settings; a payroll professional, an accountant, an employment lawyer or your health department confirms them.
- Not legal, tax, payroll, health-code, food-safety or accounting advice. A person decides what to pay, refund, change, file or send.
- The translations of these READMEs and of the report pages were written by Claude and have not been reviewed by native speakers.

## License

MIT © 2026 Kurt Francisco
