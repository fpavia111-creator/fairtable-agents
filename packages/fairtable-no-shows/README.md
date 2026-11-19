# fairtable-no-shows

Reservation no-shows from your OpenTable or Resy export: the no-show rate by day, guests who no-show again and again, large parties booked with no deposit and no-show fees your policy says to charge, with covers and sales lost. Guest details are masked for the AI model. Never charges a card or messages a guest.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `reservations` (required): Reservation export (OpenTable or Resy): reservation id, guest, phone, email, date, time, party size, status, deposit, fee charged, source
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

Count no-shows by guest and by day of the week, estimate covers and sales lost at the average check, and flag repeat no-shows, large parties with no deposit, no-show fees not charged under the policy in the settings and a no-show rate over target.

| Finding | Example from the fictional demo data |
|---|---|
| `fee_not_charged` | S.W.#1ea643: no-show on 2026-11-06 with a deposit or card held and no fee charged; the policy fee would be 120. A person decides whether to charge it. |
| `high_no_show_rate` | 5 of 12 reservations were no-shows (41.7%), over the 15% target. |
| `large_party_no_deposit` | C.B.#c177cc: party of 8 on 2026-11-05 booked by Phone with no deposit, though the policy asks for one from 6 guests. |
| `no_show` | C.B.#c177cc did not show on 2026-11-05 (party of 8). |
| `repeat_no_show` | M.E.#083df9 did not show 3 times (2026-11-04 party of 4, 2026-11-06 party of 2, 2026-11-08 party of 2). |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `deposit_party_size` | `6` | Your policy asks for a deposit from parties this size (default 6) |
| `no_show_fee_per_guest` | `0` | Your no-show fee per guest when a card is held (default 0 = no fee policy) |
| `repeat_no_shows` | `2` | No-shows by one guest that count as repeat (default 2) |
| `average_check_per_cover` | `45` | Average spend per guest, for the sales lost estimate (default 45) |
| `flag_rate_pct` | `15` | Flag a no-show rate over this % (default 15) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-no-shows demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable No-Shows demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  5 no-show(s) out of 12 reservation(s) (41.7%): 22 covers, about 990.00 in sales; fees not charged under the policy 120.00. 2 flagged, 2 need review.
    flag    All reservations                    high_no_show_rate
    flag    M.E.#083df9                         repeat_no_show
    review  C.B.#c177cc                         no_show, large_party_no_deposit
    review  S.W.#1ea643                         no_show, fee_not_charged

▶ Explain Morgan Ellis
  status: executed  decision: allow
  M.E.#083df9: flag. M.E.#083df9 did not show 3 times (2026-11-04 party of 4, 2026-11-06 party of 2, 2026-11-08 party of 2).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Reservation no-shows written: 5 no-show(s) out of 12 reservation(s) (41.7%): 22 covers, about 990.00 in sales; fees not charged under the policy 120.00. 2 flagged, 2 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  policy memo Main Street drafted for 990 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  policy memo Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries card_charge itself
  status: blocked  decision: block
  reason: Never charges a no-show fee or a deposit to a guest's card.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `no_shows_check` | Count no-shows by guest and by day of the week, estimate covers and sales lost at the average check, and flag repeat no-shows, large parties with no deposit, no-show fees not charged under the policy in the settings a… | runs |
| `no_shows_explain` | Show one guest from no_shows_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `no_shows_write_report` | Write no-shows.csv (one row per item, with blank owner and decision columns) and no-shows.html into out_dir (default fairtable-out/no_shows). | runs |
| `no_shows_draft_policy_memo` | Write drafts/policy_memo-<location>.md: the no-show numbers and the guests and bookings that the deposit and fee policy should have covered, for the hosts and the owner. | asks first (Auto can be opted in) |
| `no_shows_request_send` | After one named human click (even in Auto), record that the reviewed policy memo draft is approved in policy_memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `no_shows_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `no_shows_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `no_shows_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `no_shows_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `card_charge` | Never charges a no-show fee or a deposit to a guest's card. | refused |
| `guest_message_send` | Never texts, emails or calls a guest. | refused |
| `delivery_platform_submit` | Never logs in to or submits anything on a delivery-app or reservation portal. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Reservations (`reservations`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `reservation_id` | text | Reservation ID, Confirmation, Confirmation Number, Booking ID, Res ID | Reservierungsnummer, N° de réservation, 予約番号, 预订编号 |
| `guest` | text | Guest Name, Guest, Name, Customer, Booked By | Gast, Client, 予約者名, 顾客 |
| `phone` | text | Phone, Phone Number, Mobile, Guest Phone | Telefon, Téléphone, 電話番号, 电话 |
| `email` | text | Email, Guest Email, E-mail | E-Mail, E-mail, メールアドレス, 邮箱 |
| `date` (required) | date | Visit Date, Date, Reservation Date, Booking Date | Datum, Date, 日付, 日期 |
| `time` | text | Visit Time, Time, Reservation Time | Uhrzeit, Heure, 時刻, 时间 |
| `party_size` | number | Party Size, Covers, Guests, Party, Size | Personen, Couverts, 人数, 人数 |
| `status` | text | Status, Reservation Status, Visit Status, State | Status, Statut, ステータス, 状态 |
| `deposit` | amount | Deposit, Deposit Amount, Prepayment, Card Hold | Anzahlung, Acompte, 前受金, 订金 |
| `fee_charged` | amount | No-show Fee, Cancellation Fee, Fee Charged, Penalty | Stornogebühr, Frais d’annulation, キャンセル料, 违约金 |
| `source` | text | Source, Channel, Booked Via, Origin | Quelle, Source, 予約経路, 来源 |
| `location` | text | Location, Restaurant, Venue, Store | Lagerort, Emplacement, 保管場所, 库位 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| OpenTable | Reservations / guest visits export | Visit Date, Party Size, Status, Guest Name | no |
| Resy | Reservations export | Date, Time, Party Size, Status, Guest, Table | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-no-shows inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-no-shows can remember facts about your setup so the next run does not have to be told again. `no_shows_learn` only proposes a fact; it changes nothing until a named person accepts it with `no_shows_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-no-shows memory list
fairtable-no-shows memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-no-shows memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-no-shows demo
npx -y fairtable-no-shows mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-no-shows": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-no-shows",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-no-shows -- npx -y fairtable-no-shows mcp --root .`, or install the `fairtable-no-shows` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-no-shows approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-no-shows approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-no-shows kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-no-shows tools                 # every tool, its policy and arguments
fairtable-no-shows sources               # the columns each input is read from
fairtable-no-shows inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-no-shows call no_shows_check '{"reservations":"<reservations>"}'
fairtable-no-shows eval                  # the private eval cases on the fictional fixtures
fairtable-no-shows demo
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
