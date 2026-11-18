# fairtable-cash-drawers

Cash over and short for every drawer and shift from your POS cash-out export: expected cash from starting bank, cash sales, paid-outs and tips paid out, against the count and the deposit, with repeated shorts per person. Never moves cash or changes the POS.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each drawer and day: expected cash, counted cash and the difference; the deposit plus the next bank against the count. Flags shorts, deposits that do not match, people short again and again, overs, paid-outs with no receipt and drawers never counted.

| Finding | Example from the fictional demo data |
|---|---|
| `deposit_mismatch` | Front 1 on 2026-11-04: counted 979.5, deposit 700 + next bank 200; 79.5 is not accounted for. |
| `missing_count` | Front 1 on 2026-11-05: no count recorded; expected 1020 in the drawer. |
| `over` | Front 1 on 2026-11-03: over by 8. An over can mean a sale rung as cash and paid by card, or a missed paid-out. |
| `paid_out_no_receipt` | Front 1 on 2026-11-02: paid-outs of 25 with no receipt recorded. |
| `repeat_shorts` | A.S.#653cdb was short on 4 shifts in this period (total 56). |
| `short` | Bar 1 on 2026-11-02: counted 1449, expected 1455 (bank 300 + cash sales 1240 - paid-outs 0 - tips paid 85); short 6. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `flag_short` | `5` | Flag a drawer short by at least this much (default 5) |
| `watch_amount` | `1` | Watch a difference of at least this much (default 1) |
| `review_over` | `5` | Review a drawer over by at least this much (default 5) |
| `repeat_shorts` | `3` | Shorts by the same person that count as a pattern (default 3) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-cash-drawers demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Cash Drawers demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 drawer-day(s), cash sales 8,525.00: net short 48.50, shorts 56.00. 5 flagged, 3 need review.
    flag    Bar 1 2026-11-02                    short, repeat_shorts
    flag    Bar 1 2026-11-03                    short, repeat_shorts
    flag    Bar 1 2026-11-04                    short, repeat_shorts
    flag    Bar 1 2026-11-05                    short, repeat_shorts
    flag    Front 1 2026-11-04                  deposit_mismatch
    review  Front 1 2026-11-02                  paid_out_no_receipt
    review  Front 1 2026-11-03                  over
    review  Front 1 2026-11-05                  missing_count

▶ Explain Front 1 2026-11-04
  status: executed  decision: allow
  Front 1 2026-11-04: flag. Front 1 on 2026-11-04: counted 979.5, deposit 700 + next bank 200; 79.5 is not accounted for.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Cash over and short by drawer written: 8 drawer-day(s), cash sales 8,525.00: net short 48.50, shorts 56.00. 5 flagged, 3 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street drafted for 56 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payment_send itself
  status: blocked  decision: block
  reason: Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `drawers_check` | For each drawer and day: expected cash, counted cash and the difference; the deposit plus the next bank against the count. | runs |
| `drawers_explain` | Show one drawer and day (e.g. | runs |
| `drawers_write_report` | Write elderberry-drawers.csv (one row per item, with blank owner and decision columns) and elderberry-drawers.html into out_dir (default fairtable-out/drawers). | runs |
| `drawers_draft_memo` | Write drafts/memo-<location>.md: the drawers and deposits to check with the closing managers, as questions. | asks first (Auto can be opted in) |
| `drawers_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `drawers_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `drawers_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `drawers_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `drawers_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `payroll_submit` | Never submits or changes payroll, wages or tip payouts; your payroll person does. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Drawer cash-outs (`drawers`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `date` (required) | date | Date, Business Date, Shift Date | Datum, Date, 日付, 日期 |
| `location` | text | Location, Store, Restaurant | Lagerort, Emplacement, 保管場所, 库位 |
| `drawer` (required) | text | Drawer, Cash Drawer, Register, Till, Terminal | Kassenlade, Tiroir-caisse, ドロワー, 钱箱 |
| `employee` | text | Employee, Cashier, Bartender, Closed By, Drawer Owner | Mitarbeiter, Employé, 社員名, 员工 |
| `starting_bank` | amount | Starting Bank, Opening Bank, Start Cash, Float, Opening Float | - |
| `cash_sales` | amount | Cash Sales, Cash Collected, Cash Payments, Cash | - |
| `paid_outs` | amount | Paid Outs, Paid Out, Payouts, Cash Out | - |
| `paid_out_receipts` | number | Paid Out Receipts, Receipts, Receipt Count | - |
| `cash_tips_paid` | amount | Cash Tips Paid, Tips Paid Out, Tip Payout, Card Tips Paid in Cash | - |
| `counted` | amount | Counted, Actual Cash, Cash Counted, Closing Count, Ending Cash | - |
| `deposit` | amount | Deposit, Bank Deposit, Deposit Amount | Anzahlung, Acompte, 前受金, 订金 |
| `next_bank` | amount | Next Bank, Bank Left, Ending Bank, Float Left | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-cash-drawers inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-cash-drawers can remember facts about your setup so the next run does not have to be told again. `drawers_learn` only proposes a fact; it changes nothing until a named person accepts it with `drawers_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-cash-drawers memory list
fairtable-cash-drawers memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-cash-drawers memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-cash-drawers demo
npx -y fairtable-cash-drawers mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-cash-drawers": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-cash-drawers",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-cash-drawers -- npx -y fairtable-cash-drawers mcp --root .`, or install the `fairtable-cash-drawers` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-cash-drawers approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-cash-drawers approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-cash-drawers kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-cash-drawers tools                 # every tool, its policy and arguments
fairtable-cash-drawers sources               # the columns each input is read from
fairtable-cash-drawers inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-cash-drawers call drawers_check '{"drawers":"<drawers>"}'
fairtable-cash-drawers eval                  # the private eval cases on the fictional fixtures
fairtable-cash-drawers demo
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
