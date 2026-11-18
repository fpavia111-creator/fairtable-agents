# fairtable-prime-cost

Weekly prime cost (food and beverage cost plus labor with taxes and benefits) as a share of sales for each location, against your targets, with weeks that are missing a number and prime cost that keeps rising. Never posts to the books.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Work out prime cost and its share of net sales for every location and week, and the food-and-beverage and labor shares; flag weeks over the prime cost target, watch the parts over their targets and prime cost rising week after week, and list weeks with a missing number.

| Finding | Example from the fictional demo data |
|---|---|
| `cogs_over_target` | Food and beverage cost 36.9% against a 36% target. |
| `labor_over_target` | Labor with taxes and benefits 32.1% against a 32% target. |
| `missing_data` | Harbor Road, week of 2026-10-26: no labor, so prime cost cannot be worked out. |
| `prime_over_target` | Main Street, week of 2026-10-26: prime cost 27465 is 69% of sales 39800, over the 65% target. |
| `rising_prime` | Main Street: prime cost has risen 3 weeks in a row, to 69%. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `target_prime_pct` | `62` | Prime cost target % (default 62) |
| `target_cogs_pct` | `33` | Food and beverage cost target % (default 33) |
| `target_labor_pct` | `30` | Labor target % with taxes and benefits (default 30) |
| `flag_points` | `2` | Flag prime cost this many points over target (default 2) |
| `trend_weeks` | `3` | Weeks of rising prime cost that count as a trend (default 3) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-prime-cost demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Prime Cost demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 location-week(s): prime cost 165,445.00 on sales 247,100.00 (67%; target 65%). 2 flagged, 1 need review.
    flag    Main Street 2026-10-26              prime_over_target, cogs_over_target, labor_over_target, rising_prime
    flag    Main Street 2026-11-02              prime_over_target, cogs_over_target, labor_over_target, rising_prime
    review  Harbor Road 2026-10-26              missing_data

▶ Explain Main Street 2026-11-02
  status: executed  decision: allow
  Main Street 2026-11-02: flag. Main Street, week of 2026-11-02: prime cost 28490 is 73.2% of sales 38900, over the 65% target. Food and beverage cost 38.9% against a 36% target. Labor with taxes and benefits 34.3% against a 32% target. Main Street: prime cost has risen 4 weeks in a row, to 73.2%.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Prime cost written: 8 location-week(s): prime cost 165,445.00 on sales 247,100.00 (67%; target 65%). 2 flagged, 1 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo prime-cost drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo prime-cost approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `prime_cost_check` | Work out prime cost and its share of net sales for every location and week, and the food-and-beverage and labor shares; flag weeks over the prime cost target, watch the parts over their targets and prime cost rising w… | runs |
| `prime_cost_explain` | Show one location and week (e.g. | runs |
| `prime_cost_write_report` | Write prime-cost.csv (one row per item, with blank owner and decision columns) and prime-cost.html into out_dir (default fairtable-out/prime_cost). | runs |
| `prime_cost_draft_memo` | Write drafts/memo-prime-cost.md: prime cost by location and week with the weeks over target, for the managers. | asks first (Auto can be opted in) |
| `prime_cost_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `prime_cost_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `prime_cost_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `prime_cost_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `prime_cost_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books. | refused |
| `payroll_submit` | Never submits or changes payroll, wages or tip payouts; your payroll person does. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Weekly numbers (`weeks`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `week` (required) | date | Week, Week Starting, Week Of, Period, Date | - |
| `location` | text | Location, Store, Restaurant, Unit | Lagerort, Emplacement, 保管場所, 库位 |
| `net_sales` | amount | Net Sales, Sales, Revenue | Nettoumsatz, Ventes nettes, 純売上, 净销售额 |
| `food_cost` | amount | Food Cost, Food COGS, Food Purchases, COGS Food | - |
| `beverage_cost` | amount | Beverage Cost, Bev Cost, Liquor Cost, COGS Beverage | - |
| `labor_cost` | amount | Labor Cost, Wages, Payroll, Gross Wages | - |
| `labor_burden` | amount | Labor Burden, Payroll Taxes, Taxes and Benefits, Benefits | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-prime-cost inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-prime-cost can remember facts about your setup so the next run does not have to be told again. `prime_cost_learn` only proposes a fact; it changes nothing until a named person accepts it with `prime_cost_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-prime-cost memory list
fairtable-prime-cost memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-prime-cost memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-prime-cost demo
npx -y fairtable-prime-cost mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-prime-cost": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-prime-cost",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-prime-cost -- npx -y fairtable-prime-cost mcp --root .`, or install the `fairtable-prime-cost` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-prime-cost approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-prime-cost approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-prime-cost kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-prime-cost tools                 # every tool, its policy and arguments
fairtable-prime-cost sources               # the columns each input is read from
fairtable-prime-cost inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-prime-cost call prime_cost_check '{"weeks":"<weeks>"}'
fairtable-prime-cost eval                  # the private eval cases on the fictional fixtures
fairtable-prime-cost demo
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
