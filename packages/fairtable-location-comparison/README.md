# fairtable-location-comparison

Compares every location of a multi-unit group on the same measures (food cost, labor, prime cost, voids, comps, discounts, average check) against the group median, and shows which location is out of line on what. Never changes anything at a location.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Work out each location's shares of sales and average check, take the group median of each, and flag locations over the median by more than the points in the settings; watch a much lower average check.

| Finding | Example from the fictional demo data |
|---|---|
| `avg_check_low` | Airport Kiosk: average check 16.41 against a group median of 39.72. |
| `discount_pct_high` | Uptown: discounts 4.1% of sales against a group median of 2.1% (+2 points, about 2860). |
| `food_pct_high` | Uptown: food and beverage cost 40.8% of sales against a group median of 35% (+5.8 points, about 8294). |
| `prime_pct_high` | Uptown: prime cost 71.5% of sales against a group median of 67.8% (+3.7 points, about 5291). |
| `void_pct_high` | Uptown: voids 2.4% of sales against a group median of 0.9% (+1.5 points, about 2145). |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `points` | `{"food_pct":2,"labor_pct":3,"prime_pct":3,"void_pct":0.5,"comp_pct":0.5,"discount_pct":1}` | Points over the group median that count, per measure: food_pct, labor_pct, prime_pct, void_pct, comp_pct, discount_pct |
| `avg_check_drop_pct` | `15` | Watch an average check this % under the group median (default 15) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-location-comparison demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Location Comparison demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  5 location(s), group sales 594,000.00; group median prime cost 67.8%. 1 location(s) flagged, 1 watched.
    flag    Uptown                              food_pct_high, prime_pct_high, void_pct_high, discount_pct_high
    watch   Airport Kiosk                       avg_check_low

▶ Explain Uptown
  status: executed  decision: allow
  Uptown: flag. Uptown: food and beverage cost 40.8% of sales against a group median of 35% (+5.8 points, about 8294). Uptown: prime cost 71.5% of sales against a group median of 67.8% (+3.7 points, about 5291). Uptown: voids 2.4% of sales against a group median of 0.9% (+1.5 points, about 2145). Uptown: discounts 4.1% of sales against a group median of 2.1% (+2 points, about 2860).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Location comparison written: 5 location(s), group sales 594,000.00; group median prime cost 67.8%. 1 location(s) flagged, 1 watched.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo locations drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo locations approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `locations_check` | Work out each location's shares of sales and average check, take the group median of each, and flag locations over the median by more than the points in the settings; watch a much lower average check. | runs |
| `locations_explain` | Show one location from locations_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `locations_write_report` | Write pear-locations.csv (one row per item, with blank owner and decision columns) and pear-locations.html into out_dir (default fairtable-out/locations). | runs |
| `locations_draft_memo` | Write drafts/memo-locations.md: each location out of line, on which measure and by how much, for the operations lead to take up with the managers. | asks first (Auto can be opted in) |
| `locations_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `locations_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `locations_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `locations_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `locations_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `ledger_post` | Never posts journal entries or changes the books. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Location measures (`locations`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `location` (required) | text | Location, Store, Restaurant, Unit | Lagerort, Emplacement, 保管場所, 库位 |
| `period` | text | Period, Month, Week | - |
| `net_sales` | amount | Net Sales, Sales, Revenue | Nettoumsatz, Ventes nettes, 純売上, 净销售额 |
| `food_cost` | amount | Food Cost, Food COGS | - |
| `beverage_cost` | amount | Beverage Cost, Bev Cost, Liquor Cost | - |
| `labor_cost` | amount | Labor Cost, Labor, Payroll | - |
| `voids` | amount | Voids, Void Amount | - |
| `comps` | amount | Comps, Comp Amount | - |
| `discounts` | amount | Discounts, Discount Amount, Promotions | - |
| `checks` | number | Checks, Check Count, Tickets, Orders | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-location-comparison inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-location-comparison can remember facts about your setup so the next run does not have to be told again. `locations_learn` only proposes a fact; it changes nothing until a named person accepts it with `locations_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the location, so its rows are added together |
| `note` | nothing (shown by recall only) |

```bash
fairtable-location-comparison memory list
fairtable-location-comparison memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-location-comparison memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-location-comparison demo
npx -y fairtable-location-comparison mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-location-comparison": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-location-comparison",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-location-comparison -- npx -y fairtable-location-comparison mcp --root .`, or install the `fairtable-location-comparison` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-location-comparison approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-location-comparison approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-location-comparison kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-location-comparison tools                 # every tool, its policy and arguments
fairtable-location-comparison sources               # the columns each input is read from
fairtable-location-comparison inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-location-comparison call locations_check '{"locations":"<locations>"}'
fairtable-location-comparison eval                  # the private eval cases on the fictional fixtures
fairtable-location-comparison demo
```

## Audit log and data

Every call is written to `.fairtable/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a POS, scheduling, payroll, delivery-app, reservation, distributor, utility or bank system, and changes nothing in them.
- Targets, thresholds and state rules are settings in your own file, with working defaults; check them against your own policies, contracts and local rules before you rely on them.
- Not legal, tax, payroll, health-code, food-safety or accounting advice. A person decides what to pay, refund, change, file or send.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairtable-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
