# fairtable-stockouts

Reads the 86 log against item sales: items that run out again and again, how long they stay off, what that likely cost in sales, items 86ed before the dinner rush and items never brought back. Never changes 86 status or orders.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `eighty_six` (required): 86 log or out-of-stock export: date, item, time it went out, time it came back, reason
- `sales`: POS item sales for the same period (date, item, quantity, net sales) for the lost-sales estimate
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

Count each item's 86 events and hours off, estimate lost sales from its average sales per open hour, and flag repeated and long outages, outages before the peak and items never brought back.

| Finding | Example from the fictional demo data |
|---|---|
| `early_86` | Short Rib ran out before the 18:00 rush and was still off when it started: 2026-11-06 at 17:15. |
| `long_86` | Oysters was off for 3 hours or more: 2026-11-07 from 18:30 (3.5 h). At about 42.55 an hour in sales, roughly 148.91 in lost sales over all its outages (an estimate). |
| `never_returned` | Oysters has no time back on 2026-11-07; it is counted as off until 22:00. Check the item came back the next day. |
| `repeated_86` | Short Rib was 86ed 3 times in this period: the par or the prep for it is too low. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `open_hours_per_day` | `11` | Hours open per day, for sales per hour (default 11) |
| `close_time` | `"22:00"` | Closing time, used when an item has no time back (default 22:00) |
| `peak_start` | `"18:00"` | Start of the rush; running out before it is watched (default 18:00) |
| `repeat_count` | `3` | 86 events in the period that count as repeated (default 3) |
| `long_hours` | `3` | Hours off that count as a long outage (default 3) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-stockouts demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Stockouts demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  6 86 event(s) on 4 item(s), 13.92 hours off; lost sales estimate 700.55. 2 flagged, 0 need review.
    flag    Oysters                             long_86, never_returned
    flag    Short Rib                           repeated_86, long_86, early_86

▶ Explain Short Rib
  status: executed  decision: allow
  Short Rib: flag. Short Rib was 86ed 3 times in this period: the par or the prep for it is too low. Short Rib was off for 3 hours or more: 2026-11-06 from 17:15 (4.75 h). At about 58.33 an hour in sales, roughly 520.14 in lost sales over all its outages (an estimate). Short Rib ran out before the 18:00 rush and was still off when it started: 2026-11-06 at 17:15.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Items 86ed and stockouts written: 6 86 event(s) on 4 item(s), 13.92 hours off; lost sales estimate 700.55. 2 flagged, 0 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street drafted for 700.55 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM with the chef]). Nothing was sent.

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
| `stockouts_check` | Count each item's 86 events and hours off, estimate lost sales from its average sales per open hour, and flag repeated and long outages, outages before the peak and items never brought back. | runs |
| `stockouts_explain` | Show one menu item from stockouts_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `stockouts_write_report` | Write stockouts.csv (one row per item, with blank owner and decision columns) and stockouts.html into out_dir (default fairtable-out/stockouts). | runs |
| `stockouts_draft_memo` | Write drafts/memo-<location>.md: the items that keep running out, when and for how long, for the chef to raise pars or prep. | asks first (Auto can be opted in) |
| `stockouts_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `stockouts_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `stockouts_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `stockouts_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `stockouts_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `vendor_order_submit` | Never places or changes an order with a distributor. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### 86 log (`eighty_six`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `date` | date | Date, Business Date, Day | Datum, Date, 日付, 日期 |
| `location` | text | Location, Store, Restaurant | Lagerort, Emplacement, 保管場所, 库位 |
| `item` (required) | text | Item, Menu Item, Product, 86 Item | Artikel, Article, 品目, 物料 |
| `out_at` | text | Out At, 86 Time, Time Out, Out, Stocked Out | - |
| `back_at` | text | Back At, Back, Time Back, Restocked, Un-86 Time | - |
| `reason` | text | Reason, Note, Why | Grund, Motif, 理由, 原因 |

### POS item sales (`sales`)

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-stockouts inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-stockouts can remember facts about your setup so the next run does not have to be told again. `stockouts_learn` only proposes a fact; it changes nothing until a named person accepts it with `stockouts_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that 86 board name as the POS item, so its sales are used |
| `note` | nothing (shown by recall only) |

```bash
fairtable-stockouts memory list
fairtable-stockouts memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-stockouts memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-stockouts demo
npx -y fairtable-stockouts mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-stockouts": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-stockouts",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-stockouts -- npx -y fairtable-stockouts mcp --root .`, or install the `fairtable-stockouts` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-stockouts approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-stockouts approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-stockouts kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-stockouts tools                 # every tool, its policy and arguments
fairtable-stockouts sources               # the columns each input is read from
fairtable-stockouts inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-stockouts call stockouts_check '{"eighty_six":"<eighty_six>"}'
fairtable-stockouts eval                  # the private eval cases on the fictional fixtures
fairtable-stockouts demo
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
