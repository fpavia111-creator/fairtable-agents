# fairtable-duplicate-invoices

Vendor invoices before they are paid: the same invoice entered twice, likely duplicates under a new number, line math that does not add up, missing invoice numbers, and lines coded to the wrong GL account (liquor in food cost, paper goods in food). Never pays and never posts to the books.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Group invoice lines into invoices; flag an invoice number entered again and line math errors; review the same amount from the same vendor within a few days, invoices with no number and lines coded against your GL rules.

| Finding | Example from the fictional demo data |
|---|---|
| `duplicate_number` | Example Foodservice invoice EF-50311 was already entered dated 2026-11-03 for 633.8; this copy is dated 2026-11-10 for 384. |
| `gl_miscoded` | Example Foodservice EF-50311: "To-go Containers 9in" is coded to 5000 Food COGS; your rules put it in 5300 Paper and Supplies. |
| `line_math` | Example Seafood ES-1180: Salmon Fillet 2 x 132 = 264, billed 246. |
| `missing_number` | Example Linen Co invoice dated 2026-11-07 (140) has no invoice number, so a second copy could not be caught. |
| `possible_duplicate` | Sample Produce Co invoice SP-7790 for 105 matches invoice SP-7712 of 2026-11-04, 2 day(s) apart. Check it is a second delivery, not a second bill. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `gl_rules` | `[]` | Keyword rules: item names matching "match" (a regular expression) belong in GL account "gl" |
| `duplicate_window_days` | `5` | Same amount from the same vendor within this many days is a possible duplicate (default 5) |
| `tolerance` | `0.02` | Rounding allowed in line math and amounts (default 0.02) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-duplicate-invoices demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Duplicate Invoices demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 invoice(s), 2,263.80: 384.00 entered twice, 2 line(s) coded against your GL rules. 2 to hold, 4 to check.
    flag    Example Foodservice EF-50311 2026-  duplicate_number
    flag    Example Seafood ES-1180 2026-11-05  line_math
    review  Example Foodservice EF-50311 2026-  gl_miscoded
    review  Example Linen Co (no number) 2026-  missing_number
    review  Sample Beverage Co SB-3001 2026-11  gl_miscoded
    review  Sample Produce Co SP-7790 2026-11-  possible_duplicate

▶ Explain Example Foodservice EF-50311 2026-11-10
  status: executed  decision: allow
  Example Foodservice EF-50311 2026-11-10: flag. Example Foodservice invoice EF-50311 was already entered dated 2026-11-03 for 633.8; this copy is dated 2026-11-10 for 384.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Duplicate invoices and GL coding written: 8 invoice(s), 2,263.80: 384.00 entered twice, 2 line(s) coded against your GL rules. 2 to hold, 4 to check.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  hold memo ap drafted for 384 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  hold memo ap approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payment_send itself
  status: blocked  decision: block
  reason: Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `invoices_check` | Group invoice lines into invoices; flag an invoice number entered again and line math errors; review the same amount from the same vendor within a few days, invoices with no number and lines coded against your GL rules. | runs |
| `invoices_explain` | Show one invoice (vendor, number and date) from invoices_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `invoices_write_report` | Write quince-invoices.csv (one row per item, with blank owner and decision columns) and quince-invoices.html into out_dir (default fairtable-out/invoices). | runs |
| `invoices_draft_hold_memo` | Write drafts/hold_memo-ap.md: the invoices to hold before the next payment run and the lines to recode, for the bookkeeper. | asks first (Auto can be opted in) |
| `invoices_request_send` | After one named human click (even in Auto), record that the reviewed hold memo draft is approved in hold_memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `invoices_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `invoices_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `invoices_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `invoices_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `ledger_post` | Never posts journal entries or changes the books. | refused |
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

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-duplicate-invoices inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-duplicate-invoices can remember facts about your setup so the next run does not have to be told again. `invoices_learn` only proposes a fact; it changes nothing until a named person accepts it with `invoices_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that vendor name as the vendor, so its invoices are compared together |
| `note` | nothing (shown by recall only) |

```bash
fairtable-duplicate-invoices memory list
fairtable-duplicate-invoices memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-duplicate-invoices memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-duplicate-invoices demo
npx -y fairtable-duplicate-invoices mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-duplicate-invoices": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-duplicate-invoices",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-duplicate-invoices -- npx -y fairtable-duplicate-invoices mcp --root .`, or install the `fairtable-duplicate-invoices` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-duplicate-invoices approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-duplicate-invoices approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-duplicate-invoices kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-duplicate-invoices tools                 # every tool, its policy and arguments
fairtable-duplicate-invoices sources               # the columns each input is read from
fairtable-duplicate-invoices inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-duplicate-invoices call invoices_check '{"invoices":"<invoices>"}'
fairtable-duplicate-invoices eval                  # the private eval cases on the fictional fixtures
fairtable-duplicate-invoices demo
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
