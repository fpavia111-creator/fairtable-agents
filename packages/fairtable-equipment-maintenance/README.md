# fairtable-equipment-maintenance

The maintenance schedule for hoods, grease traps, fire suppression, ice machines, refrigeration and the rest: what is overdue, what is due in the next weeks, what has no service date, and equipment repaired again and again. Never books a vendor.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Work out each piece of equipment's next due date from its last service (on the list or in the service log) and its interval (on the list, else the default for its type in the settings); flag overdue items, watch items due soon and repeated repairs, and list items with no date or no interval.

| Finding | Example from the fictional demo data |
|---|---|
| `due_soon` | Fire extinguishers: due 2026-11-20, in 5 days. |
| `no_interval` | Dish machine: no service interval on the list and no default for "Dish machine" in the settings. |
| `no_last_service` | Reach-in freezer (Refrigeration) has no service date on record. |
| `overdue` | Ansul system: last serviced 2026-05-02, every 180 days, due 2026-10-29: 17 days overdue. |
| `repeat_repairs` | Walk-in cooler was repaired 3 times in 120 days for 1315; compare with the cost of replacing it. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the schedule is checked for (default: today) |
| `due_soon_days` | `30` | Watch items due within this many days (default 30) |
| `repeat_repairs` | `3` | Repairs within the window that count as repeated (default 3) |
| `repair_window_days` | `120` | Window for counting repairs (default 120) |
| `default_intervals` | `{}` | Service interval in days by equipment type, from your fire marshal, local code, insurer or manufacturer, e.g. {"Hood cleaning": 90} |

<!-- generated:start -->

## A demo run

`npx -y fairtable-equipment-maintenance demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Equipment Maintenance demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 item(s) at 2026-11-15: 2 overdue, 3 due soon. 2 need a date or an interval.
    flag    Ansul system                        overdue
    flag    Kitchen hood                        overdue
    review  Dish machine                        no_interval
    review  Reach-in freezer                    no_last_service
    watch   Fire extinguishers                  due_soon
    watch   Grease trap                         due_soon
    watch   Ice machine                         due_soon
    watch   Walk-in cooler                      repeat_repairs

▶ Explain Kitchen hood
  status: executed  decision: allow
  Kitchen hood: flag. Kitchen hood: last serviced 2026-07-20, every 90 days, due 2026-10-18: 28 days overdue.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Equipment maintenance schedule written: 8 item(s) at 2026-11-15: 2 overdue, 3 due soon. 2 need a date or an interval.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  service request Example Fire Protection drafted with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  service request Example-Fire-Protection approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payment_send itself
  status: blocked  decision: block
  reason: Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `equipment_check` | Work out each piece of equipment's next due date from its last service (on the list or in the service log) and its interval (on the list, else the default for its type in the settings); flag overdue items, watch items… | runs |
| `equipment_explain` | Show one piece of equipment from equipment_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `equipment_write_report` | Write olive-equipment.csv (one row per item, with blank owner and decision columns) and olive-equipment.html into out_dir (default fairtable-out/equipment). | runs |
| `equipment_draft_service_request` | Write drafts/service_request-<vendor>.md: the equipment that vendor services that is overdue or due soon, asking for dates. | asks first (Auto can be opted in) |
| `equipment_request_send` | After one named human click (even in Auto), record that the reviewed service request draft is approved in service_request-requests.csv. | one named click, even in Auto (`binding_send`) |
| `equipment_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `equipment_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `equipment_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `equipment_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |
| `vendor_booking_submit` | Never books a vendor visit or signs a work order. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Equipment list (`equipment`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `equipment` (required) | text | Equipment, Asset, Name, Item | - |
| `type` | text | Type, Service Type, Category, Asset Type | Typ, Type, 種類, 类型 |
| `location` | text | Location, Store, Restaurant | Lagerort, Emplacement, 保管場所, 库位 |
| `last_service` | date | Last Service, Last Serviced, Last Cleaned, Last Inspection, Service Date | - |
| `interval_days` | number | Interval Days, Interval, Every (days), Frequency Days | - |
| `vendor` | text | Vendor, Service Company, Contractor, Provider | Lieferant, Fournisseur, 仕入先, 供应商 |

### Service log (`service_log`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `equipment` (required) | text | Equipment, Asset, Item | - |
| `date` | date | Date, Service Date, Visit Date | Datum, Date, 日付, 日期 |
| `vendor` | text | Vendor, Technician, Company | Lieferant, Fournisseur, 仕入先, 供应商 |
| `kind` | text | Kind, Type, Work Type, Visit Type | - |
| `cost` | amount | Cost, Amount, Invoice Total | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-equipment-maintenance inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-equipment-maintenance can remember facts about your setup so the next run does not have to be told again. `equipment_learn` only proposes a fact; it changes nothing until a named person accepts it with `equipment_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-equipment-maintenance memory list
fairtable-equipment-maintenance memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-equipment-maintenance memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-equipment-maintenance demo
npx -y fairtable-equipment-maintenance mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-equipment-maintenance": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-equipment-maintenance",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-equipment-maintenance -- npx -y fairtable-equipment-maintenance mcp --root .`, or install the `fairtable-equipment-maintenance` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-equipment-maintenance approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-equipment-maintenance approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-equipment-maintenance kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-equipment-maintenance tools                 # every tool, its policy and arguments
fairtable-equipment-maintenance sources               # the columns each input is read from
fairtable-equipment-maintenance inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-equipment-maintenance call equipment_check '{"equipment":"<equipment>"}'
fairtable-equipment-maintenance eval                  # the private eval cases on the fictional fixtures
fairtable-equipment-maintenance demo
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
