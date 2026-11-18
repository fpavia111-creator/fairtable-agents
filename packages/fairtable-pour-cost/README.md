# fairtable-pour-cost

Bar pour cost and liquor variance. Drinks sold times their recipe pours against bottles used (opening count + bottles bought - closing count), per spirit, priced per bottle, with pour cost against your target. Never changes the POS.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Per spirit: bottles the recipes say were poured against bottles actually used, priced per bottle; pour cost % against target. Flags over-pouring, spirits used with no drink recipe, drinks sold with no recipe and missing counts.

| Finding | Example from the fictional demo data |
|---|---|
| `drink_no_recipe` | House Shot: 40 sold for 240 with no recipe, so its pours are missing from theoretical use. |
| `no_close_count` | Coffee Liqueur: opening count 3 but no closing count on 2026-11-08. |
| `not_in_recipes` | London Dry Gin: 1 bottle(s) used and no drink recipe uses it (a missing recipe, a spill, or pours rung under another button). |
| `over_pour` | Bourbon: used 9.6 bottles (open 5 + bought 6 - close 1.4), pours say 7.1 (180 oz). Gap 2.5 bottles (35.3%), 70.07 at 28 a bottle. |
| `small_over_pour` | House Vodka: used 10.1 bottles (open 8 + bought 6 - close 3.9), pours say 9.32 (315 oz). Gap 0.78 bottles (8.4%), 10.98 at 14 a bottle. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `flag_amount` | `30` | Flag a spirit whose gap costs at least this much (default 30) |
| `flag_pct` | `10` | ... and is at least this % (default 10) |
| `watch_amount` | `10` | Watch from this amount (default 10) |
| `watch_pct` | `5` | Watch from this % (default 5) |
| `target_pour_cost_pct` | `20` | Pour cost target % (default 20) |
| `default_bottle_ml` | `750` | Bottle size when the count does not say (default 750) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-pour-cost demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Pour Cost demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  Bar sales 5,430.00: liquor used 801.30 (pour cost 14.8%), recipes say 739.04 (13.6%); gap 62.26. 1 flagged, 3 need review.
    flag    Bourbon                             over_pour
    review  Coffee Liqueur                      no_close_count
    review  House Shot                          drink_no_recipe
    review  London Dry Gin                      not_in_recipes
    watch   House Vodka                         small_over_pour
    watch   Triple Sec                          small_over_pour

▶ Explain Bourbon
  status: executed  decision: allow
  Bourbon (spirit): flag. Bourbon: used 9.6 bottles (open 5 + bought 6 - close 1.4), pours say 7.1 (180 oz). Gap 2.5 bottles (35.3%), 70.07 at 28 a bottle.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Bar pour cost and liquor variance written: Bar sales 5,430.00: liquor used 801.30 (pour cost 14.8%), recipes say 739.04 (13.6%); gap 62.26. 1 flagged, 3 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street bar drafted for 62.26 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Main-Street-bar approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `pour_cost_check` | Per spirit: bottles the recipes say were poured against bottles actually used, priced per bottle; pour cost % against target. | runs |
| `pour_cost_explain` | Show one spirit or drink from pour_cost_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `pour_cost_write_report` | Write pour-cost.csv (one row per item, with blank owner and decision columns) and pour-cost.html into out_dir (default fairtable-out/pour_cost). | runs |
| `pour_cost_draft_memo` | Write drafts/memo-<location>.md: pour cost for the period and the spirits poured beyond the recipes, for the bar manager. | asks first (Auto can be opted in) |
| `pour_cost_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `pour_cost_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `pour_cost_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `pour_cost_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `pour_cost_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `vendor_order_submit` | Never places or changes an order with a distributor. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### POS drink sales (`sales`)

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

### Drink recipes (`recipes`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `recipe` (required) | text | Recipe, Menu Item, Recipe Name, Dish, Item | Rezept, Recette, レシピ, 配方 |
| `ingredient` (required) | text | Ingredient, Component, Product, Inventory Item, Item Description | Zutat, Ingrédient, 食材, 食材 |
| `qty` | number | Quantity, Qty, Amount, Portion, Recipe Qty | Menge, Quantité, 数量, 数量 |
| `unit` | text | Unit, UOM, UofM, Recipe Unit, Measure | Einheit, Unité, 単位, 单位 |
| `yield_pct` | number | Yield %, Yield, Yield Percent, Usable % | Ausbeute %, Rendement %, 歩留まり %, 出成率 % |
| `menu_price` | amount | Menu Price, Price, Sell Price, Selling Price | Verkaufspreis, Prix de vente, 販売価格, 售价 |
| `category` | text | Category, Menu Category, Menu Group, Recipe Category | Kategorie, Catégorie, 経費科目, 费用类别 |

### Liquor counts (`counts`)

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
| `size_ml` | number | Size (ml), Bottle Size, Bottle ml, ML, Size ml | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Restaurant365 | Inventory count export | Item, Count UofM, Count Qty | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Liquor invoice lines (`purchases`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `vendor` | text | Vendor, Vendor Name, Supplier, Distributor, Supplier Name | Lieferant, Fournisseur, 仕入先, 供应商 |
| `invoice_number` | text | Invoice Number, Invoice No, Invoice #, Invoice, Inv No, Document Number | Rechnungsnummer, N° de facture, 請求書番号, 发票号 |
| `invoice_date` | date | Invoice Date, Date, Delivery Date, Document Date, Inv Date | Rechnungsdatum, Date de facture, 請求日, 发票日期 |
| `item_code` | text | Vendor Item Code, Item Code, Item Number, SUPC, Product Number, Product Code | Artikelnummer, Référence, 品番, 物料编码 |
| `item` (required) | text | Item Description, Product Description, Description, Product, Item, Item Name | Artikel, Article, 品目, 物料 |
| `pack` | text | Pack/Size, Pack Size, Pack, Size, Packaging | Gebinde, Conditionnement, 入数, 规格 |
| `unit` | text | UofM, Unit, UOM, Unit of Measure, Purchase Unit | Einheit, Unité, 単位, 单位 |
| `qty` | number | Quantity Shipped, Qty Shipped, Quantity, Qty, Shipped, Qty Invoiced | Menge, Quantité, 数量, 数量 |
| `unit_price` | amount | Unit Price, Case Price, Price, Each Price, Price per Unit | Einzelpreis, Prix unitaire, 単価, 单价 |
| `extended` | amount | Extended Price, Extended, Line Total, Total, Amount, Ext Price | Gesamtpreis, Montant de la ligne, 明細金額, 行金额 |
| `category` | text | Category, Item Category, Accounting Category, Product Category, Class | Kategorie, Catégorie, 経費科目, 费用类别 |
| `gl_account` | text | GL Account, GL Code, Account, Expense Account, GL | Konto, Compte, 勘定科目, 科目代码 |
| `location` | text | Location, Store, Restaurant, Ship To, Unit | Lagerort, Emplacement, 保管場所, 库位 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| MarginEdge | Invoice line items export | Vendor, Invoice Number, Vendor Item Code, Product, Unit Price | no |
| Restaurant365 | AP invoice detail export | Vendor, Invoice Number, Item Number, UofM, Extended Price | no |
| xtraCHEF by Toast | Invoice details export | Vendor Name, Invoice Number, Item Code, Item Description, Pack/Size | no |
| Sysco | Invoice download (CSV) | SUPC, Pack, Size, Qty Shipped | no |
| US Foods | Invoice download (CSV) | Product Number, Product Description, Pack Size, Quantity Shipped | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-pour-cost inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-pour-cost can remember facts about your setup so the next run does not have to be told again. `pour_cost_learn` only proposes a fact; it changes nothing until a named person accepts it with `pour_cost_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the spirit in counts, invoices and recipes |
| `note` | nothing (shown by recall only) |

```bash
fairtable-pour-cost memory list
fairtable-pour-cost memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-pour-cost memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-pour-cost demo
npx -y fairtable-pour-cost mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-pour-cost": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-pour-cost",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-pour-cost -- npx -y fairtable-pour-cost mcp --root .`, or install the `fairtable-pour-cost` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-pour-cost approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-pour-cost approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-pour-cost kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-pour-cost tools                 # every tool, its policy and arguments
fairtable-pour-cost sources               # the columns each input is read from
fairtable-pour-cost inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-pour-cost call pour_cost_check '{"sales":"<sales>","recipes":"<recipes>","counts":"<counts>"}'
fairtable-pour-cost eval                  # the private eval cases on the fictional fixtures
fairtable-pour-cost demo
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
