# fairtable-price-creep

Follows every item's price per pound, each or litre across your distributor invoices, flags creeping increases, prices over your bid or contract and packs that quietly got smaller, with what the increases cost you. Never contacts a vendor.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Read each vendor item's price per base unit through its pack size, compare the latest price with the first one in the file and with the bid price, and add up what was paid above the first price. Flags increases over the threshold, prices over the bid, steady creep and pack changes.

| Finding | Example from the fictional demo data |
|---|---|
| `over_contract` | Fryer Oil from Example Foodservice: bid price 1.1 per lb (valid 2026-09-01 to 2026-12-31), last invoiced 1.2571. Over the bid by 16 on the invoices in the bid period. |
| `pack_changed` | Chicken Breast from Example Foodservice came as 4/10 LB then 4/9 LB; compare the price per lb, not per case. |
| `price_up` | Chicken Breast from Example Foodservice: 3.9 per lb on 2026-10-06, 4.3333 on 2026-11-03 (+11.1%). Paid 31.2 more than at the first price. |
| `small_price_up` | Fryer Oil from Example Foodservice: 1.0857 per lb on 2026-10-06, 1.2571 on 2026-11-03 (+15.8%). Paid 18 more than at the first price. |
| `steady_creep` | Ground Beef 80/20 from Example Foodservice went up 3 invoices in a row. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `flag_pct` | `5` | Price rise % that counts (default 5) |
| `flag_amount` | `25` | Flag when the rise cost at least this much over the period (default 25) |
| `contract_tolerance_pct` | `1` | Allowed % over the bid price (default 1) |
| `creep_steps` | `3` | Increases in a row that count as creep (default 3) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-price-creep demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Price Creep demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  7 item(s) from 3 vendor(s): 121.20 paid above each item's first price, 2 over the bid price. 4 flagged, 0 need review.
    flag    Chicken Breast                      pack_changed, price_up
    flag    Fryer Oil                           small_price_up, over_contract
    flag    Ground Beef 80/20                   price_up, steady_creep
    flag    Salmon Fillet                       price_up, over_contract

▶ Explain Fryer Oil
  status: executed  decision: allow
  Fryer Oil (Example Foodservice): flag. Fryer Oil from Example Foodservice: 1.0857 per lb on 2026-10-06, 1.2571 on 2026-11-03 (+15.8%). Paid 18 more than at the first price. Fryer Oil from Example Foodservice: bid price 1.1 per lb (valid 2026-09-01 to 2026-12-31), last invoiced 1.2571. Over the bid by 16 on the invoices in the bid period.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Vendor price creep written: 7 item(s) from 3 vendor(s): 121.20 paid above each item's first price, 2 over the bid price. 4 flagged, 0 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  letter Example Foodservice drafted for 16 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  letter Example-Foodservice approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries vendor_order_submit itself
  status: blocked  decision: block
  reason: Never places or changes an order with a distributor.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `price_creep_check` | Read each vendor item's price per base unit through its pack size, compare the latest price with the first one in the file and with the bid price, and add up what was paid above the first price. | runs |
| `price_creep_explain` | Show one vendor item from price_creep_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `price_creep_write_report` | Write price-creep.csv (one row per item, with blank owner and decision columns) and price-creep.html into out_dir (default fairtable-out/price_creep). | runs |
| `price_creep_draft_letter` | Write drafts/letter-<vendor>.md: a letter to one vendor listing the items over the bid price and the increases, asking for the bid price and a credit. | asks first (Auto can be opted in) |
| `price_creep_request_send` | After one named human click (even in Auto), record that the reviewed letter draft is approved in letter-requests.csv. | one named click, even in Auto (`binding_send`) |
| `price_creep_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `price_creep_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `price_creep_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `price_creep_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `vendor_order_submit` | Never places or changes an order with a distributor. | refused |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

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

### Bid or contract prices (`contracts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `vendor` (required) | text | Vendor, Supplier, Distributor | Lieferant, Fournisseur, 仕入先, 供应商 |
| `item` (required) | text | Item, Item Description, Product | Artikel, Article, 品目, 物料 |
| `pack` | text | Pack, Pack Size, Pack/Size | Gebinde, Conditionnement, 入数, 规格 |
| `price` | amount | Price, Bid Price, Contract Price, Case Price | - |
| `valid_from` | date | Valid From, Start, Effective | - |
| `valid_to` | date | Valid To, End, Expires | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-price-creep inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-price-creep can remember facts about your setup so the next run does not have to be told again. `price_creep_learn` only proposes a fact; it changes nothing until a named person accepts it with `price_creep_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the item, so its prices are followed together |
| `note` | nothing (shown by recall only) |

```bash
fairtable-price-creep memory list
fairtable-price-creep memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-price-creep memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-price-creep demo
npx -y fairtable-price-creep mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-price-creep": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-price-creep",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-price-creep -- npx -y fairtable-price-creep mcp --root .`, or install the `fairtable-price-creep` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-price-creep approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-price-creep approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-price-creep kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-price-creep tools                 # every tool, its policy and arguments
fairtable-price-creep sources               # the columns each input is read from
fairtable-price-creep inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-price-creep call price_creep_check '{"invoices":"<invoices>"}'
fairtable-price-creep eval                  # the private eval cases on the fictional fixtures
fairtable-price-creep demo
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
