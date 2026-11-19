# fairtable-discounts-promos

Checks every discount and promotion rung in the POS against your promotion list: promos used after they ended, unknown or open discounts, discounts over their cap, employee meals over the allowance and missing approvals. Never changes the POS.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `discounts` (required): POS discount export: check, date, time, employee, approver, discount name, amount, check total
- `promos` (required): Your promotion list: name, start, end, max %, max amount, needs approval, employee only, daily allowance, days, hours
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

Group the POS discounts by name and check each use against the promotion list: dates, days, hours, the % and amount cap, approval and the employee meal allowance. Flags anything outside the rules and lists discounts the list does not know.

| Finding | Example from the fictional demo data |
|---|---|
| `employee_meal_over` | "Employee Meal 50%": 1 employee-day(s) over the 15 daily allowance. |
| `expired_promo` | "Summer Patio 20%" runs 2026-06-01 to 2026-09-30 but was used 1 time(s) outside those dates (check 2004). |
| `no_approver` | "Open Dollar Discount" needs a manager approval; 1 use(s) had none (check 2005). |
| `outside_hours` | "Happy Hour Half Off Apps" is for Mon-Fri 15:00-18:00 but was rung Tue 19:30 (check 2002). |
| `over_cap` | "Fall Prix Fixe" went over its cap on 1 check(s): 2010 by 15.6. |
| `unknown_discount` | "Industry Night 15%" is not on the promotion list: 1 use(s), 9. Add it to the list or remove the button. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `tolerance` | `0.5` | Amount over a cap that is ignored (default 0.50) |
| `open_words` | `["open","custom","manual"]` | Words that mark an open (free-amount) discount |

<!-- generated:start -->

## A demo run

`npx -y fairtable-discounts-promos demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Discounts Promos demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  10 discount(s) worth 180.00 under 7 name(s); 1 name(s) not on the promotion list. 5 flagged, 1 need review.
    flag    Employee Meal 50%                   employee_meal_over
    flag    Fall Prix Fixe                      over_cap
    flag    Happy Hour Half Off Apps            outside_hours
    flag    Open Dollar Discount                over_cap, no_approver
    flag    Summer Patio 20%                    expired_promo
    review  Industry Night 15%                  unknown_discount

▶ Explain Fall Prix Fixe
  status: executed  decision: allow
  Fall Prix Fixe: flag. "Fall Prix Fixe" went over its cap on 1 check(s): 2010 by 15.6.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Discounts and promotions written: 10 discount(s) worth 180.00 under 7 name(s); 1 name(s) not on the promotion list. 5 flagged, 1 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street drafted for 180 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `discounts_check` | Group the POS discounts by name and check each use against the promotion list: dates, days, hours, the % and amount cap, approval and the employee meal allowance. | runs |
| `discounts_explain` | Show one discount from discounts_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `discounts_write_report` | Write discounts-promos.csv (one row per item, with blank owner and decision columns) and discounts-promos.html into out_dir (default fairtable-out/discounts). | runs |
| `discounts_draft_memo` | Write drafts/memo-<location>.md: the discount rules that were broken, the buttons to remove or restrict, for the floor team. | asks first (Auto can be opted in) |
| `discounts_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `discounts_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `discounts_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `discounts_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `discounts_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `refund_issue` | Never issues a refund or a credit to a guest or a card. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### POS discounts (`discounts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `check` (required) | text | Check #, Check Number, Check, Ticket, Order #, Order Number | Bonnummer, N° de ticket, 伝票番号, 账单号 |
| `date` | date | Business Date, Date, Void Date, Order Date | Datum, Date, 日付, 日期 |
| `time` | text | Time, Void Time, Event Time, Timestamp | Uhrzeit, Heure, 時刻, 时间 |
| `employee` | text | Server, Employee, User, Void User, Staff, Team Member | Mitarbeiter, Employé, 社員名, 员工 |
| `approver` | text | Approver, Manager, Approved By, Void Approver, Authorized By | Genehmigt durch, Approuvé par, 承認者, 审批人 |
| `type` | text | Type, Action, Event Type, Adjustment Type | Typ, Type, 種類, 类型 |
| `item` | text | Item, Menu Item, Item Name, Discount Name, Promo | Artikel, Article, 品目, 物料 |
| `amount` | amount | Amount, Void Amount, Comp Amount, Discount Amount, Value | Betrag, Montant, 金額, 金额 |
| `reason` | text | Reason, Void Reason, Comp Reason, Note, Comment | Grund, Motif, 理由, 原因 |
| `location` | text | Location, Store, Restaurant, Unit | Lagerort, Emplacement, 保管場所, 库位 |
| `check_total` | amount | Check Total, Order Total, Check Amount, Subtotal | Bonsumme, Total du ticket, 伝票合計, 账单金额 |
| `closed_at` | date and time | Closed, Closed At, Paid, Paid Date, Check Closed | Abgeschlossen um, Clôturé le, 会計時刻, 结账时间 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Toast | Void and discount details export (one row per check line) | Check #, Server, Reason, Approver | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Promotion list (`promos`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `name` (required) | text | Name, Promotion, Discount, Promo Name, Discount Name | Name, Nom, 名前, 名称 |
| `start` | date | Start, Start Date, Valid From, From | Schichtbeginn, Début de service, シフト開始, 班次开始 |
| `end` | date | End, End Date, Valid To, To | Schichtende, Fin de service, シフト終了, 班次结束 |
| `max_pct` | number | Max %, Max Pct, Percent, Discount % | - |
| `max_amount` | amount | Max Amount, Cap, Limit, Max $ | - |
| `needs_approval` | yes/no | Needs Approval, Manager Approval, Approval Required | - |
| `employee_only` | yes/no | Employee Only, Staff Only, Employee Meal | - |
| `daily_allowance` | amount | Daily Allowance, Allowance, Per Day Limit | - |
| `days` | text | Days, Valid Days, Day of Week | Tage, Jours, 日数, 天数 |
| `hours` | text | Hours, Time Window, Valid Hours | Stunden, Heures, 労働時間, 工时 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-discounts-promos inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-discounts-promos can remember facts about your setup so the next run does not have to be told again. `discounts_learn` only proposes a fact; it changes nothing until a named person accepts it with `discounts_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that POS discount name as the promotion, so its rules apply |
| `note` | nothing (shown by recall only) |

```bash
fairtable-discounts-promos memory list
fairtable-discounts-promos memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-discounts-promos memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-discounts-promos demo
npx -y fairtable-discounts-promos mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-discounts-promos": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-discounts-promos",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-discounts-promos -- npx -y fairtable-discounts-promos mcp --root .`, or install the `fairtable-discounts-promos` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-discounts-promos approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-discounts-promos approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-discounts-promos kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-discounts-promos tools                 # every tool, its policy and arguments
fairtable-discounts-promos sources               # the columns each input is read from
fairtable-discounts-promos inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-discounts-promos call discounts_check '{"discounts":"<discounts>","promos":"<promos>"}'
fairtable-discounts-promos eval                  # the private eval cases on the fictional fixtures
fairtable-discounts-promos demo
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
