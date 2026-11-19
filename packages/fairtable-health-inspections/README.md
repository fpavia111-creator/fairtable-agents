# fairtable-health-inspections

The health inspection and permit calendar for each location: re-inspections overdue, critical violations with no re-inspection on file, scores dropping, the next routine visit to prepare for, and permits and licences expired or expiring. Never contacts the health department.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; a person on your team decides and acts on every finding.

## What it needs

Exports you already have, as files on your computer (CSV, Excel, JSON; see "Columns it reads" below):

- `inspections` (required): Inspection history (typed from the reports): location, date, type, score, critical and total violations, re-inspection due date
- `permits`: Optional permits and licences: location, permit, number, expiry date
- `settings` (optional): a JSON file with your own targets and rules; see "Settings" below.

## What it checks

For each location: the latest inspection, any re-inspection due and not on file, critical violations not followed by a later inspection, score drops and the estimated next routine visit; for each permit: expired, expiring soon or no expiry date.

| Finding | Example from the fictional demo data |
|---|---|
| `critical_open` | Main Street: 2 critical violation(s) at the 2026-08-18 inspection with no later inspection on file to show they were corrected. |
| `no_expiry` | Airport Kiosk: Fire inspection certificate has no expiry date on file. |
| `permit_expired` | Main Street: Liquor licence LL-2001 expired on 2026-11-01, 14 days ago. |
| `permit_expiring` | Harbor Road: Liquor licence LL-2002 expires 2026-12-20, in 35 days. |
| `reinspection_overdue` | Main Street: a re-inspection was due 2026-09-01 after the 2026-08-18 inspection and none is on file. |
| `routine_due` | Airport Kiosk: last routine inspection 2026-06-05; at about every 180 days the next could come around 2026-12-02. Walk the kitchen with the inspection form before then. |
| `score_drop` | Main Street: score fell from 94 to 86. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the calendar is checked for (default: today) |
| `routine_interval_days` | `180` | Typical days between routine inspections in your area (default 180; a planning estimate, not a schedule the health department publishes) |
| `routine_warn_days` | `45` | Watch when the estimated next routine visit is this close (default 45) |
| `permit_warn_days` | `60` | Watch permits expiring within this many days (default 60) |
| `score_drop_points` | `5` | A drop of this many points between inspections is reviewed (default 5) |
| `followup_score` | `null` | Report critical violations as still open only when that inspection scored this or worse, the score that brings a re-inspection where you are (New York City re-inspects from 14 points); empty reports every critical violation with no later inspection (default empty) |
| `lower_score_is_better` | `false` | True where the score counts violation points, so a lower score is better (New York City, for example); then a rise of score_drop_points is reviewed (default false) |
| `routine_words` | `["routine","initial inspection"]` | An inspection whose type contains one of these words is a routine one, unless it is a re-inspection (default routine, initial inspection; New York City writes Cycle Inspection / Initial Inspection, Chicago Canvass) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-health-inspections demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Health Inspections demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  3 location(s), 6 permit(s) at 2026-11-15: 2 need action now, 4 coming up. 1 to review.
    flag    Main Street | Liquor licence        permit_expired
    flag    Main Street | inspections           reinspection_overdue, critical_open, score_drop
    review  Airport Kiosk | Fire inspection ce  no_expiry
    watch   Airport Kiosk | inspections         routine_due
    watch   Harbor Road | Liquor licence        permit_expiring
    watch   Harbor Road | inspections           routine_due
    watch   Main Street | Food service permit   permit_expiring

▶ Explain Main Street | inspections
  status: executed  decision: allow
  Main Street | inspections: flag. Main Street: a re-inspection was due 2026-09-01 after the 2026-08-18 inspection and none is on file. Main Street: 2 critical violation(s) at the 2026-08-18 inspection with no later inspection on file to show they were corrected. Main Street: score fell from 94 to 86.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Health inspection calendar written: 3 location(s), 6 permit(s) at 2026-11-15: 2 need action now, 4 coming up. 1 to review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo Main Street drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `inspections_check` | For each location: the latest inspection, any re-inspection due and not on file, critical violations not followed by a later inspection, score drops and the estimated next routine visit; for each permit: expired, expi… | runs |
| `inspections_explain` | Show one location line (e.g. | runs |
| `inspections_write_report` | Write health-inspections.csv (one row per item, with blank owner and decision columns) and health-inspections.html into out_dir (default fairtable-out/inspections). | runs |
| `inspections_draft_memo` | Write drafts/memo-<location>.md: what to do before the next inspection at one location (open violations, re-inspection to request, permits to renew). | asks first (Auto can be opted in) |
| `inspections_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `inspections_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `inspections_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `inspections_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `inspections_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |
| `agency_portal_submit` | Never submits anything to a health department or licensing portal. | refused |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Inspection history (`inspections`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `location` (required) | text | Location, Store, Restaurant, Establishment | Lagerort, Emplacement, 保管場所, 库位 |
| `date` | date | Date, Inspection Date, Visit Date | Datum, Date, 日付, 日期 |
| `type` | text | Type, Inspection Type, Visit Type | Typ, Type, 種類, 类型 |
| `score` | number | Score, Points, Result | - |
| `critical_violations` | number | Critical Violations, Critical, Priority Violations, Red Items | - |
| `violations` | number | Violations, Total Violations, Items | - |
| `reinspection_due` | date | Reinspection Due, Re-inspection Due, Follow-up Due, Correct By | - |

### Permits and licences (`permits`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `location` | text | Location, Store, Restaurant | Lagerort, Emplacement, 保管場所, 库位 |
| `permit` (required) | text | Permit, Licence, License, Certificate, Name | - |
| `number` | text | Number, Permit Number, Licence Number, License Number | - |
| `expires` | date | Expires, Expiry, Expiration Date, Valid Until | Ablaufdatum, Date d'expiration, 有効期限, 到期日 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-health-inspections inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-health-inspections can remember facts about your setup so the next run does not have to be told again. `inspections_learn` only proposes a fact; it changes nothing until a named person accepts it with `inspections_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-health-inspections memory list
fairtable-health-inspections memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-health-inspections memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-health-inspections demo
npx -y fairtable-health-inspections mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-health-inspections": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-health-inspections",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-health-inspections -- npx -y fairtable-health-inspections mcp --root .`, or install the `fairtable-health-inspections` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-health-inspections approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-health-inspections approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-health-inspections kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-health-inspections tools                 # every tool, its policy and arguments
fairtable-health-inspections sources               # the columns each input is read from
fairtable-health-inspections inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-health-inspections call inspections_check '{"inspections":"<inspections>"}'
fairtable-health-inspections eval                  # the private eval cases on the fictional fixtures
fairtable-health-inspections demo
```

## Audit log and data

Every call is written to `.fairtable/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a POS, scheduling, payroll, delivery-app, reservation, distributor, utility or bank system, and changes nothing in them.
- Targets, thresholds and state rules are settings in your own file, with working defaults; check them against your own policies, contracts and local rules before you rely on them.
- Not legal, tax, payroll, health-code, food-safety or accounting advice. A person decides what to pay, refund, change, file or send.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairtable-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
