# fairtable-gift-cards

The outstanding gift card liability from your POS gift card export, by location, with balances that do not add up, negative balances, dormant cards and cards bought at one location and spent at another. Never changes a card or recognises breakage.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Add up the balance still owed on every card, by the location that sold it; check each card's issued - redeemed = balance; flag negative and mismatched balances and list large, dormant and cross-location cards for the accountant.

| Finding | Example from the fictional demo data |
|---|---|
| `balance_math` | GC-1006: issued 150 - redeemed 30 = 120, but the balance shows 100. |
| `cross_location` | GC-1004 was sold at Harbor Road and used at Main Street; the two locations settle 80 between them if they keep separate books. |
| `dormant` | GC-1003: 75 with no activity since 2024-06-20 (28 months). Unclaimed-property and breakage rules differ by state; ask your accountant before treating it as income. |
| `large_balance` | GC-1007 holds 500; check a large card was paid for before it is honoured. |
| `negative_balance` | GC-1005 has a negative balance of -15: it was redeemed for more than it held. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the liability is measured at (default: today) |
| `dormancy_months` | `24` | Months with no activity before a card counts as dormant (default 24; check your state) |
| `large_balance` | `250` | Review cards holding at least this much (default 250) |
| `tolerance` | `0.01` | Rounding allowed in the balance check (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-gift-cards demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Gift Cards demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 card(s) at 2026-11-15: liability 875.00 on 6 open card(s), of which 125.00 is dormant. 2 flagged, 1 need review.
    flag    GC-1005                             negative_balance
    flag    GC-1006                             balance_math
    review  GC-1007                             large_balance
    watch   GC-1003                             dormant
    watch   GC-1004                             cross_location
    watch   GC-1008                             dormant

▶ Explain GC-1005
  status: executed  decision: allow
  GC-1005: flag. GC-1005 has a negative balance of -15: it was redeemed for more than it held.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Gift card liability written: 8 card(s) at 2026-11-15: liability 875.00 on 6 open card(s), of which 125.00 is dormant. 2 flagged, 1 need review.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  memo gift-cards-2026-11-15 drafted for 875 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM with the accountant]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  memo gift-cards-2026-11-15 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries pos_change_menu itself
  status: blocked  decision: block
  reason: Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `gift_cards_check` | Add up the balance still owed on every card, by the location that sold it; check each card's issued - redeemed = balance; flag negative and mismatched balances and list large, dormant and cross-location cards for the … | runs |
| `gift_cards_explain` | Show one gift card from gift_cards_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `gift_cards_write_report` | Write kumquat-gift-cards.csv (one row per item, with blank owner and decision columns) and kumquat-gift-cards.html into out_dir (default fairtable-out/gift_cards). | runs |
| `gift_cards_draft_memo` | Write drafts/memo-<as of date>.md: the gift card liability by location and the cards to look at, for the accountant. | asks first (Auto can be opted in) |
| `gift_cards_request_send` | After one named human click (even in Auto), record that the reviewed memo draft is approved in memo-requests.csv. | one named click, even in Auto (`binding_send`) |
| `gift_cards_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `gift_cards_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `gift_cards_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `gift_cards_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `pos_change_menu` | Never changes menu items, prices, 86 status or settings in the POS; a manager does that in the POS. | refused |
| `ledger_post` | Never posts journal entries or changes the books. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Gift cards (`cards`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `card` (required) | text | Card, Card Number, Gift Card, Card ID, GAN | - |
| `holder` | text | Holder, Customer, Purchaser, Name, Recipient | Inhaber, Titulaire, 名義人, 持有人 |
| `issued_date` | date | Issued Date, Activation Date, Sold Date, Purchase Date, Issued | - |
| `issued_location` | text | Issued Location, Sold At, Activation Location, Location | - |
| `issued_amount` | amount | Issued Amount, Initial Value, Load Amount, Amount Loaded | - |
| `redeemed` | amount | Redeemed, Amount Redeemed, Total Redeemed, Spent | - |
| `balance` | amount | Balance, Current Balance, Remaining Balance, Outstanding | Saldo, Solde, 残高, 余额 |
| `last_activity` | date | Last Activity, Last Used, Last Transaction, Last Redemption | Letzte Aktivität, Dernière activité, 最終アクティビティ, 最后活动时间 |
| `last_location` | text | Last Location, Last Used At, Redeemed At | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-gift-cards inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-gift-cards can remember facts about your setup so the next run does not have to be told again. `gift_cards_learn` only proposes a fact; it changes nothing until a named person accepts it with `gift_cards_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairtable-gift-cards memory list
fairtable-gift-cards memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-gift-cards memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-gift-cards demo
npx -y fairtable-gift-cards mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-gift-cards": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-gift-cards",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-gift-cards -- npx -y fairtable-gift-cards mcp --root .`, or install the `fairtable-gift-cards` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-gift-cards approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-gift-cards approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-gift-cards kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-gift-cards tools                 # every tool, its policy and arguments
fairtable-gift-cards sources               # the columns each input is read from
fairtable-gift-cards inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-gift-cards call gift_cards_check '{"cards":"<cards>"}'
fairtable-gift-cards eval                  # the private eval cases on the fictional fixtures
fairtable-gift-cards demo
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
