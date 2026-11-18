# clementine-of-waste

Reads your waste log against your daily sales, prices what was thrown out, and shows the items, reasons and days behind it, including days with sales and no waste logged at all. Never changes the POS or the prep list.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Price every waste entry (value, or quantity x unit cost), add it up by item and reason, compare it with net sales, and list days with sales and no waste entry. Flags high-waste items, waste over target, reasons that repeat, entries with no cost and entries with no reason.

| Finding | Example from the fictional demo data |
|---|---|
| `high_waste` | Chicken Breast: 13 lb thrown out in 3 entries, worth 50.7. |
| `no_reason` | Brioche Bun: 1 entry has no reason. |
| `no_value` | House Soup: 1 entry has no cost or value, so the total is understated. |
| `repeat_reason` | Chicken Breast was logged as "expired" 3 times: a prep par or a rotation problem to fix at the source. |
| `some_waste` | Fries: worth 20.9 thrown out. |
| `unlogged_day` | 2026-11-05: sales of 1620 and no waste logged. A day with no entries usually means the log was not kept, not that nothing was wasted. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `flag_amount` | `40` | Flag an item with at least this much waste in the period (default 40) |
| `watch_amount` | `15` | Watch an item with at least this much waste (default 15) |
| `repeat_count` | `3` | Times the same reason for one item counts as a pattern (default 3) |
| `target_waste_pct` | `1.5` | Waste target as % of net sales (default 1.5) |

<!-- generated:start -->

## A demo run

`npx -y clementine-of-waste demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Clementine of Waste demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  Waste logged 154.70 = 1.3% of net sales 12,210.00; 6 day(s) logged of 7 with sales. 2 flagged, 3 need review.
    flag    Chicken Breast                      high_waste, repeat_reason
    flag    Salmon Fillet                       high_waste
    review  2026-11-05                          unlogged_day
    review  Brioche Bun                         no_reason
    review  House Soup                          no_value
    watch   Fries                               some_waste, repeat_reason

▶ Explain Chicken Breast
  status: executed  decision: allow
  Chicken Breast (item): flag. Chicken Breast: 13 lb thrown out in 3 entries, worth 50.7. Chicken Breast was logged as "expired" 3 times: a prep par or a rotation problem to fix at the source.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Waste log written: Waste logged 154.70 = 1.3% of net sales 12,210.00; 6 day(s) logged of 7 with sales. 2 flagged, 3 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street drafted for 154.7 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `clementine_check` | Price every waste entry (value, or quantity x unit cost), add it up by item and reason, compare it with net sales, and list days with sales and no waste entry. | runs |
| `clementine_explain` | Show one wasted item or day from clementine_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `clementine_write_report` | Write clementine-waste.csv (one row per item, with blank owner and decision columns) and clementine-waste.html into out_dir (default fairtable-out/clementine). | runs |
| `clementine_draft_memo` | Write drafts/memo-<location>.md: the week's waste for the kitchen, the items and reasons to fix at the source, and the days with no log. | asks first (Auto can be opted in) |
| `clementine_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `clementine_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `clementine_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `clementine_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `clementine_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `vendor_order_submit` | Never places or changes an order with a distributor. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Waste log (`waste`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `date` | date | Date, Waste Date, Business Date, Logged | Datum, Date, 日付, 日期 |
| `location` | text | Location, Store, Restaurant | Lagerort, Emplacement, 保管場所, 库位 |
| `item` (required) | text | Item, Product, Ingredient, Menu Item, Description | Artikel, Article, 品目, 物料 |
| `qty` | number | Qty, Quantity, Amount Wasted, Wasted | Menge, Quantité, 数量, 数量 |
| `unit` | text | Unit, UOM, UofM | Einheit, Unité, 単位, 单位 |
| `unit_cost` | amount | Unit Cost, Cost, Cost per Unit | Stückkosten, Coût unitaire, 単価, 单位成本 |
| `value` | amount | Value, Waste Value, Total Cost, Cost Total | - |
| `reason` | text | Reason, Waste Reason, Why, Cause | Grund, Motif, 理由, 原因 |
| `employee` | text | Employee, Logged By, Staff, Recorded By | Mitarbeiter, Employé, 社員名, 员工 |
| `shift` | text | Shift, Daypart, Period | - |

### POS sales (`sales`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `item` (required) | text | Menu Item, Item, Item Name, Product, Product Name, Menu Item Name | Artikel, Article, 品目, 物料 |
| `date` | date | Order Date, Business Date, Date, Sale Date, Sent Date | Datum, Date, 日付, 日期 |
| `location` | text | Location, Store, Restaurant, Store Name, Site, Unit | Lagerort, Emplacement, 保管場所, 库位 |
| `category` | text | Sales Category, Category, Menu Group, Item Category, Reporting Category, Major Group | Kategorie, Catégorie, 経費科目, 费用类别 |
| `qty` | number | Qty, Quantity, Qty Sold, Quantity Sold, Items Sold, Count | Menge, Quantité, 数量, 数量 |
| `net_sales` | amount | Net Sales, Net Price, Net Amount, Item Revenue, Net Revenue, Sales | Nettoumsatz, Ventes nettes, 純売上, 净销售额 |
| `gross_sales` | amount | Gross Sales, Gross Price, Gross Amount, Total incl. tax | Bruttoumsatz, Ventes brutes, 総売上, 总销售额 |
| `discount` | amount | Discount, Discounts, Discount Amount, Promo Amount | Rabatt, Remise, 値引, 折扣 |
| `order_id` | text | Order Id, Order ID, Transaction ID, Check Id, Ticket, Order Number | Bestellnummer, N° de commande, 注文番号, 订单号 |
| `time` | text | Time, Order Time, Sent Time, Opened | Uhrzeit, Heure, 時刻, 时间 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Toast | ItemSelectionDetails export (one row per item sold) | Item Selection Id, Menu Item, Qty, Net Price | no |
| Square | Items > Item Sales export (CSV) | Item, Qty, Gross Sales, Net Sales, Transaction ID | no |
| Clover | Reports > Sales > Items export | Item Name, Items Sold, Item Revenue | no |
| Lightspeed Restaurant | Product sales report export | Product, Quantity, Total incl. tax | no |
| Revel Systems | Product Mix report export | Product Name, Quantity Sold, Net Sales | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx clementine-of-waste inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

clementine-of-waste can remember facts about your setup so the next run does not have to be told again. `clementine_learn` only proposes a fact; it changes nothing until a named person accepts it with `clementine_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the item, so its entries are added together |
| `note` | nothing (shown by recall only) |

```bash
clementine-of-waste memory list
clementine-of-waste memory accept MEM-1a2b3c4d5e6f --as "Your Name"
clementine-of-waste memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y clementine-of-waste demo
npx -y clementine-of-waste mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "clementine-of-waste": {
      "command": "npx",
      "args": [
        "-y",
        "clementine-of-waste",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add clementine-of-waste -- npx -y clementine-of-waste mcp --root .`, or install the `clementine-of-waste` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `clementine-of-waste approve <id> --as "Your Name"` (or on the local approvals page, `clementine-of-waste approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`clementine-of-waste kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
clementine-of-waste tools                 # every tool, its policy and arguments
clementine-of-waste sources               # the columns each input is read from
clementine-of-waste inspect <file>        # how a file would be read (names and shapes, never values)
clementine-of-waste call clementine_check '{"waste":"<waste>"}'
clementine-of-waste eval                  # the private eval cases on the fictional fixtures
clementine-of-waste demo
```

## Audit log and data

Every call is written to `.fairtable/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a POS, scheduling, payroll, delivery-app, reservation, distributor, utility or bank system, and changes nothing in them.
- Targets, thresholds and state rules are settings in your own file, with working defaults; check them against your own policies, contracts and local rules before you rely on them.
- Not legal, tax, payroll, health-code, food-safety or accounting advice. A person decides what to pay, refund, change, file or send.
- Names, phone numbers and emails of staff and guests are masked in results returned to the AI model. The report and draft files written here keep the real values: keep them in a private folder.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairtable-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
