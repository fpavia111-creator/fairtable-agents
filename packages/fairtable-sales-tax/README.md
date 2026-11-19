# fairtable-sales-tax

Tax collected in the POS against the rates you set for each location and menu category (food, alcohol, grocery, delivery-app orders), with under- and over-collection by jurisdiction and tax-exempt sales to document. Never files a return or pays tax.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `sales` (required): POS sales with tax (sales summary or item sales): location, channel or dining option, category, net sales, tax collected, tax exempt
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

Group POS sales by location, category, marketplace and exemption; compare the tax collected with net sales x the rate in the settings; flag under-collection, list over-collection, marketplace orders with tax in the POS, exempt sales and locations with no rate.

| Finding | Example from the fictional demo data |
|---|---|
| `exempt_sales` | Harbor Road | Food | exempt: 1200 of sales marked tax-exempt. Keep the exemption certificate for each one. |
| `marketplace_tax_in_pos` | Main Street | Food | marketplace: 74.25 of tax recorded in the POS on DoorDash, Uber Eats orders. Where the marketplace collects and remits the tax, remitting this too would pay it twice; check how the POS records these orders. |
| `over_collected` | Main Street | Grocery: collected 24.75, the settings say 0% = 0; 24.75 over. Over-collected tax is usually owed to the state, not kept. |
| `under_collected` | Main Street | Alcohol: collected 346.5 on 4200 (8.25%), the settings say 10.25% = 430.5; 84 under. |
| `unknown_location` | Airport Kiosk has no tax rate in the settings, so 900 of sales were not checked. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `locations` | `{}` | Per location: the jurisdiction name, its rate % and rates for categories that differ (alcohol, grocery). Rates come from your tax authority, not from this agent. |
| `marketplace_channels` | `["DoorDash","Uber Eats","Grubhub"]` | Channels where the marketplace collects and remits the tax |
| `tolerance_pct` | `0.5` | Difference allowed, % of the expected tax (default 0.5) |
| `tolerance_amount` | `2` | Difference allowed in money (default 2) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-sales-tax demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Sales Tax demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 location/category line(s): net sales 32,500.00, tax collected 2,353.00 against 2,266.00 expected; under 84.00, over 24.75. 1 flagged, 3 need review.
    flag    Main Street | Alcohol               under_collected
    review  Airport Kiosk | Food                unknown_location
    review  Main Street | Food | marketplace    marketplace_tax_in_pos
    review  Main Street | Grocery               over_collected
    watch   Harbor Road | Food | exempt         exempt_sales

▶ Explain Main Street | Alcohol
  status: executed  decision: allow
  Main Street | Alcohol: flag. Main Street | Alcohol: collected 346.5 on 4200 (8.25%), the settings say 10.25% = 430.5; 84 under.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Sales tax by jurisdiction written: 8 location/category line(s): net sales 32,500.00, tax collected 2,353.00 against 2,266.00 expected; under 84.00, over 24.75. 1 flagged, 3 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo sales-tax drafted for 84 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo sales-tax approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries tax_return_file itself
  status: blocked  decision: block
  reason: Never files a tax return or makes a tax payment.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `sales_tax_check` | Group POS sales by location, category, marketplace and exemption; compare the tax collected with net sales x the rate in the settings; flag under-collection, list over-collection, marketplace orders with tax in the PO… | runs |
| `sales_tax_explain` | Show one location and category (e.g. | runs |
| `sales_tax_write_report` | Write sales-tax.csv (one row per item, with blank owner and decision columns) and sales-tax.html into out_dir (default fairtable-out/sales_tax). | runs |
| `sales_tax_draft_memo` | Write drafts/memo-sales-tax.md: the lines collected under or over the rates in the settings, the marketplace lines and exempt sales, for the bookkeeper before the return is prepared. | asks first (Auto can be opted in) |
| `sales_tax_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `sales_tax_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `sales_tax_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `sales_tax_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `sales_tax_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `tax_return_file` | Never files a tax return or makes a tax payment. | refused |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### POS sales with tax (`sales`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `date` | date | Date, Business Date, Order Date | Datum, Date, 日付, 日期 |
| `location` (required) | text | Location, Store, Restaurant, Revenue Center | Lagerort, Emplacement, 保管場所, 库位 |
| `channel` | text | Channel, Dining Option, Order Type, Source, Service | - |
| `category` | text | Category, Sales Category, Tax Category, Menu Group | Kategorie, Catégorie, 経費科目, 费用类别 |
| `item` | text | Item, Menu Item, Description | Artikel, Article, 品目, 物料 |
| `net_sales` | amount | Net Sales, Taxable Sales, Net Amount, Sales | Nettoumsatz, Ventes nettes, 純売上, 净销售额 |
| `tax` | amount | Tax, Tax Collected, Sales Tax, Tax Amount | Steuer, TVA, 税額, 税额 |
| `tax_exempt` | yes/no | Tax Exempt, Exempt, Tax Exempt? | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-sales-tax inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-sales-tax can remember facts about your setup so the next run does not have to be told again. `sales_tax_learn` only proposes a fact; it changes nothing until a named person accepts it with `sales_tax_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-sales-tax memory list
fairtable-sales-tax memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-sales-tax memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-sales-tax demo
npx -y fairtable-sales-tax mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-sales-tax": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-sales-tax",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-sales-tax -- npx -y fairtable-sales-tax mcp --root .`, or install the `fairtable-sales-tax` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-sales-tax approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-sales-tax approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-sales-tax kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-sales-tax tools                 # every tool, its policy and arguments
fairtable-sales-tax sources               # the columns each input is read from
fairtable-sales-tax inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-sales-tax call sales_tax_check '{"sales":"<sales>"}'
fairtable-sales-tax eval                  # the private eval cases on the fictional fixtures
fairtable-sales-tax demo
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
