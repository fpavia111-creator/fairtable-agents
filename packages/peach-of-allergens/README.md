# peach-of-allergens

Checks your menu's allergen matrix against the recipes and each ingredient's allergens: allergens in a dish that the matrix does not declare, free-from claims a recipe breaks, declarations no ingredient explains, and ingredients with no allergen data. Never changes the menu.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each menu item: the allergens its ingredients contain against those the matrix declares and the free-from claims it makes. Flags undeclared allergens and broken claims; lists declarations no ingredient explains, ingredients with no data, recipes not on the matrix and matrix items with no recipe.

| Finding | Example from the fictional demo data |
|---|---|
| `declared_not_found` | Fish Tacos declares shellfish but no ingredient on file contains it. Keep it if it is a cross-contact warning; otherwise update the matrix. |
| `free_from_broken` | Gluten-Free Pasta is marked gluten free but contains wheat (from Panko Topping). |
| `ingredient_no_data` | Fries Basket: ingredient "Fryer Oil" has no allergen data; ask the supplier for its specification sheet. |
| `no_recipe` | Seasonal Soup is on the allergen matrix but has no recipe, so its declarations cannot be checked. |
| `undeclared_allergen` | Caesar Salad contains fish (from Caesar Dressing) but the matrix does not declare it. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `allergens` | `["milk","egg","fish","shellfish","tree nuts","peanuts","wheat","soy","sesame"]` | The allergens you track (default: the nine major US allergens; other countries list more, e.g. the 14 EU allergens) |
| `synonyms` | `{"gluten":"wheat","dairy":"milk","nuts":"tree nuts","crustacean":"shellfish","eggs":"egg"}` | Other words for an allergen, e.g. {"gluten": "wheat"} |
| `free_from_rules` | `{"gluten-free":["wheat"],"dairy-free":["milk"],"nut-free":["tree nuts","peanuts"]}` | What each free-from claim rules out, e.g. {"gluten-free": ["wheat"]} |

<!-- generated:start -->

## A demo run

`npx -y peach-of-allergens demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Peach of Allergens demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  6 menu item(s): 2 undeclared allergen(s), 1 broken free-from claim(s). 2 dish(es) flagged, 3 to review.
    flag    Caesar Salad                        undeclared_allergen
    flag    Gluten-Free Pasta                   undeclared_allergen, free_from_broken
    review  Fish Tacos                          declared_not_found
    review  Fries Basket                        ingredient_no_data
    review  Seasonal Soup                       no_recipe

▶ Explain Gluten-Free Pasta
  status: executed  decision: allow
  Gluten-Free Pasta: flag. Gluten-Free Pasta contains wheat (from Panko Topping) but the matrix does not declare it. Gluten-Free Pasta is marked gluten free but contains wheat (from Panko Topping).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Allergen matrix against recipes written: 6 menu item(s): 2 undeclared allergen(s), 1 broken free-from claim(s). 2 dish(es) flagged, 3 to review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

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
| `peach_check` | For each menu item: the allergens its ingredients contain against those the matrix declares and the free-from claims it makes. | runs |
| `peach_explain` | Show one menu item from peach_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `peach_write_report` | Write peach-allergens.csv (one row per item, with blank owner and decision columns) and peach-allergens.html into out_dir (default fairtable-out/peach). | runs |
| `peach_draft_memo` | Write drafts/memo-<location>.md: the dishes whose allergen declarations or claims need correcting, for the chef. | asks first (Auto can be opted in) |
| `peach_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `peach_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `peach_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `peach_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `peach_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
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

### Ingredient allergens (`ingredients`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ingredient` (required) | text | Ingredient, Item, Product, Inventory Item | Zutat, Ingrédient, 食材, 食材 |
| `allergens` | text | Allergens, Contains, Allergen List, Allergen | - |

### Allergen matrix (`matrix`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `item` (required) | text | Item, Menu Item, Dish, Recipe | Artikel, Article, 品目, 物料 |
| `allergens` | text | Allergens, Contains, Declared Allergens | - |
| `free_from` | text | Free From, Claims, Dietary, Labels | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx peach-of-allergens inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

peach-of-allergens can remember facts about your setup so the next run does not have to be told again. `peach_learn` only proposes a fact; it changes nothing until a named person accepts it with `peach_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the ingredient or dish |
| `note` | nothing (shown by recall only) |

```bash
peach-of-allergens memory list
peach-of-allergens memory accept MEM-1a2b3c4d5e6f --as "Your Name"
peach-of-allergens memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y peach-of-allergens demo
npx -y peach-of-allergens mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "peach-of-allergens": {
      "command": "npx",
      "args": [
        "-y",
        "peach-of-allergens",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add peach-of-allergens -- npx -y peach-of-allergens mcp --root .`, or install the `peach-of-allergens` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `peach-of-allergens approve <id> --as "Your Name"` (or on the local approvals page, `peach-of-allergens approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`peach-of-allergens kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
peach-of-allergens tools                 # every tool, its policy and arguments
peach-of-allergens sources               # the columns each input is read from
peach-of-allergens inspect <file>        # how a file would be read (names and shapes, never values)
peach-of-allergens call peach_check '{"recipes":"<recipes>","ingredients":"<ingredients>","matrix":"<matrix>"}'
peach-of-allergens eval                  # the private eval cases on the fictional fixtures
peach-of-allergens demo
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
