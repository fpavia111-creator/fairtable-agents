# fairtable-labor-dayparts

Labor percentage and sales per labor hour for each daypart (breakfast, lunch, dinner, late night) from your POS sales and timecards, against the targets you set for each one. Never edits the schedule.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Spread each timecard over the dayparts it covers in 15-minute steps, price it at the rate plus labor burden, put it against the sales rung in the same daypart and flag dayparts over their labor target, low sales per labor hour, labor with no sales and sales with no time.

| Finding | Example from the fictional demo data |
|---|---|
| `labor_no_sales` | 2026-11-03 Breakfast: 5 labor hours (94.6) and no sales. Prep and opening time is real, but check it is planned. |
| `labor_over_target` | 2026-11-03 Afternoon: labor 146.59 on sales 60 is 244.3%, over the 30% target for Afternoon. |
| `low_splh` | 2026-11-03 Afternoon: 6 in sales per labor hour, under 60. |
| `sales_no_time` | 1 sale row(s) worth 300 have no time, so they are in the day's total but in no daypart. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `dayparts` | `[{"name":"Breakfast","start":"06:00","end":"11:00","target_labor_pct":30},{"name":"Lunch","start":"11:00","end":"16:00","target_labor_pct":25},{"name":"Dinner","start":"16:00","end":"22:00","target_labor_pct":22},{"name":"Late night","start":"22:00","end":"03:00","target_labor_pct":25}]` | Dayparts with start and end times (HH:MM) and a labor % target each |
| `flag_points` | `3` | Flag a daypart this many points over its target (default 3) |
| `min_sales_per_labor_hour` | `60` | Watch a daypart under this many sales per labor hour (default 60) |
| `labor_burden_pct` | `0` | Payroll taxes and benefits added to wages, % (default 0) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-labor-dayparts demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Labor Dayparts demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  5 daypart slot(s): sales 5,510.00, labor 685.63 (12.4%) over 48 hours. 1 flagged, 2 need review.
    flag    2026-11-03 Afternoon                labor_over_target, low_splh
    review  2026-11-03 Breakfast                labor_no_sales
    review  Sales with no time                  sales_no_time

▶ Explain 2026-11-03 Afternoon
  status: executed  decision: allow
  2026-11-03 Afternoon: flag. 2026-11-03 Afternoon: labor 146.59 on sales 60 is 244.3%, over the 30% target for Afternoon. 2026-11-03 Afternoon: 6 in sales per labor hour, under 60.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Labor percentage by daypart written: 5 daypart slot(s): sales 5,510.00, labor 685.63 (12.4%) over 48 hours. 1 flagged, 2 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries schedule_publish itself
  status: blocked  decision: block
  reason: Never publishes or edits the staff schedule or timecards.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `dayparts_check` | Spread each timecard over the dayparts it covers in 15-minute steps, price it at the rate plus labor burden, put it against the sales rung in the same daypart and flag dayparts over their labor target, low sales per l… | runs |
| `dayparts_explain` | Show one day and daypart (e.g. | runs |
| `dayparts_write_report` | Write labor-dayparts.csv (one row per item, with blank owner and decision columns) and labor-dayparts.html into out_dir (default fairtable-out/dayparts). | runs |
| `dayparts_draft_memo` | Write drafts/memo-<location>.md: the dayparts over target with their labor %, for the person who writes the schedule. | asks first (Auto can be opted in) |
| `dayparts_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `dayparts_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `dayparts_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `dayparts_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `dayparts_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `schedule_publish` | Never publishes or edits the staff schedule or timecards. | refused |
| `payroll_submit` | Never submits or changes payroll, wages or tip payouts; your payroll person does. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### POS sales with time (`sales`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `item` (required) | text | Menu Item, Item, Item Name, Product, Product Name, Menu Item Name | Artikel, Article, 品目, 物料 |
| `date` | date | Order Date, Business Date, Date, Sale Date, Sent Date | Datum, Date, 日付, 日期 |
| `location` | text | Location, Store, Restaurant, Store Name, Site, Unit | Lagerort, Emplacement, 保管場所, 库位 |
| `category` | text | Sales Category, Category, Menu Group, Item Category, Reporting Category, Major Group | Kategorie, Catégorie, 経費科目, 费用类别 |
| `qty` | number | Qty, Quantity, Qty Sold, Quantity Sold, Items Sold, Count | Menge, Quantité, 数量, 数量 |
| `net_sales` | amount | Net Sales, Net Price, Net Amount, Item Revenue, Net Revenue, Sales | Nettoumsatz, Ventes nettes, 純売上, 净销售额 |
| `gross_sales` | amount | Gross Sales, Gross Price, Gross Amount, Total incl. tax | Bruttoumsatz, Ventes brutes, 総売上, 总销售额 |
| `discount` | amount | Discount, Discounts, Discount Amount, Promo Amount | Rabatt, Remise, 値引, 折扣 |
| `order_id` | text | Order Id, Order ID, Transaction ID, Check Id, Ticket, Order Number | Bestellnummer, N° de commande, 注文番号, 订单号 |
| `time` | text | Time, Order Time, Sent Time, Opened | Uhrzeit, Heure, 時刻, 时间 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Toast | ItemSelectionDetails export (one row per item sold) | Item Selection Id, Menu Item, Qty, Net Price | no |
| Square | Items > Item Sales export (CSV) | Item, Qty, Gross Sales, Net Sales, Transaction ID | no |
| Clover | Reports > Sales > Items export | Item Name, Items Sold, Item Revenue | no |
| Lightspeed Restaurant | Product sales report export | Product, Quantity, Total incl. tax | no |
| Revel Systems | Product Mix report export | Product Name, Quantity Sold, Net Sales | no |

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-labor-dayparts inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-labor-dayparts can remember facts about your setup so the next run does not have to be told again. `dayparts_learn` only proposes a fact; it changes nothing until a named person accepts it with `dayparts_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-labor-dayparts memory list
fairtable-labor-dayparts memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-labor-dayparts memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-labor-dayparts demo
npx -y fairtable-labor-dayparts mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-labor-dayparts": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-labor-dayparts",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-labor-dayparts -- npx -y fairtable-labor-dayparts mcp --root .`, or install the `fairtable-labor-dayparts` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-labor-dayparts approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-labor-dayparts approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-labor-dayparts kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-labor-dayparts tools                 # every tool, its policy and arguments
fairtable-labor-dayparts sources               # the columns each input is read from
fairtable-labor-dayparts inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-labor-dayparts call dayparts_check '{"sales":"<sales>","timecards":"<timecards>"}'
fairtable-labor-dayparts eval                  # the private eval cases on the fictional fixtures
fairtable-labor-dayparts demo
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
