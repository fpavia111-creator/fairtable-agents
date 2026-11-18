# fairtable-meal-breaks

Meal breaks from your timecards under the break rules in your settings: shifts over the limit with no or a short meal break, meals taken late, second meals on long days, the premium pay that may be owed, and minors working too long or too late. Never edits timecards or runs payroll.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each shift: the meal break against the rules in the settings (after how many hours, how long, by which hour, a second meal on long days) with the premium they would mean, and for employees under 18 the hours and the latest clock-out allowed for their age band.

| Finding | Example from the fictional demo data |
|---|---|
| `late_meal` | C.M.#efdf8a: meal started 6.25 hours into the shift on 2026-11-03, after the 5th hour. |
| `minor_late_shift` | S.P.#fa5954 (age 17) clocked out at 22:45 on 2026-11-05; the settings say 22:30 for under 18. |
| `minor_over_hours` | T.B.#5235bb (age 15) worked 6 hours on 2026-11-06; the settings allow 3 for under 16. |
| `missed_meal_break` | J.L.#864547 worked 8.5 hours on 2026-11-04 with no meal break recorded (rules: a 30-minute meal after 5 hours). Premium under the settings: 18. |
| `missed_second_meal` | R.C.#dab90c: 12.5 hours on 2026-11-04 with 30 minutes of meal breaks; a second meal is due after 10 hours under the settings. |
| `short_meal_break` | S.P.#fa5954: 20-minute meal break on 2026-11-05, shorter than 30. Premium under the settings: 16.5. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `rules` | `"not set"` | Name of the rule set, shown in the report |
| `meal_after_hours` | `5` | A meal break is due on shifts longer than this (default 5) |
| `meal_minutes` | `30` | Minimum meal break in minutes (default 30) |
| `meal_start_by_hours` | `5` | The meal must start by this hour of the shift (default 5) |
| `second_meal_after_hours` | `10` | A second meal is due on shifts longer than this (null for none) |
| `premium_hours` | `1` | Hours of pay shown as the premium for a missed, short or late meal (0 to show none) |
| `minimum_wage` | `0` | Used for the premium when the rate is lower (tipped staff) |
| `minor_max_daily_hours` | `{"under_16":3,"under_18":8}` | Most hours a day by age band: under_16, under_18 |
| `minor_latest_end` | `{"under_16":"19:00","under_18":"22:30"}` | Latest clock-out (HH:MM) by age band: under_16, under_18 |

<!-- generated:start -->

## A demo run

`npx -y fairtable-meal-breaks demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Meal Breaks demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  7 shift(s): 3 with a missed or short meal, 2 with a minor's hours issue; premiums shown under the settings 51.00 (rules: Example break rules (fictional settings modelled on a strict state; check your own)). 4 flagged.
    flag    J.L.#864547                         missed_meal_break
    flag    R.C.#dab90c                         missed_second_meal
    flag    S.P.#fa5954                         short_meal_break, minor_late_shift
    flag    T.B.#5235bb                         minor_over_hours, minor_late_shift
    review  C.M.#efdf8a                         late_meal

▶ Explain Taylor Brooks
  status: executed  decision: allow
  T.B.#5235bb (2026-11-06T16:00): flag. T.B.#5235bb (age 15) worked 6 hours on 2026-11-06; the settings allow 3 for under 16. T.B.#5235bb (age 15) clocked out at 22:30 on 2026-11-06; the settings say 21:00 for under 16.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Meal and rest breaks written: 7 shift(s): 3 with a missed or short meal, 2 with a minor's hours issue; premiums shown under the settings 51.00 (rules: Example break rules (fictional settings modelled on a strict state; check your own)). 4 flagged.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Week of 2026-11-02 drafted for 51 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

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
| `breaks_check` | For each shift: the meal break against the rules in the settings (after how many hours, how long, by which hour, a second meal on long days) with the premium they would mean, and for employees under 18 the hours and t… | runs |
| `breaks_explain` | Show one employee from breaks_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `breaks_write_report` | Write raspberry-breaks.csv (one row per item, with blank owner and decision columns) and raspberry-breaks.html into out_dir (default fairtable-out/breaks). | runs |
| `breaks_draft_memo` | Write drafts/memo-<week>.md: shifts with break or minor-hours issues and the premiums shown under the settings, for payroll and the scheduler. | asks first (Auto can be opted in) |
| `breaks_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `breaks_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `breaks_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `breaks_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `breaks_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
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
| `break_start` | date and time | Break Start, Meal Start, Break In, Lunch Start | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Toast | TimeEntries export (one row per clock-in) | Employee, Job Title, In Date, Out Date, Payable Hours | no |
| Square | Team > Timecards export (CSV) | Clock In Date, Clock In Time, Clock Out Date, Clock Out Time | no |
| 7shifts | Worked hours and wages export | Employee, Role, Clock In, Clock Out, Total Hours | no |
| Homebase | Timesheets export | Employee, Clock in, Clock out, Break length | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-meal-breaks inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-meal-breaks can remember facts about your setup so the next run does not have to be told again. `breaks_learn` only proposes a fact; it changes nothing until a named person accepts it with `breaks_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-meal-breaks memory list
fairtable-meal-breaks memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-meal-breaks memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-meal-breaks demo
npx -y fairtable-meal-breaks mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-meal-breaks": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-meal-breaks",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-meal-breaks -- npx -y fairtable-meal-breaks mcp --root .`, or install the `fairtable-meal-breaks` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-meal-breaks approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-meal-breaks approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-meal-breaks kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-meal-breaks tools                 # every tool, its policy and arguments
fairtable-meal-breaks sources               # the columns each input is read from
fairtable-meal-breaks inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-meal-breaks call breaks_check '{"timecards":"<timecards>"}'
fairtable-meal-breaks eval                  # the private eval cases on the fictional fixtures
fairtable-meal-breaks demo
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
