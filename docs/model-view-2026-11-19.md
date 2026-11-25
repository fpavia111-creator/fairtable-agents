# What reaches the AI model (2026-11-19)

Made by `node scripts/model-view.mjs`: each check is run on its fictional fixtures and every fixture value is looked for in the JSON result the assistant's model receives. Masked columns are replaced by tokens such as `A.R.#3f9a2c`, `phone#…`, `email#…`, `card#…`, `cert#…` or `id#…` (the same value always gives the same token, so the model can still group by it; the report and draft files on your machine keep the real values). Everything else in the result is sent in clear: amounts, quantities, dates, rates, finding codes and the text columns listed. Free-text columns (reasons, notes, item and vendor names) are sent as typed: if a person writes a guest's name into a void reason, the model sees it.

The result goes to whatever model the user's assistant uses. For staff wage and schedule data, use a model covered by your own agreements or a local model. No compliance claim is made.

| Agent | Masked | Text sent in clear | Free text among them |
|---|---|---|---|
| fairtable-allergen-matrix | - | allergens, free_from, ingredient, item, recipe | ingredient, item, recipe |
| fairtable-card-fees | - | fee_name, fee_type, location, month | - |
| fairtable-cash-drawers | employee | drawer | - |
| fairtable-catering-deposits | client | event_id, location, method, status, type | - |
| fairtable-delivery-marketing | - | campaign, order_id, platform, type | campaign |
| fairtable-delivery-payouts | - | order_id, platform, type | - |
| fairtable-discounts-promos | approver, employee | days, hours, item, name, time, type | item, name |
| fairtable-duplicate-invoices | - | gl_account, invoice_number, item, vendor | item, vendor |
| fairtable-equipment-maintenance | - | equipment, kind, location, type, vendor | vendor |
| fairtable-food-cost | - | ingredient, invoice_number, item, recipe, unit | ingredient, item, recipe |
| fairtable-food-handler-cards | employee, number (cert#…) | cert_type, location, role, status | - |
| fairtable-stored-value | card (card#…), holder | issued_location, last_location | - |
| fairtable-health-inspections | - | location, number, permit | - |
| fairtable-inventory-counts | - | area, item, location, unit | item |
| fairtable-labor-dayparts | employee, employee_id (id#…) | - | - |
| fairtable-location-comparison | - | location | - |
| fairtable-meal-breaks | employee, employee_id (id#…) | - | - |
| fairtable-menu-engineering | - | category, item | item |
| fairtable-no-shows | email, guest, phone | source | - |
| fairtable-overtime | employee, employee_id (id#…) | role | - |
| fairtable-pour-cost | - | ingredient, item, recipe, unit | ingredient, item, recipe |
| fairtable-price-creep | - | item, pack, vendor | item, vendor |
| fairtable-prime-cost | - | location | - |
| fairtable-receiving-credits | received_by | credit_number, invoice_number, item, note, vendor | item, note, vendor |
| fairtable-recipe-costs | - | category, ingredient, item, pack, recipe, unit | ingredient, item, recipe |
| fairtable-sales-tax | - | category, channel, location | - |
| fairtable-schedule-vs-actual | employee, employee_id (id#…) | role | - |
| fairtable-stockouts | - | back_at, item, out_at, reason | item, reason |
| fairtable-tip-pooling | employee, employee_id (id#…) | role | - |
| fairtable-utility-bills | - | account, location, read_type, unit, utility | - |
| fairtable-voids-comps | approver, employee | reason, time, type | reason |
| fairtable-waste-log | employee | item, reason, unit | item, reason |
