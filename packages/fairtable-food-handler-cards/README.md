# fairtable-food-handler-cards

Food handler cards, certified food protection managers and alcohol server certificates against your staff roster: missing after the grace period, expired, expiring soon, and locations without a certified manager. Staff names are masked for the AI model. Never contacts staff or a training provider.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Match every active employee with their certificates; flag missing cards after the grace period for new hires, expired cards and certificates and locations with no current certified food protection manager; watch certificates expiring soon and list alcohol servers with no certificate.

| Finding | Example from the fictional demo data |
|---|---|
| `alcohol_cert_missing` | J.O.#49bc44 works as Server with no alcohol server certificate on file. |
| `expired` | M.B.#0f7e61: food protection manager certificate FPM-202 expired on 2026-05-01. |
| `expiring_soon` | S.P.#fa5954: food protection manager certificate FPM-201 expires 2026-12-01, in 16 days. |
| `in_grace_period` | R.C.#dab90c started 2026-11-05; a food handler card is due within 30 days (by 2026-12-05). |
| `missing_card` | C.M.#efdf8a (Prep Cook, Main Street) has no food handler card on file after 45 days. |
| `no_certified_manager` | Harbor Road has no one on the active roster with a current food protection manager certificate. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date checked (default: today) |
| `grace_days` | `30` | Days a new hire has to get a food handler card (default 30; check your state and county) |
| `warn_days` | `45` | Watch certificates expiring within this many days (default 45) |
| `food_handler_types` | `["Food handler"]` | Certificate names that count as a food handler card |
| `manager_cert_types` | `["Food protection manager"]` | Certificate names that count as a certified food protection manager |
| `alcohol_cert_types` | `["Alcohol server"]` | Certificate names that count as alcohol server training |
| `alcohol_roles` | `["Bartender"]` | Roles that serve alcohol |
| `manager_per_location` | `true` | Flag a location with no current certified manager (default true) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-food-handler-cards demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Food Handler Cards demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 active staff at 2 location(s), as of 2026-11-15: 4 need action now. 2 coming up, 1 to review.
    flag    C.M.#efdf8a                         missing_card
    flag    Harbor Road (location)              no_certified_manager
    flag    M.B.#0f7e61                         expired
    flag    S.P.#fa5954                         expired, expiring_soon
    review  J.O.#49bc44                         alcohol_cert_missing
    watch   R.C.#dab90c                         in_grace_period
    watch   T.B.#5235bb                         expiring_soon

▶ Explain Sam Patel
  status: executed  decision: allow
  S.P.#fa5954: flag. S.P.#fa5954: food handler card FH-1002 expired on 2026-06-20. S.P.#fa5954: food protection manager certificate FPM-201 expires 2026-12-01, in 16 days.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Food handler cards written: 8 active staff at 2 location(s), as of 2026-11-15: 4 need action now. 2 coming up, 1 to review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  reminder list Main Street drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  reminder list Main-Street approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `food_handlers_check` | Match every active employee with their certificates; flag missing cards after the grace period for new hires, expired cards and certificates and locations with no current certified food protection manager; watch certi… | runs |
| `food_handlers_explain` | Show one employee from food_handlers_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `food_handlers_write_report` | Write food-handler-cards.csv (one row per item, with blank owner and decision columns) and food-handler-cards.html into out_dir (default fairtable-out/food_handlers). | runs |
| `food_handlers_draft_reminder_list` | Write drafts/reminder_list-<location>.md: who needs a card or a renewal and by when, for the manager to hand out. | asks first (Auto can be opted in) |
| `food_handlers_request_send` | After one named human click (even in Auto), record that the reviewed reminder list draft is approved in reminder_list-requests.csv. | one named click, even in Auto (`binding_send`) |
| `food_handlers_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `food_handlers_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `food_handlers_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `food_handlers_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |
| `payroll_submit` | Never submits or changes payroll, wages or tip payouts; your payroll person does. | refused |
| `training_enroll` | Never enrolls or pays for anyone's training. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Staff roster (`roster`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee` (required) | text | Employee, Name, Team Member, Staff | Mitarbeiter, Employé, 社員名, 员工 |
| `role` | text | Role, Job Title, Position, Job | Rolle, Rôle, ロール, 角色 |
| `location` | text | Location, Store, Restaurant | Lagerort, Emplacement, 保管場所, 库位 |
| `hire_date` | date | Hire Date, Start Date, Hired | - |
| `status` | text | Status, Employment Status, Active | Status, Statut, ステータス, 状态 |

### Certificates (`certificates`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee` (required) | text | Employee, Name, Holder, Team Member | Mitarbeiter, Employé, 社員名, 员工 |
| `cert_type` | text | Cert Type, Certificate, Type, Course, Card Type | - |
| `number` | text | Number, Certificate Number, Card Number, ID | - |
| `issued` | date | Issued, Issue Date, Completed | - |
| `expires` | date | Expires, Expiry, Expiration Date, Valid Until | Ablaufdatum, Date d'expiration, 有効期限, 到期日 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-food-handler-cards inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-food-handler-cards can remember facts about your setup so the next run does not have to be told again. `food_handlers_learn` only proposes a fact; it changes nothing until a named person accepts it with `food_handlers_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-food-handler-cards memory list
fairtable-food-handler-cards memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-food-handler-cards memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-food-handler-cards demo
npx -y fairtable-food-handler-cards mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-food-handler-cards": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-food-handler-cards",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-food-handler-cards -- npx -y fairtable-food-handler-cards mcp --root .`, or install the `fairtable-food-handler-cards` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-food-handler-cards approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-food-handler-cards approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-food-handler-cards kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-food-handler-cards tools                 # every tool, its policy and arguments
fairtable-food-handler-cards sources               # the columns each input is read from
fairtable-food-handler-cards inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-food-handler-cards call food_handlers_check '{"roster":"<roster>","certificates":"<certificates>"}'
fairtable-food-handler-cards eval                  # the private eval cases on the fictional fixtures
fairtable-food-handler-cards demo
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
