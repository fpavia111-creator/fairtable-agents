# fairtable-recipe-costs

Costs every recipe at your latest invoice prices (pack sizes, units and yields), shows each plate's food cost percent against your target and the price that would meet it, and which plates got dearer. Never changes menu prices in the POS.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `recipes` (required): Recipes: one row per menu item and ingredient with quantity, unit, optional yield %, menu price and category
- `invoices` (required): Invoice lines (MarginEdge, R365, xtraCHEF, Sysco or US Foods export) with pack size and case price; the latest price per item is used
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

Cost every recipe from its ingredients at the latest invoice price per unit, read through the pack size ("6/5 LB") and the yield. Flags plates over the food cost target, plates whose cost rose, ingredients with no price or a unit that cannot be converted, and recipes with no menu price.

| Finding | Example from the fictional demo data |
|---|---|
| `cost_rose` | Steak Frites: plate cost rose from 11.88 to 14.09 (18.6%) between the earliest and the latest invoice prices. |
| `near_target` | House Lemonade: 30.9% against a 30% target. |
| `no_menu_price` | Truffle Fries has no menu price in the recipe file, so its food cost % cannot be worked out. |
| `no_price` | Herb Butter has no invoice price, so Steak Frites is costed without it. |
| `over_target` | Steak Frites: plate cost 14.09 is 48.6% of the 29 menu price, over the 32% target; 44.25 would meet it. |
| `unit_mismatch` | Truffle Oil is used in floz but bought as "6/1 LB"; add a conversion or name the pack. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `target_food_cost_pct` | `30` | Food cost target % (default 30) |
| `category_targets` | `{}` | Targets by menu category, e.g. {"Entrees": 32} |
| `flag_points` | `3` | Flag a plate this many points over its target (default 3) |
| `rise_pct` | `8` | Watch a plate whose cost rose at least this % (default 8) |
| `price_step` | `0.25` | Round the price at target up to this step (default 0.25) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-recipe-costs demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Recipe Costs demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  6 recipe(s) costed at the latest invoice prices; average food cost 25.36%. 1 over target, 1 need review, 1 got dearer.
    flag    Steak Frites                        no_price, over_target, cost_rose
    review  Truffle Fries                       unit_mismatch, no_menu_price
    watch   House Lemonade                      near_target

▶ Explain Steak Frites
  status: executed  decision: allow
  Steak Frites: flag. Herb Butter has no invoice price, so Steak Frites is costed without it. Steak Frites: plate cost 14.09 is 48.6% of the 29 menu price, over the 32% target; 44.25 would meet it. Steak Frites: plate cost rose from 11.88 to 14.09 (18.6%) between the earliest and the latest invoice prices.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Recipe costs at latest invoice prices written: 6 recipe(s) costed at the latest invoice prices; average food cost 25.36%. 1 over target, 1 need review, 1 got dearer.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  price proposal Main Street (fictional) drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM: keep / re-cost / reprice]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: go_live stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  price proposal Main-Street-fictional approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `recipe_costs_check` | Cost every recipe from its ingredients at the latest invoice price per unit, read through the pack size ("6/5 LB") and the yield. | runs |
| `recipe_costs_explain` | Show one recipe from recipe_costs_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `recipe_costs_write_report` | Write recipe-costs.csv (one row per item, with blank owner and decision columns) and recipe-costs.html into out_dir (default fairtable-out/recipe_costs). | runs |
| `recipe_costs_draft_price_proposal` | Write drafts/price_proposal-<location>.md: the plates over target with their plate cost, current price and the price at target, for the owner to decide. | asks first (Auto can be opted in) |
| `recipe_costs_request_approve` | After one named human click (even in Auto), record that the reviewed price proposal draft is approved in price_proposal-requests.csv. | one named click, even in Auto (`go_live`) |
| `recipe_costs_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `recipe_costs_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `recipe_costs_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `recipe_costs_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `vendor_order_submit` | Never places or changes an order with a distributor. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

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

### Invoice lines (`invoices`)

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-recipe-costs inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-recipe-costs can remember facts about your setup so the next run does not have to be told again. `recipe_costs_learn` only proposes a fact; it changes nothing until a named person accepts it with `recipe_costs_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that invoice name as the ingredient, so the recipe is costed at its price |
| `note` | nothing (shown by recall only) |

```bash
fairtable-recipe-costs memory list
fairtable-recipe-costs memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-recipe-costs memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-recipe-costs demo
npx -y fairtable-recipe-costs mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-recipe-costs": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-recipe-costs",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-recipe-costs -- npx -y fairtable-recipe-costs mcp --root .`, or install the `fairtable-recipe-costs` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-recipe-costs approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-recipe-costs approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-recipe-costs kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-recipe-costs tools                 # every tool, its policy and arguments
fairtable-recipe-costs sources               # the columns each input is read from
fairtable-recipe-costs inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-recipe-costs call recipe_costs_check '{"recipes":"<recipes>","invoices":"<invoices>"}'
fairtable-recipe-costs eval                  # the private eval cases on the fictional fixtures
fairtable-recipe-costs demo
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
