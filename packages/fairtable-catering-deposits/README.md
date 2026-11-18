# fairtable-catering-deposits

Catering and private-event deposits and balances against your bookings: deposits missing as the event gets close, balances overdue after the event, overpayments, refunds owed on cancellations and payments with no booking. Client names are masked for the AI model. Never charges or refunds anyone.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each booking: the deposit required (% of the total), what was received, and the balance; flags deposits missing inside the deposit window, balances overdue after the event, overpayments, refunds owed on cancellations made early enough for a full refund, and payments for events not booked.

| Finding | Example from the fictional demo data |
|---|---|
| `balance_overdue` | EV-303 took place 5 days ago; total 3150, received 787.5; 2362.5 overdue. |
| `cancelled_refund_due` | EV-305 was cancelled 29 days before the event (policy: full refund from 14 days); 350 received and not refunded. |
| `deposit_missing` | EV-302 is 13 days away; deposit required 2880 (30%), received 1000. |
| `overpaid` | EV-306: received 1312.5 on a total of 1250; 62.5 may be owed back. |
| `payment_no_event` | EV-399: 500 received (2026-11-02 check) for an event that is not in the bookings. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is run for (default: today) |
| `deposit_due_days_before` | `30` | The deposit is due this many days before the event (default 30) |
| `balance_due_days_after` | `3` | The balance is overdue this many days after the event (default 3) |
| `full_refund_days_before` | `14` | Your policy refunds the deposit in full when cancelled at least this many days before (default 14) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-catering-deposits demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Catering Deposits demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  6 booking(s) at 2026-11-15: booked 19,400.00, received 7,100.00; owed to you 4,242.50, owed back 412.50. 2 flagged, 3 need review.
    flag    EV-302                              deposit_missing
    flag    EV-303                              balance_overdue
    review  EV-305                              cancelled_refund_due
    review  EV-306                              overpaid
    review  EV-399                              payment_no_event

▶ Explain EV-302
  status: executed  decision: allow
  EV-302: flag. EV-302 is 13 days away; deposit required 2880 (30%), received 1000.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Catering deposits and balances written: 6 booking(s) at 2026-11-15: booked 19,400.00, received 7,100.00; owed to you 4,242.50, owed back 412.50. 2 flagged, 3 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  reminder EV-302 drafted for 1880 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  reminder EV-302 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payment_send itself
  status: blocked  decision: block
  reason: Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `catering_check` | For each booking: the deposit required (% of the total), what was received, and the balance; flags deposits missing inside the deposit window, balances overdue after the event, overpayments, refunds owed on cancellati… | runs |
| `catering_explain` | Show one event from catering_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `catering_write_report` | Write catering-deposits.csv (one row per item, with blank owner and decision columns) and catering-deposits.html into out_dir (default fairtable-out/catering). | runs |
| `catering_draft_reminder` | Write drafts/reminder-<event>.md: a polite reminder to the client of the deposit or balance due, or a note of the refund owed, for a person to send. | asks first (Auto can be opted in) |
| `catering_request_send` | After one named human click (even in Auto), record that the reviewed reminder draft is approved in reminder-requests.csv. | one named click, even in Auto (`binding_send`) |
| `catering_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `catering_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `catering_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `catering_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `refund_issue` | Never issues a refund or a credit to a guest or a card. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Event bookings (`events`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `event_id` (required) | text | Event ID, Event, Booking ID, BEO, Order Number | - |
| `client` | text | Client, Customer, Host, Contact, Organizer | - |
| `location` | text | Location, Venue, Restaurant, Room | Lagerort, Emplacement, 保管場所, 库位 |
| `booked_date` | date | Booked Date, Booked, Created | - |
| `event_date` | date | Event Date, Date, Function Date | - |
| `guests` | number | Guests, Guest Count, Headcount, Covers | - |
| `total` | amount | Total, Contract Total, Estimated Total, Amount | - |
| `deposit_pct` | number | Deposit %, Deposit Pct, Deposit Percent | - |
| `status` | text | Status, Booking Status, State | Status, Statut, ステータス, 状态 |
| `cancelled_date` | date | Cancelled Date, Cancelled On, Cancellation Date | - |

### Payments received (`payments`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `event_id` (required) | text | Event ID, Event, Booking ID, Reference, Order Number | - |
| `date` | date | Date, Payment Date, Received | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Payment, Paid | Betrag, Montant, 金額, 金额 |
| `type` | text | Type, Payment Type, Kind | Typ, Type, 種類, 类型 |
| `method` | text | Method, Tender, Payment Method | Zahlungsart, Mode de paiement, 支払方法, 付款方式 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-catering-deposits inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-catering-deposits can remember facts about your setup so the next run does not have to be told again. `catering_learn` only proposes a fact; it changes nothing until a named person accepts it with `catering_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-catering-deposits memory list
fairtable-catering-deposits memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-catering-deposits memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-catering-deposits demo
npx -y fairtable-catering-deposits mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-catering-deposits": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-catering-deposits",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-catering-deposits -- npx -y fairtable-catering-deposits mcp --root .`, or install the `fairtable-catering-deposits` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-catering-deposits approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-catering-deposits approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-catering-deposits kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-catering-deposits tools                 # every tool, its policy and arguments
fairtable-catering-deposits sources               # the columns each input is read from
fairtable-catering-deposits inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-catering-deposits call catering_check '{"events":"<events>","payments":"<payments>"}'
fairtable-catering-deposits eval                  # the private eval cases on the fictional fixtures
fairtable-catering-deposits demo
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
