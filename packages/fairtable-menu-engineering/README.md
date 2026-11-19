# fairtable-menu-engineering

Menu engineering from your POS item sales and plate costs: each item's popularity and contribution margin within its category, sorted into stars, plowhorses, puzzles and dogs, with a menu proposal draft. Never changes the menu or prices in the POS.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `sales` (required): POS item sales (product mix) for the period: item, category, quantity, net sales
- `costs` (required): Plate cost per menu item (from your recipe costing, e.g. the fairtable-recipe-costs report)
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

For each category: every item's share of the count against 70% of an even share, and its contribution margin (average price - plate cost) against the category's weighted average. Sorts items into stars, plowhorses, puzzles and dogs and lists items with no plate cost.

| Finding | Example from the fictional demo data |
|---|---|
| `dog` | Beet Salad (Salads): 10% of the category's sales count against a 23.33% bar, margin 8.6 against an average of 9.44: dog, sells little and earns less than average: consider replacing it unless it serves a purpose (a vegetarian option, a signature). |
| `no_cost` | Chef Special has no plate cost, so its margin and quadrant are unknown. |
| `plowhorse` | Caesar Salad (Salads): 60% of the category's sales count against a 23.33% bar, margin 9.4 against an average of 9.44: plowhorse, popular but earns less than average: check the portion and plate cost, or a small price step. |
| `puzzle` | Lamb Shank (Entrees): 2% of the category's sales count against a 8.75% bar, margin 18.5 against an average of 10.49: puzzle, earns well but sells little: move it on the menu, rename it, or have servers suggest it. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `popularity_factor` | `0.7` | Share of an even split that counts as popular (default 0.7) |
| `by_category` | `true` | Compare items within their category (default true) or across the whole menu |

<!-- generated:start -->

## A demo run

`npx -y fairtable-menu-engineering demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Menu Engineering demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  11 item(s), total margin 14,998.50: 3 star(s), 3 plowhorse(s), 3 puzzle(s), 1 dog(s). 2 to review.
    review  Beet Salad                          dog
    review  Chef Special                        no_cost
    watch   Caesar Salad                        plowhorse
    watch   Chicken Sandwich                    plowhorse
    watch   Classic Burger                      plowhorse
    watch   Lamb Shank                          puzzle
    watch   Mushroom Risotto                    puzzle
    watch   Steak Frites                        puzzle

▶ Explain Steak Frites
  status: executed  decision: allow
  Steak Frites: watch. Steak Frites (Entrees): 7.8% of the category's sales count against a 8.75% bar, margin 17.2 against an average of 10.49: puzzle, earns well but sells little: move it on the menu, rename it, or have servers suggest it.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Menu engineering written: 11 item(s), total margin 14,998.50: 3 star(s), 3 plowhorse(s), 3 puzzle(s), 1 dog(s). 2 to review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  menu proposal Main Street drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: go_live stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  menu proposal Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `menu_check` | For each category: every item's share of the count against 70% of an even share, and its contribution margin (average price - plate cost) against the category's weighted average. | runs |
| `menu_explain` | Show one menu item from menu_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `menu_write_report` | Write menu-engineering.csv (one row per item, with blank owner and decision columns) and menu-engineering.html into out_dir (default fairtable-out/menu). | runs |
| `menu_draft_menu_proposal` | Write drafts/menu_proposal-<location>.md: the plowhorses, puzzles and dogs with a proposed action each, for the owner and chef. | asks first (Auto can be opted in) |
| `menu_request_approve` | After one named human click (even in Auto), record that the reviewed menu proposal draft is approved in menu_proposal-requests.csv. | one named click, even in Auto (`go_live`) |
| `menu_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `menu_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `menu_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `menu_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

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

### Plate costs (`costs`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `item` (required) | text | Item, Menu Item, Recipe, Dish | Artikel, Article, 品目, 物料 |
| `plate_cost` | amount | Plate Cost, Cost, Recipe Cost, Food Cost, Theoretical Cost | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-menu-engineering inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-menu-engineering can remember facts about your setup so the next run does not have to be told again. `menu_learn` only proposes a fact; it changes nothing until a named person accepts it with `menu_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the POS menu item |
| `note` | nothing (shown by recall only) |

```bash
fairtable-menu-engineering memory list
fairtable-menu-engineering memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-menu-engineering memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-menu-engineering demo
npx -y fairtable-menu-engineering mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-menu-engineering": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-menu-engineering",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-menu-engineering -- npx -y fairtable-menu-engineering mcp --root .`, or install the `fairtable-menu-engineering` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-menu-engineering approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-menu-engineering approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-menu-engineering kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-menu-engineering tools                 # every tool, its policy and arguments
fairtable-menu-engineering sources               # the columns each input is read from
fairtable-menu-engineering inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-menu-engineering call menu_check '{"sales":"<sales>","costs":"<costs>"}'
fairtable-menu-engineering eval                  # the private eval cases on the fictional fixtures
fairtable-menu-engineering demo
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
