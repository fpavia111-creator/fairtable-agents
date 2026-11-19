# fairtable-tip-pooling

Splits the week's tip pool by hours and role points, checks the tip credit (cash wage plus tips against the minimum wage in your state settings), managers who kept tips, cash wages under the tipped minimum and missing cash tip declarations. Never runs payroll or pays tips.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `timecards` (required): Timecards or time entries (Toast, Square, 7shifts or Homebase export): employee, role, clock in, hours, hourly rate, declared cash tips, card tips
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

For each workweek: the pool (card tips of pool roles plus any tips a manager collected), each member's share by hours x role points, and the effective hourly pay (wages + share + cash tips) against the minimum wage in the settings. Flags tip credit shortfalls with the makeup amount, managers with tips, cash wages under the tipped minimum and tip credits where the state allows none.

| Finding | Example from the fictional demo data |
|---|---|
| `below_cash_wage` | T.B.#5235bb is paid 2 an hour, under the 2.13 tipped cash wage in the settings. |
| `manager_kept_tips` | M.B.#0f7e61 is a Manager and has 140 of tips on their own timecard in the week of 2026-11-02. Tips a manager or supervisor collects go into the pool; they were added to it here. |
| `no_cash_declared` | A.S.#653cdb has card tips and no cash tips declared in the week of 2026-11-09. |
| `tip_credit_shortfall` | A.S.#653cdb, week of 2026-11-09: wages 21.3 + pool share 23.33 + cash tips 0 over 10 hours is 4.46 an hour, under the 7.25 minimum. Makeup 27.9. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `state` | `"not set"` | Name of the state or the rule set, shown in the report |
| `full_min_wage` | `7.25` | Full minimum hourly wage for your location (default 7.25, the US federal figure; check your state and city) |
| `tipped_cash_wage` | `2.13` | Lowest cash wage for tipped staff when a tip credit is taken (default 2.13, the US federal figure) |
| `tip_credit_allowed` | `true` | Whether your state allows a tip credit at all |
| `pool_roles` | `["Server","Bartender","Busser","Runner","Host"]` | Roles that share the pool |
| `excluded_roles` | `["Manager","General Manager","Owner","Supervisor"]` | Roles that may not keep tips (managers, supervisors, owners) |
| `role_points` | `{}` | Points per role for the split, e.g. {"Busser": 0.6}; 1 when not listed |
| `include_cash_in_pool` | `false` | Whether declared cash tips go into the pool (default false) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-tip-pooling demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Tip Pooling demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  2 week(s), 8 employee-week(s): tip pool 1,360.00, makeup owed under the settings 90.75 (rules: Example state with a tip credit (fictional settings; check your own state)). 4 flagged, 0 need review.
    flag    A.S.#653cdb                         tip_credit_shortfall, no_cash_declared
    flag    C.M.#42aa91                         tip_credit_shortfall, no_cash_declared
    flag    M.B.#0f7e61                         manager_kept_tips
    flag    T.B.#5235bb                         below_cash_wage, tip_credit_shortfall
    watch   J.O.#49bc44                         no_cash_declared

▶ Explain Casey Moreno
  status: executed  decision: allow
  C.M.#42aa91 (2026-11-09): flag. C.M.#42aa91, week of 2026-11-09: wages 42.6 + pool share 46.67 + cash tips 0 over 20 hours is 4.46 an hour, under the 7.25 minimum. Makeup 55.8. C.M.#42aa91 has card tips and no cash tips declared in the week of 2026-11-09.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Tip pool and tip credit written: 2 week(s), 8 employee-week(s): tip pool 1,360.00, makeup owed under the settings 90.75 (rules: Example state with a tip credit (fictional settings; check your own state)). 4 flagged, 0 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  payroll memo Week of 2026-11-02 drafted for 90.75 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  payroll memo Week-of-2026-11-02 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payroll_submit itself
  status: blocked  decision: block
  reason: Never submits or changes payroll, wages or tip payouts; your payroll person does.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `tips_check` | For each workweek: the pool (card tips of pool roles plus any tips a manager collected), each member's share by hours x role points, and the effective hourly pay (wages + share + cash tips) against the minimum wage in… | runs |
| `tips_explain` | Show one employee from tips_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `tips_write_report` | Write tip-pooling.csv (one row per item, with blank owner and decision columns) and tip-pooling.html into out_dir (default fairtable-out/tips). | runs |
| `tips_draft_payroll_memo` | Write drafts/payroll_memo-<week>.md: pool shares and makeup amounts for the payroll person to check and enter. | asks first (Auto can be opted in) |
| `tips_request_send` | After one named human click (even in Auto), record that the reviewed payroll memo draft is approved in payroll_memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `tips_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `tips_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `tips_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `tips_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payroll_submit` | Never submits or changes payroll, wages or tip payouts; your payroll person does. | refused |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-tip-pooling inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-tip-pooling can remember facts about your setup so the next run does not have to be told again. `tips_learn` only proposes a fact; it changes nothing until a named person accepts it with `tips_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-tip-pooling memory list
fairtable-tip-pooling memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-tip-pooling memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-tip-pooling demo
npx -y fairtable-tip-pooling mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-tip-pooling": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-tip-pooling",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-tip-pooling -- npx -y fairtable-tip-pooling mcp --root .`, or install the `fairtable-tip-pooling` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-tip-pooling approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-tip-pooling approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-tip-pooling kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-tip-pooling tools                 # every tool, its policy and arguments
fairtable-tip-pooling sources               # the columns each input is read from
fairtable-tip-pooling inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-tip-pooling call tips_check '{"timecards":"<timecards>"}'
fairtable-tip-pooling eval                  # the private eval cases on the fictional fixtures
fairtable-tip-pooling demo
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
