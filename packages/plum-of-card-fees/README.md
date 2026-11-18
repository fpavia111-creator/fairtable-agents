# plum-of-card-fees

Reads monthly card processing statements: the effective rate per location and month, processor markup over your agreed rate, fees you never agreed to, monthly fees over their cap and downgrade surcharges. Never contacts the processor or changes the account.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each location and month: total fees over card volume (the effective rate), the processor markup against the agreed basis points plus per-transaction fee, and every other fee against your agreement list. Flags markup over contract, fees over cap and rising effective rates; lists unexpected fees and downgrade surcharges.

| Finding | Example from the fictional demo data |
|---|---|
| `downgrade_surcharge` | Main Street 2026-10: "Non-qualified surcharge" 212. Downgrades often come from keyed or late-settled transactions; ask the processor which ones. |
| `effective_rate_up` | Main Street: effective rate 2.906% in 2026-10 against 2.415% the month before (+49 basis points). |
| `fee_over_cap` | Main Street 2026-10: "Monthly service fee" 35 against the agreed 25. |
| `markup_over_contract` | Main Street 2026-10: processor markup 1136 against 781 at the agreed 0.3% + 0.1 a transaction on 142000 and 3550 transactions. |
| `unexpected_fee` | Main Street 2026-10: "PCI non-compliance fee" 49.95 is not a fee in your agreement settings. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `markup_bps` | `null` | Agreed processor markup over interchange, in basis points (30 = 0.30%); null to skip the check |
| `per_transaction_fee` | `0` | Agreed processor fee per transaction (default 0) |
| `allowed_fees` | `{}` | Fees in your agreement with their monthly cap, e.g. {"Monthly service fee": 25} |
| `rate_up_bps` | `15` | Flag an effective rate this many basis points over the month before (default 15) |
| `tolerance` | `1` | Amount ignored per check (default 1) |

<!-- generated:start -->

## A demo run

`npx -y plum-of-card-fees demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Plum of Card Fees demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  3 statement(s): 9,022.95 in fees on 343,000.00 of card volume (effective rate 2.6306%); 414.95 to raise with the processor. 1 flagged, 0 need review.
    flag    Main Street 2026-10                 markup_over_contract, fee_over_cap, downgrade_surcharge, unexpected_fee, effective_rate_up

▶ Explain Main Street 2026-10
  status: executed  decision: allow
  Main Street 2026-10: flag. Main Street 2026-10: processor markup 1136 against 781 at the agreed 0.3% + 0.1 a transaction on 142000 and 3550 transactions. Main Street 2026-10: "Monthly service fee" 35 against the agreed 25. Main Street 2026-10: "Non-qualified surcharge" 212. Downgrades often come from keyed or late-settled transactions; ask the processor which ones. Main Street 2026-10: "PCI non-compliance fee" 49.95 is not a fee in your agreement settings. Main Street: effective rate 2.906% in 2026-10 against 2.415% the month before (+49 basis points).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Card processing fees written: 3 statement(s): 9,022.95 in fees on 343,000.00 of card volume (effective rate 2.6306%); 414.95 to raise with the processor. 1 flagged, 0 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  letter processor drafted for 414.95 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [ATTACH]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  letter processor approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payment_send itself
  status: blocked  decision: block
  reason: Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `plum_check` | For each location and month: total fees over card volume (the effective rate), the processor markup against the agreed basis points plus per-transaction fee, and every other fee against your agreement list. | runs |
| `plum_explain` | Show one location and month (e.g. | runs |
| `plum_write_report` | Write plum-card-fees.csv (one row per item, with blank owner and decision columns) and plum-card-fees.html into out_dir (default fairtable-out/plum). | runs |
| `plum_draft_letter` | Write drafts/letter-processor.md: the markup over the agreed rate and the fees outside the agreement, asking for a refund and the correct pricing. | asks first (Auto can be opted in) |
| `plum_request_send` | After one named human click (even in Auto), record that the reviewed letter draft is approved in letter-requests.csv. | one named click, even in Auto (`binding_send`) |
| `plum_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `plum_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `plum_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `plum_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |
| `merchant_account_change` | Never changes or cancels the merchant account. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Card statements (`statements`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `month` (required) | text | Month, Statement Month, Period | - |
| `location` | text | Location, Merchant, Store, MID Name | Lagerort, Emplacement, 保管場所, 库位 |
| `card_brand` | text | Card Brand, Brand, Card Type, Network | - |
| `volume` | amount | Volume, Sales Volume, Gross Sales, Amount Processed | - |
| `transactions` | number | Transactions, Count, Items, Transaction Count | - |
| `fee_name` (required) | text | Fee Name, Description, Fee, Fee Description | - |
| `fee_type` | text | Fee Type, Type, Category | - |
| `amount` | amount | Amount, Fee Amount, Total | Betrag, Montant, 金額, 金额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx plum-of-card-fees inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

plum-of-card-fees can remember facts about your setup so the next run does not have to be told again. `plum_learn` only proposes a fact; it changes nothing until a named person accepts it with `plum_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
plum-of-card-fees memory list
plum-of-card-fees memory accept MEM-1a2b3c4d5e6f --as "Your Name"
plum-of-card-fees memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y plum-of-card-fees demo
npx -y plum-of-card-fees mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "plum-of-card-fees": {
      "command": "npx",
      "args": [
        "-y",
        "plum-of-card-fees",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add plum-of-card-fees -- npx -y plum-of-card-fees mcp --root .`, or install the `plum-of-card-fees` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `plum-of-card-fees approve <id> --as "Your Name"` (or on the local approvals page, `plum-of-card-fees approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`plum-of-card-fees kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
plum-of-card-fees tools                 # every tool, its policy and arguments
plum-of-card-fees sources               # the columns each input is read from
plum-of-card-fees inspect <file>        # how a file would be read (names and shapes, never values)
plum-of-card-fees call plum_check '{"statements":"<statements>"}'
plum-of-card-fees eval                  # the private eval cases on the fictional fixtures
plum-of-card-fees demo
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
