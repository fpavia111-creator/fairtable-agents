# cherry-of-counts

Compares each item's inventory count with what the system expected, prices the difference, and points to counts that look like a unit mistake (cases written as each, pounds as ounces), missing lines and wild swings, with a recount list. Never changes the inventory system.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Count against expected quantity per item, priced at the unit cost. Flags big variances, counts that are a pack multiple of what was expected (likely the wrong unit), missing or negative counts and items with no cost, and adds up the shrink.

| Finding | Example from the fictional demo data |
|---|---|
| `big_variance` | Chicken Breast: counted 20, expected 36 lb (-16, -44.4%), -62.4 at 3.9. |
| `missing_count` | Olive Oil (Dry storage) has no count; it is left out of the totals. Count it or write 0. |
| `negative_count` | Tequila Blanco was counted as -2; a count cannot be negative. |
| `no_cost` | Shrimp 21/25 has no unit cost, so its variance cannot be priced. |
| `small_variance` | Cheddar Cheese: counted 4, expected 4.5 lb (-0.5, -11.1%), -2.6 at 5.2. |
| `unit_suspect` | Heavy Cream: counted 72, expected 6 qt; that is about 12 times what was expected, which looks like a count in the wrong unit (case, pack or ounce). Recount before trusting the variance. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `flag_amount` | `40` | Flag a variance worth at least this much (default 40) |
| `flag_pct` | `10` | ... and at least this % of expected (default 10) |
| `watch_amount` | `10` | Watch a variance worth at least this much (default 10) |
| `watch_pct` | `5` | Watch a variance of at least this % (default 5) |
| `unit_factors` | `[4,6,8,12,16,24,48]` | Pack sizes that suggest a unit mistake when a count is that multiple of expected |

<!-- generated:start -->

## A demo run

`npx -y cherry-of-counts demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Cherry of Counts demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  12 item(s) counted: value 564.30 against 756.80 expected (-192.50), shrink -194.30. 7 to recount or fix.
    flag    Chicken Breast                      big_variance
    flag    House Vodka                         big_variance
    flag    Salmon Fillet                       big_variance
    review  Heavy Cream                         unit_suspect
    review  Olive Oil                           missing_count
    review  Shrimp 21/25                        no_cost
    review  Tequila Blanco                      negative_count
    watch   Cheddar Cheese                      small_variance

▶ Explain Heavy Cream
  status: executed  decision: allow
  Heavy Cream (Main Street): review. Heavy Cream: counted 72, expected 6 qt; that is about 12 times what was expected, which looks like a count in the wrong unit (case, pack or ounce). Recount before trusting the variance.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Inventory count variance written: 12 item(s) counted: value 564.30 against 756.80 expected (-192.50), shrink -194.30. 7 to recount or fix.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  recount list Main Street drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM: name and time]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  recount list Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `cherry_check` | Count against expected quantity per item, priced at the unit cost. | runs |
| `cherry_explain` | Show one counted item from cherry_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `cherry_write_report` | Write cherry-count-variance.csv (one row per item, with blank owner and decision columns) and cherry-count-variance.html into out_dir (default fairtable-out/cherry). | runs |
| `cherry_draft_recount_list` | Write drafts/recount_list-<location>.md: the items to recount before the count is closed, grouped by storage area, with what was counted and what was expected. | asks first (Auto can be opted in) |
| `cherry_request_send` | After one named human click (even in Auto), record that the reviewed recount list draft is approved in recount_list-requests.csv. | one named click, even in Auto (`binding_send`) |
| `cherry_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `cherry_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `cherry_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `cherry_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books. | refused |
| `vendor_order_submit` | Never places or changes an order with a distributor. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Inventory count (`counts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `item` (required) | text | Item, Inventory Item, Product, Item Name, Description | Artikel, Article, 品目, 物料 |
| `count_date` | date | Count Date, Date, Period End, Counted On | Inventurdatum, Date d’inventaire, 棚卸日, 盘点日期 |
| `counted_qty` | number | Count Qty, Counted, Count, Quantity Counted, On Hand, Qty | Gezählt, Quantité comptée, 実棚数, 盘点数量 |
| `unit` | text | Count UofM, Unit, UOM, UofM, Count Unit | Einheit, Unité, 単位, 单位 |
| `unit_cost` | amount | Unit Cost, Cost, Last Cost, Price, Avg Cost | Stückkosten, Coût unitaire, 単価, 单位成本 |
| `expected_qty` | number | Expected, Theoretical, Expected Qty, Theoretical Qty, System Qty, Book Qty | Bestand, Stock, 在庫数, 库存数量 |
| `location` | text | Location, Store, Restaurant, Unit | Lagerort, Emplacement, 保管場所, 库位 |
| `area` | text | Storage Area, Area, Storage Location, Shelf, Zone | Lagerbereich, Zone de stockage, 保管場所, 存放区域 |
| `category` | text | Category, Item Category, Accounting Category, Class | Kategorie, Catégorie, 経費科目, 费用类别 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Restaurant365 | Inventory count export | Item, Count UofM, Count Qty | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx cherry-of-counts inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

cherry-of-counts can remember facts about your setup so the next run does not have to be told again. `cherry_learn` only proposes a fact; it changes nothing until a named person accepts it with `cherry_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the item, so its lines are added together |
| `note` | nothing (shown by recall only) |

```bash
cherry-of-counts memory list
cherry-of-counts memory accept MEM-1a2b3c4d5e6f --as "Your Name"
cherry-of-counts memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y cherry-of-counts demo
npx -y cherry-of-counts mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "cherry-of-counts": {
      "command": "npx",
      "args": [
        "-y",
        "cherry-of-counts",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add cherry-of-counts -- npx -y cherry-of-counts mcp --root .`, or install the `cherry-of-counts` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `cherry-of-counts approve <id> --as "Your Name"` (or on the local approvals page, `cherry-of-counts approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`cherry-of-counts kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
cherry-of-counts tools                 # every tool, its policy and arguments
cherry-of-counts sources               # the columns each input is read from
cherry-of-counts inspect <file>        # how a file would be read (names and shapes, never values)
cherry-of-counts call cherry_check '{"counts":"<counts>"}'
cherry-of-counts eval                  # the private eval cases on the fictional fixtures
cherry-of-counts demo
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
