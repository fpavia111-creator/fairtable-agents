# fairtable-food-cost

Actual against theoretical food cost from your POS item sales, recipes, inventory counts and invoices. Shows which ingredients were used more than the recipes say, with the cost of the gap. Never changes the POS and never sends.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Compare what the recipes say the kitchen used (sales x recipe portions / yield) with what it did use (opening count + purchases - closing count), per ingredient, priced at the latest unit cost. Flags over-usage, under-usage, menu items sold without a recipe, unit mismatches, missing counts and invoice lines that match no ingredient.

| Finding | Example from the fictional demo data |
|---|---|
| `item_sold_no_recipe` | Seasonal Soup: 40 sold for 320 but no recipe, so its ingredients are missing from theoretical use. |
| `no_close_count` | Lemons has an opening count but no closing count on 2026-11-08. |
| `not_in_recipes` | Fryer Oil: 4 gal used but no recipe uses it (oil, garnish or a missing recipe line). It counts in actual cost only. |
| `over_usage` | Cheddar Cheese: used 26 lb (open 10 + bought 20 - close 4), recipes say 13.75 for 1 menu item(s). Gap 12.25 lb (89.1%), 63.7 at 5.2 per lb. |
| `purchase_not_matched` | Invoice SP-7712 line "LEMON 165CT" matches no counted or recipe ingredient, so it is not in actual use. Teach the agent the name, or add it to the count sheet. |
| `small_over_usage` | Cod Fillet: used 16 lb (open 12 + bought 10 - close 6), recipes say 15 for 1 menu item(s). Gap 1 lb (6.7%), 9.5 at 9.5 per lb. |
| `under_usage` | Corn Tortilla: used 100 ea (open 300 + bought 0 - close 200), recipes say 120 for 1 menu item(s). Gap -20 ea (-16.7%), -1.2 at 0.06 per ea. Less than the recipes: look for a missing invoice, a count error or a recipe that uses less. |
| `unit_mismatch` | Anchovy Paste: Caesar Salad uses 0.25 oz, counted in ea; weight, volume and each cannot be converted without a conversion in the recipe. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `flag_amount` | `50` | Flag an ingredient when its gap costs at least this much (default 50) |
| `flag_pct` | `10` | ... and is at least this % of theoretical use (default 10) |
| `watch_amount` | `25` | Watch an ingredient whose gap costs at least this much (default 25) |
| `watch_pct` | `5` | Watch an ingredient whose gap is at least this % (default 5) |
| `target_food_cost_pct` | `30` | Your food cost target, shown next to the result (default 30) |
| `period_start` | `null` | Opening count date (default: the earliest count date) |
| `period_end` | `null` | Closing count date (default: the latest count date) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-food-cost demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Food Cost demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  Period 2026-11-01 to 2026-11-08: net sales 8,170.00, theoretical food cost 1,218.01 (14.9%), actual 1,463.30 (17.9%), gap 245.29. 2 ingredient(s) flagged, 6 need review.
    flag    Cheddar Cheese                      over_usage
    flag    Chicken Breast                      over_usage
    review  Anchovy Paste                       unit_mismatch
    review  Corn Tortilla                       under_usage
    review  Fryer Oil                           not_in_recipes
    review  LEMON 165CT                         purchase_not_matched
    review  Lemons                              no_close_count
    review  Seasonal Soup                       item_sold_no_recipe
    watch   Cod Fillet                          small_over_usage
    watch   Frozen Fries                        small_over_usage
    watch   Ground Beef 80/20                   small_over_usage
    watch   Romaine                             small_over_usage

▶ Explain Chicken Breast
  status: executed  decision: allow
  Chicken Breast (ingredient): flag. Chicken Breast: used 90 lb (open 30 + bought 80 - close 20), recipes say 70.83 for 2 menu item(s). Gap 19.17 lb (27.1%), 74.75 at 3.9 per lb.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Actual against theoretical food cost written: Period 2026-11-01 to 2026-11-08: net sales 8,170.00, theoretical food cost 1,218.01 (14.9%), actual 1,463.30 (17.9%), gap 245.29. 2 ingredient(s) flagged, 6 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street (fictional) drafted for 245.29 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM: date of the next count]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Main-Street-fictional approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `food_cost_check` | Compare what the recipes say the kitchen used (sales x recipe portions / yield) with what it did use (opening count + purchases - closing count), per ingredient, priced at the latest unit cost. | runs |
| `food_cost_explain` | Show one ingredient or menu item from food_cost_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `food_cost_write_report` | Write apricot-food-cost.csv (one row per item, with blank owner and decision columns) and apricot-food-cost.html into out_dir (default fairtable-out/food_cost). | runs |
| `food_cost_draft_memo` | Write drafts/memo-<location>.md: a short memo to the kitchen manager with the period food cost, the ingredients used beyond the recipes and the gap in money, for a person to review and send. | asks first (Auto can be opted in) |
| `food_cost_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `food_cost_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `food_cost_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `food_cost_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `food_cost_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `vendor_order_submit` | Never places or changes an order with a distributor. | refused |
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

### Recipes (`recipes`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `recipe` (required) | text | Recipe, Menu Item, Recipe Name, Dish, Item | Rezept, Recette, レシピ, 配方 |
| `ingredient` (required) | text | Ingredient, Component, Product, Inventory Item, Item Description | Zutat, Ingrédient, 食材, 食材 |
| `qty` | number | Quantity, Qty, Amount, Portion, Recipe Qty | Menge, Quantité, 数量, 数量 |
| `unit` | text | Unit, UOM, UofM, Recipe Unit, Measure | Einheit, Unité, 単位, 单位 |
| `yield_pct` | number | Yield %, Yield, Yield Percent, Usable % | Ausbeute %, Rendement %, 歩留まり %, 出成率 % |
| `menu_price` | amount | Menu Price, Price, Sell Price, Selling Price | Verkaufspreis, Prix de vente, 販売価格, 售价 |
| `category` | text | Category, Menu Category, Menu Group, Recipe Category | Kategorie, Catégorie, 経費科目, 费用类别 |

### Inventory counts (`counts`)

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

### Invoice lines (`purchases`)

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-food-cost inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-food-cost can remember facts about your setup so the next run does not have to be told again. `food_cost_learn` only proposes a fact; it changes nothing until a named person accepts it with `food_cost_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the ingredient in invoices, counts and recipes, so its purchases count toward actual use |
| `note` | nothing (shown by recall only) |

```bash
fairtable-food-cost memory list
fairtable-food-cost memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-food-cost memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-food-cost demo
npx -y fairtable-food-cost mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-food-cost": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-food-cost",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-food-cost -- npx -y fairtable-food-cost mcp --root .`, or install the `fairtable-food-cost` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-food-cost approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-food-cost approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-food-cost kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-food-cost tools                 # every tool, its policy and arguments
fairtable-food-cost sources               # the columns each input is read from
fairtable-food-cost inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-food-cost call food_cost_check '{"sales":"<sales>","recipes":"<recipes>","counts":"<counts>"}'
fairtable-food-cost eval                  # the private eval cases on the fictional fixtures
fairtable-food-cost demo
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
