# fairtable-utility-bills

Electric, gas and water bills per account and location: usage spikes per day against the account's own history, rate jumps, estimated meter reads, bills charged twice, overlapping periods and late fees. Never pays a bill or contacts the utility.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `bills` (required): Utility bills (typed from the bills or exported from a bill-pay service): account, utility, location, service period, usage, unit, amount, read type, late fee
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

For every bill: usage per day and price per unit against the median of the account's other bills; flags usage spikes and bills charged twice, and lists rate jumps, repeated estimated reads, overlapping periods and late fees.

| Finding | Example from the fictional demo data |
|---|---|
| `duplicate_bill` | WT-7781 (Water): the period 2026-09-01 to 2026-09-30 is billed twice. |
| `estimated_read` | GS-2020: estimated meter read for 2026-08-01 to 2026-08-31. |
| `estimated_twice` | GS-2020: estimated meter read again; ask for an actual read before the estimate is trued up. |
| `late_fee` | GS-2020: late fee of 35 on this bill. |
| `rate_jump` | GS-2020: 1.2435 per therm against a usual 1.05 (+18.4%). Check the tariff or a supplier contract that ended. |
| `usage_spike` | EL-4410 (Electric), 2026-10-01 to 2026-10-31: 422.58 kWh a day against a usual 298.39 (+41.6%). Check equipment left on, a leak or a faulty meter. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `spike_pct` | `25` | Usage per day this % over the account's median is a spike (default 25) |
| `rate_jump_pct` | `15` | Price per unit this % over the median is a rate jump (default 15) |
| `min_history` | `2` | Other bills needed before comparing (default 2) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-utility-bills demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Utility Bills demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  13 bill(s) on 3 account(s), 12,751.00 billed. 2 flagged, 2 need review.
    flag    EL-4410 2026-10-01                  usage_spike
    flag    WT-7781 2026-09-01                  duplicate_bill
    review  GS-2020 2026-09-01                  estimated_twice
    review  GS-2020 2026-10-01                  rate_jump, late_fee
    watch   GS-2020 2026-08-01                  estimated_read

▶ Explain EL-4410 2026-10-01
  status: executed  decision: allow
  EL-4410 2026-10-01: flag. EL-4410 (Electric), 2026-10-01 to 2026-10-31: 422.58 kWh a day against a usual 298.39 (+41.6%). Check equipment left on, a leak or a faulty meter.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Utility bills written: 13 bill(s) on 3 account(s), 12,751.00 billed. 2 flagged, 2 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo utilities drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo utilities approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payment_send itself
  status: blocked  decision: block
  reason: Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `utilities_check` | For every bill: usage per day and price per unit against the median of the account's other bills; flags usage spikes and bills charged twice, and lists rate jumps, repeated estimated reads, overlapping periods and lat… | runs |
| `utilities_explain` | Show one bill (account and period start, e.g. | runs |
| `utilities_write_report` | Write utility-bills.csv (one row per item, with blank owner and decision columns) and utility-bills.html into out_dir (default fairtable-out/utilities). | runs |
| `utilities_draft_memo` | Write drafts/memo-utilities.md: bills to question with the utility (duplicates, estimated reads, rate jumps, late fees) and spikes to check on site. | asks first (Auto can be opted in) |
| `utilities_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `utilities_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `utilities_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `utilities_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `utilities_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |
| `ledger_post` | Never posts journal entries or changes the books. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Utility bills (`bills`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `account` (required) | text | Account, Account Number, Meter, Service Account | Konto, Compte, 勘定科目, 科目代码 |
| `utility` | text | Utility, Service, Type, Commodity | - |
| `location` | text | Location, Store, Restaurant, Site, Service Address | Lagerort, Emplacement, 保管場所, 库位 |
| `period_start` | date | Period Start, Service From, From, Start | - |
| `period_end` | date | Period End, Service To, To, End | - |
| `usage` | number | Usage, Consumption, Quantity, kWh, Therms | - |
| `unit` | text | Unit, UOM, Usage Unit | Einheit, Unité, 単位, 单位 |
| `amount` | amount | Amount, Total, Amount Due, Current Charges | Betrag, Montant, 金額, 金额 |
| `read_type` | text | Read Type, Reading, Meter Read, Actual/Estimated | - |
| `late_fee` | amount | Late Fee, Late Charge, Penalty | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-utility-bills inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-utility-bills can remember facts about your setup so the next run does not have to be told again. `utilities_learn` only proposes a fact; it changes nothing until a named person accepts it with `utilities_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-utility-bills memory list
fairtable-utility-bills memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-utility-bills memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-utility-bills demo
npx -y fairtable-utility-bills mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-utility-bills": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-utility-bills",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-utility-bills -- npx -y fairtable-utility-bills mcp --root .`, or install the `fairtable-utility-bills` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-utility-bills approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-utility-bills approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-utility-bills kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-utility-bills tools                 # every tool, its policy and arguments
fairtable-utility-bills sources               # the columns each input is read from
fairtable-utility-bills inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-utility-bills call utilities_check '{"bills":"<bills>"}'
fairtable-utility-bills eval                  # the private eval cases on the fictional fixtures
fairtable-utility-bills demo
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
