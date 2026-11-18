# fairtable-voids-comps

Voids and comps by employee from your POS export, against each server's sales: self-approved voids, voids after the check was paid, missing reasons and comps over the approval limit. Names are masked for the AI model. Never changes the POS.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Add up each employee's voids and comps, put them against their sales, and flag self-approved voids, voids after the check closed, a void-and-comp rate over the threshold, voids with no reason, items over the approval limit with no approver and whole checks voided.

| Finding | Example from the fictional demo data |
|---|---|
| `after_close` | A.S.#653cdb voided after the check was paid: check 1003 at 21:30, closed 2026-11-06T21:15. A void after payment can hide cash taken from a paid check. |
| `full_check_void` | S.P.#fa5954: whole check(s) voided: 1008 (148, walkout). |
| `high_void_rate` | A.S.#653cdb: voids and comps of 121 are 4.2% of their sales of 2850. |
| `no_approver` | J.O.#49bc44: 1 void(s) or comp(s) over 20 with no manager approval (check 1006). |
| `no_reason` | A.S.#653cdb: 2 void(s) with no reason. |
| `self_approved` | A.S.#653cdb approved 2 of their own void(s) on check(s) 1002, 1003. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `flag_rate_pct` | `3` | Flag voids + comps at this % of an employee's sales (default 3) |
| `watch_rate_pct` | `1.5` | Watch from this % (default 1.5) |
| `approval_limit` | `20` | Voids or comps above this amount need a manager approval (default 20) |
| `full_check_pct` | `90` | A void of at least this % of a check counts as a whole-check void (default 90) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-voids-comps demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Voids Comps demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  6 void(s) worth 276.00 and 2 comp(s) worth 45.00 across 4 employee(s). 2 employee(s) flagged, 1 need review.
    flag    A.S.#653cdb                         self_approved, after_close, high_void_rate, no_reason
    flag    S.P.#fa5954                         high_void_rate, full_check_void
    review  J.O.#49bc44                         no_approver

▶ Explain Avery Stone
  status: executed  decision: allow
  A.S.#653cdb: flag. A.S.#653cdb approved 2 of their own void(s) on check(s) 1002, 1003. A.S.#653cdb voided after the check was paid: check 1003 at 21:30, closed 2026-11-06T21:15. A void after payment can hide cash taken from a paid check. A.S.#653cdb: voids and comps of 121 are 4.2% of their sales of 2850. A.S.#653cdb: 2 void(s) with no reason.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Voids and comps by employee written: 6 void(s) worth 276.00 and 2 comp(s) worth 45.00 across 4 employee(s). 2 employee(s) flagged, 1 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  review memo Main Street drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  review memo Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `voids_check` | Add up each employee's voids and comps, put them against their sales, and flag self-approved voids, voids after the check closed, a void-and-comp rate over the threshold, voids with no reason, items over the approval … | runs |
| `voids_explain` | Show one employee from voids_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `voids_write_report` | Write cranberry-voids.csv (one row per item, with blank owner and decision columns) and cranberry-voids.html into out_dir (default fairtable-out/voids). | runs |
| `voids_draft_review_memo` | Write drafts/review_memo-<location>.md: the employees and checks to review with the floor manager, with what each finding means. | asks first (Auto can be opted in) |
| `voids_request_send` | After one named human click (even in Auto), record that the reviewed review memo draft is approved in review_memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `voids_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `voids_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `voids_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `voids_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `payroll_submit` | Never submits or changes payroll, wages or tip payouts; your payroll person does. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### POS voids and comps (`checks`)

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

### Sales by employee (`server_sales`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee` (required) | text | Server, Employee, Staff, Team Member, Name | Mitarbeiter, Employé, 社員名, 员工 |
| `location` | text | Location, Store, Restaurant | Lagerort, Emplacement, 保管場所, 库位 |
| `net_sales` | amount | Net Sales, Sales, Net Amount, Total Sales | Nettoumsatz, Ventes nettes, 純売上, 净销售额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-voids-comps inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-voids-comps can remember facts about your setup so the next run does not have to be told again. `voids_learn` only proposes a fact; it changes nothing until a named person accepts it with `voids_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-voids-comps memory list
fairtable-voids-comps memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-voids-comps memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-voids-comps demo
npx -y fairtable-voids-comps mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-voids-comps": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-voids-comps",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-voids-comps -- npx -y fairtable-voids-comps mcp --root .`, or install the `fairtable-voids-comps` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-voids-comps approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-voids-comps approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-voids-comps kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-voids-comps tools                 # every tool, its policy and arguments
fairtable-voids-comps sources               # the columns each input is read from
fairtable-voids-comps inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-voids-comps call voids_check '{"checks":"<checks>"}'
fairtable-voids-comps eval                  # the private eval cases on the fictional fixtures
fairtable-voids-comps demo
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
