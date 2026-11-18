# grape-of-overtime

Weekly and daily overtime, double time, split shifts, spread of hours and short turnarounds (clopens) from your timecards, priced at each person's rate, under the overtime rules in your settings. Never edits timecards or runs payroll.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Per employee and workweek: hours, daily and weekly overtime and double time without counting an hour twice, the premium cost, and shifts that may carry a split-shift or spread-of-hours premium under the settings. Also flags clopens, very long shifts and shifts with no clock-out.

| Finding | Example from the fictional demo data |
|---|---|
| `clopen` | R.C.#dab90c clocked out at 2026-11-05 01:00 and back in at 2026-11-05 07:00: 6 hours of rest. |
| `missing_clock_out` | R.C.#dab90c has a shift from 2026-11-06 16:00 with no clock-out; its hours are not counted. |
| `overtime_high` | J.L.#864547, week of 2026-11-02: 48 hours, 8 weekly and 0 daily overtime hours; premium 72 at 18 an hour. |
| `split_shift` | C.M.#efdf8a worked a split shift on 2026-11-03: 07:00-11:00 and 16:00-21:00 (5 h unpaid between). A split-shift premium of one hour (15.5) may be owed under the settings. |
| `spread_of_hours` | C.M.#efdf8a had 1 day(s) spread over more than 10 hours from first in to last out: 2026-11-03 (14 h). A spread-of-hours premium of one hour (15.5) a day may be owed under the settings. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `rules` | `"not set"` | Name of the rule set, shown in the report |
| `weekly_ot_after` | `40` | Weekly overtime after this many hours (default 40) |
| `daily_ot_after` | `null` | Daily overtime after this many hours (null when your state has none) |
| `daily_dt_after` | `null` | Double time after this many hours in a day (null when none) |
| `ot_multiplier` | `1.5` | Overtime multiplier (default 1.5) |
| `split_gap_hours` | `1` | An unpaid gap longer than this between two shifts on a day is a split shift (default 1) |
| `spread_hours` | `null` | Flag a day whose first-in to last-out spread is longer than this (null to skip) |
| `premium_hourly` | `null` | Hourly amount used for a one-hour split-shift or spread-of-hours premium (null to show without an amount) |
| `clopen_rest_hours` | `10` | Rest between a closing and an opening shift shorter than this is a clopen (default 10) |
| `flag_ot_hours` | `5` | Flag a week with at least this many overtime hours (default 5) |
| `long_shift_hours` | `12` | Watch a single shift longer than this (default 12) |

<!-- generated:start -->

## A demo run

`npx -y grape-of-overtime demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Grape of Overtime demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  4 employee-week(s): 8 overtime hour(s), premium 72.00, 1 split shift(s) (rules: Example rules: weekly overtime after 40, split shift and spread of hours premiums (fictional settings; check your own state)). 1 flagged, 3 need review.
    flag    J.L.#864547                         overtime_high
    review  C.M.#efdf8a                         split_shift, spread_of_hours
    review  R.C.#dab90c                         clopen, missing_clock_out
    review  S.P.#fa5954                         spread_of_hours

▶ Explain Casey Morgan
  status: executed  decision: allow
  C.M.#efdf8a (2026-11-02): review. C.M.#efdf8a worked a split shift on 2026-11-03: 07:00-11:00 and 16:00-21:00 (5 h unpaid between). A split-shift premium of one hour (15.5) may be owed under the settings. C.M.#efdf8a had 1 day(s) spread over more than 10 hours from first in to last out: 2026-11-03 (14 h). A spread-of-hours premium of one hour (15.5) a day may be owed under the settings.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Overtime and split shifts written: 4 employee-week(s): 8 overtime hour(s), premium 72.00, 1 split shift(s) (rules: Example rules: weekly overtime after 40, split shift and spread of hours premiums (fictional settings; check your own state)). 1 flagged, 3 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Week of 2026-11-02 drafted for 72 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Week-of-2026-11-02 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payroll_submit itself
  status: blocked  decision: block
  reason: Never submits or changes payroll, wages or tip payouts; your payroll person does.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `grape_check` | Per employee and workweek: hours, daily and weekly overtime and double time without counting an hour twice, the premium cost, and shifts that may carry a split-shift or spread-of-hours premium under the settings. | runs |
| `grape_explain` | Show one employee from grape_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `grape_write_report` | Write grape-overtime.csv (one row per item, with blank owner and decision columns) and grape-overtime.html into out_dir (default fairtable-out/grape). | runs |
| `grape_draft_memo` | Write drafts/memo-<week>.md: overtime and premiums for the scheduler and payroll, with the shifts behind them. | asks first (Auto can be opted in) |
| `grape_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `grape_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `grape_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `grape_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `grape_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payroll_submit` | Never submits or changes payroll, wages or tip payouts; your payroll person does. | refused |
| `schedule_publish` | Never publishes or edits the staff schedule or timecards. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx grape-of-overtime inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

grape-of-overtime can remember facts about your setup so the next run does not have to be told again. `grape_learn` only proposes a fact; it changes nothing until a named person accepts it with `grape_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
grape-of-overtime memory list
grape-of-overtime memory accept MEM-1a2b3c4d5e6f --as "Your Name"
grape-of-overtime memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y grape-of-overtime demo
npx -y grape-of-overtime mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "grape-of-overtime": {
      "command": "npx",
      "args": [
        "-y",
        "grape-of-overtime",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add grape-of-overtime -- npx -y grape-of-overtime mcp --root .`, or install the `grape-of-overtime` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `grape-of-overtime approve <id> --as "Your Name"` (or on the local approvals page, `grape-of-overtime approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`grape-of-overtime kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
grape-of-overtime tools                 # every tool, its policy and arguments
grape-of-overtime sources               # the columns each input is read from
grape-of-overtime inspect <file>        # how a file would be read (names and shapes, never values)
grape-of-overtime call grape_check '{"timecards":"<timecards>"}'
grape-of-overtime eval                  # the private eval cases on the fictional fixtures
grape-of-overtime demo
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
