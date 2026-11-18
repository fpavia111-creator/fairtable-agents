# blueberry-of-deliveries

Matches every invoice line with what the receiving log says arrived and with the credit memos, and lists shorts, rejected cases and substitutions still waiting for a credit. Writes a credit request draft. Never pays and never contacts the vendor.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each invoice line: quantity invoiced against quantity received and rejected, the credit that should follow, and the credit memos that did. Flags shorts and rejected cases not credited, over-credits, items received but not invoiced and invoices nobody received.

| Finding | Example from the fictional demo data |
|---|---|
| `no_receiving_record` | Invoice SP-7790 from Sample Produce Co has no receiving record; nobody signed for Avocados. |
| `received_not_invoiced` | Sweet Potato Fries was received on EF-50388 (1, "substitute sent") but is not on the invoice: a substitute or a missing line. Check the price on the next invoice. |
| `rejected_not_credited` | Chicken Breast on EF-50311: 1 rejected at delivery (one case received warm (48F) - rejected); credit expected 156, credited 0. |
| `short_not_credited` | Frozen Fries on EF-50388: invoiced 4, received 3; credit expected 33, credited 20 (CM-2240). |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `tolerance` | `1` | Differences up to this amount are ignored (default 1.00) |
| `rejected_words` | `["reject","damag","warm","temp","spoil","broken"]` | Words in a receiving note that mean goods were refused |

<!-- generated:start -->

## A demo run

`npx -y blueberry-of-deliveries demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Blueberry of Deliveries demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  11 line(s) on 5 invoice(s): credits expected 293.00, credited 124.00, still owed 169.00. 2 flagged, 2 need review.
    flag    Chicken Breast                      rejected_not_credited
    flag    Frozen Fries                        short_not_credited
    review  Avocados                            no_receiving_record
    review  Sweet Potato Fries                  received_not_invoiced

▶ Explain Chicken Breast
  status: executed  decision: allow
  Chicken Breast (EF-50311): flag. Chicken Breast on EF-50311: 1 rejected at delivery (one case received warm (48F) - rejected); credit expected 156, credited 0.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Invoices against deliveries and credit memos written: 11 line(s) on 5 invoice(s): credits expected 293.00, credited 124.00, still owed 169.00. 2 flagged, 2 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  credit request Example Foodservice drafted for 169 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [ATTACH receiving slips]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  credit request Example-Foodservice approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payment_send itself
  status: blocked  decision: block
  reason: Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `blueberry_check` | For each invoice line: quantity invoiced against quantity received and rejected, the credit that should follow, and the credit memos that did. | runs |
| `blueberry_explain` | Show one invoice line item from blueberry_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `blueberry_write_report` | Write blueberry-deliveries.csv (one row per item, with blank owner and decision columns) and blueberry-deliveries.html into out_dir (default fairtable-out/blueberry). | runs |
| `blueberry_draft_credit_request` | Write drafts/credit_request-<vendor>.md: the shorts and rejected cases on that vendor's invoices that are not credited yet, with the amount, for a person to send. | asks first (Auto can be opted in) |
| `blueberry_request_send` | After one named human click (even in Auto), record that the reviewed credit request draft is approved in credit_request-requests.csv. | one named click, even in Auto (`binding_send`) |
| `blueberry_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `blueberry_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `blueberry_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `blueberry_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `vendor_order_submit` | Never places or changes an order with a distributor. | refused |
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

### Receiving log (`receiving`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `invoice_number` (required) | text | Invoice Number, Invoice #, Invoice, Delivery Ticket, Ticket | Rechnungsnummer, N° de facture, 請求書番号, 发票号 |
| `vendor` | text | Vendor, Supplier, Distributor | Lieferant, Fournisseur, 仕入先, 供应商 |
| `received_date` | date | Received Date, Date, Delivery Date | - |
| `item` (required) | text | Item, Item Description, Product, Description | Artikel, Article, 品目, 物料 |
| `qty_received` | number | Qty Received, Received, Quantity Received, Qty | - |
| `qty_rejected` | number | Qty Rejected, Rejected, Refused, Returned | - |
| `note` | text | Note, Notes, Comment, Condition, Remarks | - |
| `received_by` | text | Received By, Checked By, Receiver, Signed By | - |

### Credit memos (`credits`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `credit_number` | text | Credit Number, Credit Memo, Credit #, CM Number, Memo Number | Gutschriftsnummer, N° d’avoir, クレジットメモ番号, 贷项通知单号 |
| `vendor` | text | Vendor, Supplier | Lieferant, Fournisseur, 仕入先, 供应商 |
| `invoice_number` (required) | text | Invoice Number, Original Invoice, Invoice #, Applies To | Rechnungsnummer, N° de facture, 請求書番号, 发票号 |
| `item` | text | Item, Item Description, Product, Description | Artikel, Article, 品目, 物料 |
| `amount` | amount | Amount, Credit Amount, Total, Credit | Betrag, Montant, 金額, 金额 |
| `credit_date` | date | Credit Date, Date | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx blueberry-of-deliveries inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

blueberry-of-deliveries can remember facts about your setup so the next run does not have to be told again. `blueberry_learn` only proposes a fact; it changes nothing until a named person accepts it with `blueberry_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that name as the invoice item in the receiving log and credit memos |
| `note` | nothing (shown by recall only) |

```bash
blueberry-of-deliveries memory list
blueberry-of-deliveries memory accept MEM-1a2b3c4d5e6f --as "Your Name"
blueberry-of-deliveries memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y blueberry-of-deliveries demo
npx -y blueberry-of-deliveries mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "blueberry-of-deliveries": {
      "command": "npx",
      "args": [
        "-y",
        "blueberry-of-deliveries",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add blueberry-of-deliveries -- npx -y blueberry-of-deliveries mcp --root .`, or install the `blueberry-of-deliveries` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `blueberry-of-deliveries approve <id> --as "Your Name"` (or on the local approvals page, `blueberry-of-deliveries approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`blueberry-of-deliveries kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
blueberry-of-deliveries tools                 # every tool, its policy and arguments
blueberry-of-deliveries sources               # the columns each input is read from
blueberry-of-deliveries inspect <file>        # how a file would be read (names and shapes, never values)
blueberry-of-deliveries call blueberry_check '{"invoices":"<invoices>","receiving":"<receiving>"}'
blueberry-of-deliveries eval                  # the private eval cases on the fictional fixtures
blueberry-of-deliveries demo
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
