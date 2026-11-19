# fairtable-schedule-vs-actual

Scheduled against actual labor from your schedule and timecard exports: early clock-ins, late clock-outs, late arrivals, no-shows and shifts nobody scheduled, with the extra hours priced at each person's rate. Never edits the schedule or timecards.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `schedule` (required): Published schedule (7shifts, Homebase or POS export): employee, role, shift start, shift end
- `timecards` (required): Timecards for the same weeks: employee, clock in, clock out, unpaid break minutes, hourly rate
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

Match timecards to the schedule by person and day; count minutes early and late; list no-shows and unscheduled shifts; flag weeks worked well over schedule with the cost of the extra hours.

| Finding | Example from the fictional demo data |
|---|---|
| `early_clock_in` | J.L.#864547 clocked in early: 2026-11-03 (45 min), 2026-11-04 (40 min), 2026-11-05 (30 min). |
| `late_arrival` | A.S.#653cdb arrived late: 2026-11-04 (20 min). |
| `late_clock_out` | J.L.#864547 clocked out late: 2026-11-03 (70 min), 2026-11-04 (60 min), 2026-11-05 (45 min). |
| `no_show` | J.O.#49bc44 was scheduled 2026-11-06 16:00 to 22:00 and has no punch that day. |
| `over_schedule` | J.L.#864547, week of 2026-11-02: worked 27.34 hours against 24 scheduled (+3.34). |
| `unscheduled_shift` | R.C.#dab90c clocked in 2026-11-07 17:00 with no shift scheduled that day. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `early_minutes` | `7` | Minutes before the shift that count as early (default 7) |
| `late_out_minutes` | `7` | Minutes after the shift that count as a late clock-out (default 7) |
| `late_in_minutes` | `7` | Minutes after the start that count as late (default 7) |
| `flag_extra_hours` | `2` | Flag a week this many hours over schedule (default 2) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-schedule-vs-actual demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Schedule vs Actual demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  4 employee-week(s): 60.05 hours worked against 58 scheduled (+2.05), extra hours cost 140.12. 2 flagged, 1 need review.
    flag    J.L.#864547                         early_clock_in, late_clock_out, over_schedule
    flag    R.C.#dab90c                         unscheduled_shift, over_schedule
    review  J.O.#49bc44                         no_show
    watch   A.S.#653cdb                         late_arrival

▶ Explain Jordan Lee
  status: executed  decision: allow
  J.L.#864547 (2026-11-02): flag. J.L.#864547 clocked in early: 2026-11-03 (45 min), 2026-11-04 (40 min), 2026-11-05 (30 min). J.L.#864547 clocked out late: 2026-11-03 (70 min), 2026-11-04 (60 min), 2026-11-05 (45 min). J.L.#864547, week of 2026-11-02: worked 27.34 hours against 24 scheduled (+3.34).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Scheduled against actual labor written: 4 employee-week(s): 60.05 hours worked against 58 scheduled (+2.05), extra hours cost 140.12. 2 flagged, 1 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Week of 2026-11-02 drafted for 140.12 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Week-of-2026-11-02 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries schedule_publish itself
  status: blocked  decision: block
  reason: Never publishes or edits the staff schedule or timecards.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `schedule_check` | Match timecards to the schedule by person and day; count minutes early and late; list no-shows and unscheduled shifts; flag weeks worked well over schedule with the cost of the extra hours. | runs |
| `schedule_explain` | Show one employee from schedule_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `schedule_write_report` | Write schedule-vs-actual.csv (one row per item, with blank owner and decision columns) and schedule-vs-actual.html into out_dir (default fairtable-out/schedule). | runs |
| `schedule_draft_memo` | Write drafts/memo-<week>.md: punches outside the schedule and hours over schedule for the managers who approve timecards. | asks first (Auto can be opted in) |
| `schedule_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `schedule_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `schedule_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `schedule_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `schedule_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `schedule_publish` | Never publishes or edits the staff schedule or timecards. | refused |
| `payroll_submit` | Never submits or changes payroll, wages or tip payouts; your payroll person does. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Schedule (`schedule`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee` (required) | text | Employee, Employee Name, Team Member, Name, Staff | Mitarbeiter, Employé, 社員名, 员工 |
| `role` | text | Role, Job Title, Position, Job, Department | Rolle, Rôle, ロール, 角色 |
| `location` | text | Location, Store, Restaurant, Unit | Lagerort, Emplacement, 保管場所, 库位 |
| `start` | date and time | Shift Start, Start, Scheduled Start, Start Time, From | Schichtbeginn, Début de service, シフト開始, 班次开始 |
| `end` | date and time | Shift End, End, Scheduled End, End Time, To | Schichtende, Fin de service, シフト終了, 班次结束 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| 7shifts | Schedule export (one row per shift) | Employee, Role, Shift Start, Shift End | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Timecards (`timecards`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee` (required) | text | Employee, Employee Name, Team Member, Name, Staff, Staff Name | Mitarbeiter, Employé, 社員名, 员工 |
| `employee_id` | text | Employee Id, Employee ID, Employee Number, Emp #, Payroll ID, Staff ID | Personalnummer, Matricule, 社員番号, 员工编号 |
| `role` | text | Job Title, Role, Job, Position, Department, Job Code | Rolle, Rôle, ロール, 角色 |
| `location` | text | Location, Store, Restaurant, Unit | Lagerort, Emplacement, 保管場所, 库位 |
| `clock_in` | date and time | In Date, Clock In, Clock in, Clock-in, Start, Time In | Kommen, Arrivée, 出勤時刻, 上班时间 |
| `clock_out` | date and time | Out Date, Clock Out, Clock out, Clock-out, End, Time Out | Gehen, Départ, 退勤時刻, 下班时间 |
| `hours` | number | Payable Hours, Total Hours, Total hours, Hours, Total Paid Hours, Paid Hours | Stunden, Heures, 労働時間, 工时 |
| `break_minutes` | number | Break Minutes, Break length, Unpaid Break Minutes, Break (min), Break | Pause (Min.), Pause (min), 休憩（分）, 休息（分钟） |
| `rate` | amount | Wage, Wage rate, Hourly Rate, Rate, Pay Rate | Stundenlohn, Taux horaire, 時給, 时薪 |
| `cash_tips` | amount | Cash Tips Declared, Declared Cash Tips, Cash tips, Cash Tips | Bar-Trinkgeld, Pourboires en espèces, 現金チップ, 现金小费 |
| `card_tips` | amount | Non Cash Tips, Credit tips, Card Tips, Transaction Tips, Credit Card Tips, Charged Tips | Karten-Trinkgeld, Pourboires par carte, カードチップ, 刷卡小费 |
| `age` | number | Age, Employee Age | Alter, Âge, 年齢, 年龄 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Toast | TimeEntries export (one row per clock-in) | Employee, Job Title, In Date, Out Date, Payable Hours | no |
| Square | Team > Timecards export (CSV) | Clock In Date, Clock In Time, Clock Out Date, Clock Out Time | no |
| 7shifts | Worked hours and wages export | Employee, Role, Clock In, Clock Out, Total Hours | no |
| Homebase | Timesheets export | Employee, Clock in, Clock out, Break length | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-schedule-vs-actual inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-schedule-vs-actual can remember facts about your setup so the next run does not have to be told again. `schedule_learn` only proposes a fact; it changes nothing until a named person accepts it with `schedule_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-schedule-vs-actual memory list
fairtable-schedule-vs-actual memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-schedule-vs-actual memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-schedule-vs-actual demo
npx -y fairtable-schedule-vs-actual mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-schedule-vs-actual": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-schedule-vs-actual",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-schedule-vs-actual -- npx -y fairtable-schedule-vs-actual mcp --root .`, or install the `fairtable-schedule-vs-actual` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-schedule-vs-actual approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-schedule-vs-actual approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-schedule-vs-actual kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-schedule-vs-actual tools                 # every tool, its policy and arguments
fairtable-schedule-vs-actual sources               # the columns each input is read from
fairtable-schedule-vs-actual inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-schedule-vs-actual call schedule_check '{"schedule":"<schedule>","timecards":"<timecards>"}'
fairtable-schedule-vs-actual eval                  # the private eval cases on the fictional fixtures
fairtable-schedule-vs-actual demo
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
