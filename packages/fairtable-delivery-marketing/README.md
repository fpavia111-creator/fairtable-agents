# fairtable-delivery-marketing

Delivery-app marketing and promotion charges against the campaigns you opted into: charges with no campaign behind them, campaigns over budget, and what each campaign brought in for what it cost. Never logs in to a platform.

Part of **Fairtable**, the restaurant, bar and cafe agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Attribute each marketing fee and promotion charge to an opted-in campaign on the same platform and dates; add up spend and the sales of the orders it touched. Flags charges outside any campaign, campaigns not opted into, spend over budget, low return and a high marketing share of sales.

| Finding | Example from the fictional demo data |
|---|---|
| `fee_outside_campaign` | DoorDash charged 3 in ad fees on 1 order(s) (DD-2006) on dates no opted-in campaign covers (2026-11-09). |
| `marketing_share_high` | DoorDash: marketing and promotions are 11.2% of its sales (33 of 295), over the 10% target. |
| `not_opted_in` | Uber Eats charged 12 for "Buy one get one wings", which the campaign list says was not opted into. |
| `over_budget` | "Sponsored listing Nov wk1" cost 15 against a budget of 12. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `min_return` | `4` | Watch a campaign with less than this in order sales per 1 spent (default 4) |
| `target_share_pct` | `10` | Watch a platform whose marketing and promotions exceed this % of its sales (default 10) |
| `tolerance` | `0.05` | Amount over budget that is ignored (default 0.05) |

<!-- generated:start -->

## A demo run

`npx -y fairtable-delivery-marketing demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairtable Delivery Marketing demo (fictional restaurant data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  47.50 of marketing and promotions on 3 platform(s) and 4 listed campaign(s); 15.00 with no opted-in campaign behind it. 3 flagged.
    flag    (no campaign) DoorDash ad fees      fee_outside_campaign
    flag    Buy one get one wings               not_opted_in
    flag    Sponsored listing Nov wk1           over_budget
    watch   DoorDash marketing share            marketing_share_high
    watch   Uber Eats marketing share           marketing_share_high

▶ Explain Sponsored listing Nov wk1
  status: executed  decision: allow
  Sponsored listing Nov wk1: flag. "Sponsored listing Nov wk1" cost 15 against a budget of 12.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Delivery app marketing fees written: 47.50 of marketing and promotions on 3 platform(s) and 4 listed campaign(s); 15.00 with no opted-in campaign behind it. 3 flagged.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  dispute Uber Eats drafted for 12 with 3 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [ATTACH]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  dispute Uber-Eats approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries delivery_platform_submit itself
  status: blocked  decision: block
  reason: Never logs in to or submits anything on a delivery-app or reservation portal.

Audit log: <demo folder>/.fairtable/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `marketing_check` | Attribute each marketing fee and promotion charge to an opted-in campaign on the same platform and dates; add up spend and the sales of the orders it touched. | runs |
| `marketing_explain` | Show one campaign from marketing_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `marketing_write_report` | Write delivery-marketing.csv (one row per item, with blank owner and decision columns) and delivery-marketing.html into out_dir (default fairtable-out/marketing). | runs |
| `marketing_draft_dispute` | Write drafts/dispute-<platform>.md: marketing charges with no opted-in campaign and spend over budget, for a person to raise in the platform's merchant portal. | asks first (Auto can be opted in) |
| `marketing_request_send` | After one named human click (even in Auto), record that the reviewed dispute draft is approved in dispute-requests.csv. | one named click, even in Auto (`binding_send`) |
| `marketing_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `marketing_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `marketing_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `marketing_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `delivery_platform_submit` | Never logs in to or submits anything on a delivery-app or reservation portal. | refused |
| `payment_send` | Never pays a vendor, employee or platform; your bookkeeper or AP pays the approved amount. | refused |
| `email_send` | Never sends email or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Delivery-app statements (`statements`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `order_id` (required) | text | DoorDash order ID, Order ID, order_number, Order Number, Order #, External Order ID | Bestellnummer, N° de commande, 注文番号, 订单号 |
| `platform` | text | Platform, Channel, Marketplace, Source, Provider | Plattform, Plateforme, プラットフォーム, 平台 |
| `date` | date | Order Date, Date, transaction_date, Timestamp local date, Order Placed | Datum, Date, 日付, 日期 |
| `location` | text | Store name, Restaurant, Store, Location, restaurant | Lagerort, Emplacement, 保管場所, 库位 |
| `type` | text | Transaction type, Type, transaction_type, Order Status | Typ, Type, 種類, 类型 |
| `subtotal` | amount | Subtotal, Sales (excl. tax), subtotal, Food Sales, Order Subtotal | Zwischensumme, Sous-total, 小計, 小计 |
| `tax` | amount | Subtotal tax passed to merchant, Tax on sales, tax, Tax, Sales Tax | Steuer, TVA, 税額, 税额 |
| `commission` | amount | Commission, Marketplace fee, commission, Service Fee, Delivery commission, delivery_commission | Provision, Commission, 手数料, 佣金 |
| `processing_fee` | amount | Payment processing fee, Processing fee, processing_fee, Card fee | Zahlungsgebühr, Frais de paiement, 決済手数料, 支付手续费 |
| `marketing_fee` | amount | Marketing fees, Marketing fee, Ad spend, Ads, Sponsored listing | Marketinggebühr, Frais marketing, 広告費, 推广费 |
| `promo_funded` | amount | Customer discounts from marketing (funded by you), Promotions on items, Marketing adjustment, targeted_promotion, Promotion funded by restaurant, Merchant-funded discount | Aktionsrabatt (selbst getragen), Promotion à votre charge, 店舗負担の割引, 商家承担优惠 |
| `refund` | amount | Error charges, Refunds, Refund, Order error adjustments, Customer refunds, refund | Erstattung, Remboursement, 返金, 退款 |
| `adjustment` | amount | Adjustments, Adjustment, Other payments, Misc adjustment | Korrektur, Ajustement, 調整額, 调整 |
| `payout` | amount | Net total, Total payout, merchant_net_total, Net payout, Payout | Auszahlung, Versement, 入金額, 结算金额 |
| `payout_id` | text | Payout ID, Payout id, Transfer ID, deposit_id | Auszahlungs-ID, ID du versement, 入金ID, 结算单号 |
| `payout_date` | date | Payout date, Payout Date, Deposit date, deposit_date | Auszahlungsdatum, Date du versement, 入金日, 结算日期 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| DoorDash Merchant Portal | Financials > Transactions export | DoorDash order ID, Subtotal, Commission, Net total | no |
| Uber Eats Manager | Payment details report | Order ID, Sales (excl. tax), Marketplace fee, Total payout | no |
| Grubhub for Restaurants | Transactions export | order_number, subtotal, commission, merchant_net_total | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Campaign list (`campaigns`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `platform` (required) | text | Platform, Channel, Marketplace | Plattform, Plateforme, プラットフォーム, 平台 |
| `campaign` (required) | text | Campaign, Campaign Name, Promotion, Name | - |
| `type` | text | Type, Campaign Type, Kind | Typ, Type, 種類, 类型 |
| `start` | date | Start, Start Date, From | Schichtbeginn, Début de service, シフト開始, 班次开始 |
| `end` | date | End, End Date, To | Schichtende, Fin de service, シフト終了, 班次结束 |
| `budget` | amount | Budget, Max Spend, Weekly Budget, Cap | - |
| `opted_in` | yes/no | Opted In, Opt In, Approved, Active | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairtable-delivery-marketing inspect <file>` (names and shapes only, never values) and name them in `fairtable-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairtable-delivery-marketing can remember facts about your setup so the next run does not have to be told again. `marketing_learn` only proposes a fact; it changes nothing until a named person accepts it with `marketing_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairtable/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `item_alias` | reads that campaign name as the listed campaign |
| `note` | nothing (shown by recall only) |

```bash
fairtable-delivery-marketing memory list
fairtable-delivery-marketing memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairtable-delivery-marketing memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairtable-delivery-marketing demo
npx -y fairtable-delivery-marketing mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairtable-delivery-marketing": {
      "command": "npx",
      "args": [
        "-y",
        "fairtable-delivery-marketing",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairtable-delivery-marketing -- npx -y fairtable-delivery-marketing mcp --root .`, or install the `fairtable-delivery-marketing` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairtable-delivery-marketing approve <id> --as "Your Name"` (or on the local approvals page, `fairtable-delivery-marketing approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairtable-delivery-marketing kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairtable-delivery-marketing tools                 # every tool, its policy and arguments
fairtable-delivery-marketing sources               # the columns each input is read from
fairtable-delivery-marketing inspect <file>        # how a file would be read (names and shapes, never values)
fairtable-delivery-marketing call marketing_check '{"statements":"<statements>","campaigns":"<campaigns>"}'
fairtable-delivery-marketing eval                  # the private eval cases on the fictional fixtures
fairtable-delivery-marketing demo
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
