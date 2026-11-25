// What each agent's fictional fixtures plant on purpose, how the clean set is made from them,
// and the one-field mutation cases. Used by scripts/accuracy.mjs.
//
// planted:   { 'item key' | 'item key @ sub': [finding codes] } — everything the fixture notes
//            (fixtures/README.md) say the demo data contains. Any other finding on the demo data
//            is counted as unplanned.
// clean:     edits that remove each planted problem and nothing else, applied to the fixture CSVs
//            and written to fixtures/clean/. The clean set must give zero findings.
//              ['set', file, where, values]   change matching rows
//              ['drop', file, where]          remove matching rows
//              ['dropLast', file, where]      remove the last matching row (a duplicate)
//              ['add', file, row]             add a row
//            A value { replace: [pattern, text] } rewrites the old value with a regular expression.
// mutations: one edit (normally one field in one row) on the clean set, and the finding it must
//            raise: { id, op, expect: ['item key', 'code'] }.
// Item keys are the first field of each result item (masked names are matched by their token).

export const SPECS = {
  'fairtable-allergen-matrix': {
    planted: { 'Caesar Salad': ['undeclared_allergen'], 'Gluten-Free Pasta': ['undeclared_allergen', 'free_from_broken'], 'Fish Tacos': ['declared_not_found'], 'Fries Basket': ['ingredient_no_data'], 'Seasonal Soup': ['no_recipe'] },
    clean: [
      ['set', 'matrix.csv', { item: 'Caesar Salad' }, { allergens: 'wheat; milk; egg; fish' }],
      ['drop', 'recipes.csv', { recipe: 'Gluten-Free Pasta', ingredient: 'Panko Topping' }],
      ['set', 'matrix.csv', { item: 'Fish Tacos' }, { allergens: 'fish; milk' }],
      ['add', 'ingredients.csv', { ingredient: 'Fryer Oil', allergens: '' }],
      ['drop', 'matrix.csv', { item: 'Seasonal Soup' }],
    ],
    mutations: [
      { id: 'nut-in-crema', op: ['set', 'ingredients.csv', { ingredient: 'Lime Crema' }, { allergens: 'milk; tree nuts' }], expect: ['Fish Tacos', 'undeclared_allergen'] },
      { id: 'wheat-in-fries', op: ['set', 'ingredients.csv', { ingredient: 'Frozen Fries' }, { allergens: 'wheat' }], expect: ['Fries Basket', 'free_from_broken'] },
    ],
  },

  'fairtable-card-fees': {
    planted: { 'Main Street 2026-10': ['markup_over_contract', 'fee_over_cap', 'downgrade_surcharge', 'unexpected_fee', 'effective_rate_up'] },
    clean: [
      ['set', 'statements.csv', { month: '2026-10', location: 'Main Street', fee_name: 'Processor markup' }, { amount: '775.00' }],
      ['set', 'statements.csv', { month: '2026-10', location: 'Main Street', fee_name: 'Monthly service fee' }, { amount: '25.00' }],
      ['drop', 'statements.csv', { month: '2026-10', location: 'Main Street', fee_name: 'PCI non-compliance fee' }],
      ['drop', 'statements.csv', { month: '2026-10', location: 'Main Street', fee_name: 'Non-qualified surcharge' }],
    ],
    mutations: [
      { id: 'markup-up', op: ['set', 'statements.csv', { location: 'Harbor Road', fee_name: 'Processor markup' }, { amount: '450.00' }], expect: ['Harbor Road 2026-10', 'markup_over_contract'] },
      { id: 'monthly-fee-up', op: ['set', 'statements.csv', { location: 'Harbor Road', fee_name: 'Monthly service fee' }, { amount: '40.00' }], expect: ['Harbor Road 2026-10', 'fee_over_cap'] },
    ],
  },

  'fairtable-cash-drawers': {
    planted: {
      'Bar 1 2026-11-02': ['short', 'repeat_shorts'], 'Bar 1 2026-11-03': ['short', 'repeat_shorts'], 'Bar 1 2026-11-04': ['short', 'repeat_shorts'], 'Bar 1 2026-11-05': ['short', 'repeat_shorts'],
      'Front 1 2026-11-04': ['deposit_mismatch'], 'Front 1 2026-11-02': ['paid_out_no_receipt'], 'Front 1 2026-11-03': ['over'], 'Front 1 2026-11-05': ['missing_count'],
    },
    clean: [
      ['set', 'drawers.csv', { date: '2026-11-02', drawer: 'Bar 1' }, { counted: '1455.00', deposit: '1155.00' }],
      ['set', 'drawers.csv', { date: '2026-11-03', drawer: 'Bar 1' }, { counted: '1478.00', deposit: '1178.00' }],
      ['set', 'drawers.csv', { date: '2026-11-04', drawer: 'Bar 1' }, { counted: '1407.00', deposit: '1107.00' }],
      ['set', 'drawers.csv', { date: '2026-11-05', drawer: 'Bar 1' }, { counted: '1619.00', deposit: '1319.00' }],
      ['set', 'drawers.csv', { date: '2026-11-02', drawer: 'Front 1' }, { paid_out_receipts: '1' }],
      ['set', 'drawers.csv', { date: '2026-11-03', drawer: 'Front 1' }, { counted: '1110.00', deposit: '910.00' }],
      ['set', 'drawers.csv', { date: '2026-11-04', drawer: 'Front 1' }, { counted: '980.00', deposit: '780.00' }],
      ['set', 'drawers.csv', { date: '2026-11-05', drawer: 'Front 1' }, { counted: '1020.00', deposit: '820.00', next_bank: '200.00' }],
    ],
    mutations: [
      { id: 'front-short', op: ['set', 'drawers.csv', { date: '2026-11-03', drawer: 'Front 1' }, { counted: '1100.00' }], expect: ['Front 1 2026-11-03', 'short'] },
      { id: 'paid-out-no-receipt', op: ['set', 'drawers.csv', { date: '2026-11-03', drawer: 'Bar 1' }, { paid_out_receipts: '0' }], expect: ['Bar 1 2026-11-03', 'paid_out_no_receipt'] },
    ],
  },

  'fairtable-catering-deposits': {
    planted: { 'EV-302': ['deposit_missing'], 'EV-303': ['balance_overdue'], 'EV-305': ['cancelled_refund_due'], 'EV-306': ['overpaid'], 'EV-399': ['payment_no_event'] },
    clean: [
      ['set', 'payments.csv', { event_id: 'EV-302' }, { amount: '2880.00' }],
      ['add', 'payments.csv', { event_id: 'EV-303', date: '2026-11-11', amount: '2362.50', type: 'balance', method: 'card' }],
      ['drop', 'events.csv', { event_id: 'EV-305' }],
      ['drop', 'payments.csv', { event_id: 'EV-305' }],
      ['set', 'payments.csv', { event_id: 'EV-306', type: 'balance' }, { amount: '937.50' }],
      ['drop', 'payments.csv', { event_id: 'EV-399' }],
    ],
    mutations: [
      { id: 'deposit-short', op: ['set', 'payments.csv', { event_id: 'EV-304' }, { amount: '500.00' }], expect: ['EV-304', 'deposit_missing'] },
      { id: 'balance-short', op: ['set', 'payments.csv', { event_id: 'EV-301', type: 'balance' }, { amount: '1700.00' }], expect: ['EV-301', 'balance_overdue'] },
    ],
  },

  'fairtable-delivery-marketing': {
    planted: { '(no campaign) DoorDash ad fees': ['fee_outside_campaign'], 'Buy one get one wings': ['not_opted_in'], 'Sponsored listing Nov wk1': ['over_budget'], 'DoorDash marketing share': ['marketing_share_high'], 'Uber Eats marketing share': ['marketing_share_high'] },
    clean: [
      ['set', 'statements.csv', { order_id: 'DD-2005' }, { marketing_fee: '0.00', payout: '34.95' }],
      ['set', 'statements.csv', { order_id: 'DD-2006' }, { marketing_fee: '0.00', payout: '44.20' }],
      ['set', 'campaigns.csv', { campaign: 'Buy one get one wings' }, { opted_in: 'yes' }],
      ['set', 'statements.csv', { order_id: 'UE-6001' }, { promo_funded: '4.00', payout: '26.60' }],
      ['set', 'statements.csv', { order_id: 'UE-6002' }, { promo_funded: '4.00', payout: '33.40' }],
    ],
    mutations: [
      { id: 'promo-not-opted-in', op: ['set', 'campaigns.csv', { campaign: 'Spend 30 save 5' }, { opted_in: 'no' }], expect: ['Spend 30 save 5', 'not_opted_in'] },
      { id: 'ads-over-budget', op: ['set', 'campaigns.csv', { campaign: 'Sponsored search' }, { budget: '2.00' }], expect: ['Sponsored search', 'over_budget'] },
    ],
  },

  'fairtable-delivery-payouts': {
    planted: { 'DD-1002': ['commission_over_rate'], 'DD-1005': ['missing_from_statement'], 'UE-5002': ['payout_math'], 'DD-1003': ['error_charge'], 'DD-1004': ['duplicate_order'] },
    clean: [
      ['set', 'statements.csv', { order_id: 'DD-1002' }, { commission: '7.80', payout: '48.49' }],
      ['set', 'statements.csv', { order_id: 'DD-1003' }, { refund: '0.00', payout: '28.91' }],
      ['dropLast', 'statements.csv', { order_id: 'DD-1004' }],
      ['add', 'statements.csv', { platform: 'DoorDash', order_id: 'DD-1005', date: '2026-11-05', location: 'Main Street', type: 'order', subtotal: '47.00', tax: '3.88', commission: '7.05', processing_fee: '0.00', marketing_fee: '0.00', promo_funded: '0.00', refund: '0.00', adjustment: '0.00', payout: '43.83', payout_id: 'PO-77', payout_date: '2026-11-10' }],
      ['set', 'statements.csv', { order_id: 'UE-5002' }, { payout: '35.44' }],
    ],
    mutations: [
      { id: 'grubhub-commission', op: ['set', 'statements.csv', { order_id: 'GH-9001' }, { commission: '7.25' }], expect: ['GH-9001', 'commission_over_rate'] },
      { id: 'payout-short', op: ['set', 'statements.csv', { order_id: 'UE-5001' }, { payout: '36.46' }], expect: ['UE-5001', 'payout_math'] },
    ],
  },

  'fairtable-discounts-promos': {
    planted: { 'Employee Meal 50%': ['employee_meal_over'], 'Fall Prix Fixe': ['over_cap'], 'Happy Hour Half Off Apps': ['outside_hours'], 'Open Dollar Discount': ['over_cap', 'no_approver'], 'Summer Patio 20%': ['expired_promo'], 'Industry Night 15%': ['unknown_discount'] },
    clean: [
      ['set', 'discounts.csv', { check: '2002' }, { time: '17:45' }],
      ['set', 'discounts.csv', { check: '2010' }, { amount: '14.00' }],
      ['drop', 'discounts.csv', { check: '2004' }],
      ['set', 'discounts.csv', { check: '2005' }, { amount: '18.00', approver: 'Morgan Blake' }],
      ['set', 'discounts.csv', { check: '2007' }, { date: '2026-11-07' }],
      ['drop', 'discounts.csv', { check: '2009' }],
    ],
    mutations: [
      { id: 'prix-fixe-over-cap', op: ['set', 'discounts.csv', { check: '2003' }, { amount: '20.00' }], expect: ['Fall Prix Fixe', 'over_cap'] },
      { id: 'happy-hour-late', op: ['set', 'discounts.csv', { check: '2001' }, { time: '18:30' }], expect: ['Happy Hour Half Off Apps', 'outside_hours'] },
    ],
  },

  'fairtable-duplicate-invoices': {
    planted: {
      'Example Foodservice EF-50311 2026-11-10': ['duplicate_number'], 'Example Seafood ES-1180 2026-11-05': ['line_math'], 'Example Foodservice EF-50311 2026-11-03': ['gl_miscoded'],
      'Example Linen Co (no number) 2026-11-07': ['missing_number'], 'Sample Beverage Co SB-3001 2026-11-03': ['gl_miscoded'], 'Sample Produce Co SP-7790 2026-11-06': ['possible_duplicate'],
    },
    clean: [
      ['drop', 'invoices.csv', { invoice_number: 'EF-50311', invoice_date: '2026-11-10' }],
      ['set', 'invoices.csv', { invoice_number: 'ES-1180' }, { extended: '264.00' }],
      ['set', 'invoices.csv', { item: 'To-go Containers 9in' }, { gl_account: '5300 Paper and Supplies' }],
      ['set', 'invoices.csv', { vendor: 'Example Linen Co' }, { invoice_number: 'EL-0451' }],
      ['set', 'invoices.csv', { item: 'Tequila Blanco 12/750ML' }, { gl_account: '5100 Beverage COGS' }],
      ['drop', 'invoices.csv', { invoice_number: 'SP-7790' }],
    ],
    mutations: [
      { id: 'bun-line-math', op: ['set', 'invoices.csv', { item: 'Brioche Bun' }, { extended: '182.80' }], expect: ['Example Foodservice EF-50311 2026-11-03', 'line_math'] },
      { id: 'wine-to-food', op: ['set', 'invoices.csv', { item: 'House Red Wine 12/750ML' }, { gl_account: '5000 Food COGS' }], expect: ['Sample Beverage Co SB-3001 2026-11-03', 'gl_miscoded'] },
    ],
  },

  'fairtable-equipment-maintenance': {
    planted: { 'Hood fire suppression': ['overdue'], 'Kitchen hood': ['overdue'], 'Dish machine': ['no_interval'], 'Reach-in freezer': ['no_last_service'], 'Fire extinguishers': ['due_soon'], 'Grease trap': ['due_soon'], 'Ice machine': ['due_soon'], 'Walk-in cooler': ['repeat_repairs'] },
    clean: [
      ['set', 'equipment.csv', { equipment: 'Kitchen hood' }, { last_service: '2026-10-20' }],
      ['set', 'equipment.csv', { equipment: 'Hood fire suppression' }, { last_service: '2026-10-02' }],
      ['set', 'equipment.csv', { equipment: 'Grease trap' }, { last_service: '2026-11-01' }],
      ['set', 'service_log.csv', { equipment: 'Grease trap' }, { date: '2026-11-01' }],
      ['set', 'equipment.csv', { equipment: 'Fire extinguishers' }, { last_service: '2026-11-10' }],
      ['set', 'equipment.csv', { equipment: 'Ice machine' }, { last_service: '2026-09-01' }],
      ['set', 'equipment.csv', { equipment: 'Reach-in freezer' }, { last_service: '2026-10-01' }],
      ['set', 'equipment.csv', { equipment: 'Dish machine' }, { interval_days: '90' }],
      ['drop', 'service_log.csv', { equipment: 'Walk-in cooler', date: '2026-08-03' }],
      ['drop', 'service_log.csv', { equipment: 'Walk-in cooler', date: '2026-09-12' }],
    ],
    mutations: [
      { id: 'ice-machine-overdue', op: ['set', 'equipment.csv', { equipment: 'Ice machine' }, { last_service: '2026-05-01' }], expect: ['Ice machine', 'overdue'] },
      { id: 'dish-machine-due', op: ['set', 'equipment.csv', { equipment: 'Dish machine' }, { last_service: '2026-08-25' }], expect: ['Dish machine', 'due_soon'] },
    ],
  },

  'fairtable-food-cost': {
    planted: {
      'Cheddar Cheese': ['over_usage'], 'Chicken Breast': ['over_usage'], 'Anchovy Paste': ['unit_mismatch'], 'Corn Tortilla': ['under_usage'], 'Fryer Oil': ['not_in_recipes'],
      'LEMON 165CT': ['purchase_not_matched'], 'Lemons': ['no_close_count'], 'Seasonal Soup': ['item_sold_no_recipe'],
      'Cod Fillet': ['small_over_usage'], 'Frozen Fries': ['small_over_usage'], 'Ground Beef 80/20': ['small_over_usage'], 'Romaine': ['small_over_usage'],
    },
    clean: [
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Cheddar Cheese' }, { counted_qty: '16.25' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Chicken Breast' }, { counted_qty: '39.17' }],
      ['set', 'counts.csv', { count_date: '2026-11-01', item: 'Anchovy Paste' }, { counted_qty: '40', unit: 'oz', unit_cost: '1.75' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Anchovy Paste' }, { counted_qty: '17.5', unit: 'oz', unit_cost: '1.75' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Corn Tortilla' }, { counted_qty: '180' }],
      ['drop', 'counts.csv', { item: 'Fryer Oil' }],
      ['set', 'purchases.csv', { item: 'LEMON 165CT' }, { item: 'Lemons' }],
      ['add', 'counts.csv', { count_date: '2026-11-08', item: 'Lemons', counted_qty: '175', unit: 'ea', unit_cost: '0.25', area: 'Walk-in' }],
      ['drop', 'sales.csv', { item: 'Seasonal Soup' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Cod Fillet' }, { counted_qty: '7' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Frozen Fries' }, { counted_qty: '67.5' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Ground Beef 80/20' }, { counted_qty: '37.5' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Romaine' }, { counted_qty: '11.88' }],
    ],
    mutations: [
      { id: 'beef-short', op: ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Ground Beef 80/20' }, { counted_qty: '20' }], expect: ['Ground Beef 80/20', 'over_usage'] },
      { id: 'bun-count-missing', op: ['drop', 'counts.csv', { count_date: '2026-11-08', item: 'Brioche Bun' }], expect: ['Brioche Bun', 'no_close_count'] },
    ],
  },

  'fairtable-food-handler-cards': {
    planted: { 'Casey Morgan': ['missing_card'], 'Harbor Road (location)': ['no_certified_manager'], 'Morgan Blake': ['expired'], 'Sam Patel': ['expired', 'expiring_soon'], 'Jamie Ortiz': ['alcohol_cert_missing'], 'Riley Chen': ['in_grace_period'], 'Taylor Brooks': ['expiring_soon'] },
    clean: [
      ['add', 'certificates.csv', { employee: 'Casey Morgan', cert_type: 'Food handler', number: 'FH-1007', issued: '2026-10-05', expires: '2029-10-05' }],
      ['add', 'certificates.csv', { employee: 'Riley Chen', cert_type: 'Food handler', number: 'FH-1008', issued: '2026-11-06', expires: '2029-11-06' }],
      ['set', 'certificates.csv', { number: 'FH-1002' }, { issued: '2026-06-18', expires: '2029-06-18' }],
      ['set', 'certificates.csv', { number: 'FPM-201' }, { issued: '2026-11-01', expires: '2031-11-01' }],
      ['add', 'certificates.csv', { employee: 'Jamie Ortiz', cert_type: 'Alcohol server', number: 'AS-502', issued: '2025-08-25', expires: '2027-08-25' }],
      ['set', 'certificates.csv', { number: 'FH-1005' }, { issued: '2026-11-10', expires: '2029-11-10' }],
      ['set', 'certificates.csv', { number: 'FPM-202' }, { issued: '2026-04-20', expires: '2031-04-20' }],
    ],
    mutations: [
      { id: 'alcohol-cert-expired', op: ['set', 'certificates.csv', { number: 'AS-501' }, { expires: '2026-11-01' }], expect: ['Avery Stone', 'expired'] },
      { id: 'card-expiring', op: ['set', 'certificates.csv', { number: 'FH-1001' }, { expires: '2026-12-01' }], expect: ['Jordan Lee', 'expiring_soon'] },
    ],
  },

  'fairtable-stored-value': {
    planted: { 'GC-1005': ['negative_balance'], 'GC-1006': ['balance_math'], 'GC-1007': ['large_balance'], 'GC-1003': ['dormant'], 'GC-1004': ['cross_location'], 'GC-1008': ['dormant'] },
    clean: [
      ['set', 'cards.csv', { card: 'GC-1005' }, { redeemed: '40.00', balance: '0.00' }],
      ['set', 'cards.csv', { card: 'GC-1006' }, { balance: '120.00' }],
      ['set', 'cards.csv', { card: 'GC-1007' }, { issued_amount: '200.00', balance: '200.00' }],
      ['set', 'cards.csv', { card: 'GC-1003' }, { redeemed: '25.00', balance: '50.00', last_activity: '2026-01-10' }],
      ['set', 'cards.csv', { card: 'GC-1004' }, { last_location: 'Harbor Road' }],
      ['set', 'cards.csv', { card: 'GC-1008' }, { last_activity: '2026-02-01' }],
    ],
    mutations: [
      { id: 'balance-off', op: ['set', 'cards.csv', { card: 'GC-1002' }, { balance: '35.00' }], expect: ['GC-1002', 'balance_math'] },
      { id: 'spent-elsewhere', op: ['set', 'cards.csv', { card: 'GC-1001' }, { last_location: 'Harbor Road' }], expect: ['GC-1001', 'cross_location'] },
    ],
  },

  'fairtable-health-inspections': {
    planted: {
      'Main Street | Liquor licence': ['permit_expired'], 'Main Street | inspections': ['reinspection_overdue', 'critical_open', 'score_drop'], 'Airport Kiosk | Fire inspection certificate': ['no_expiry'],
      'Airport Kiosk | inspections': ['routine_due'], 'Harbor Road | Liquor licence': ['permit_expiring'], 'Harbor Road | inspections': ['routine_due'], 'Main Street | Food service permit': ['permit_expiring'],
    },
    clean: [
      ['set', 'inspections.csv', { location: 'Main Street', date: '2026-08-18' }, { score: '93', critical_violations: '0', violations: '2', reinspection_due: '' }],
      ['set', 'inspections.csv', { location: 'Harbor Road', date: '2026-04-22' }, { date: '2026-08-22' }],
      ['set', 'inspections.csv', { location: 'Airport Kiosk', date: '2026-06-05' }, { date: '2026-09-05' }],
      ['set', 'permits.csv', { number: 'FSP-1001' }, { expires: '2027-12-31' }],
      ['set', 'permits.csv', { number: 'LL-2001' }, { expires: '2027-11-01' }],
      ['set', 'permits.csv', { number: 'LL-2002' }, { expires: '2027-12-20' }],
      ['set', 'permits.csv', { number: 'FI-3003' }, { expires: '2027-05-31' }],
    ],
    mutations: [
      { id: 'permit-lapsed', op: ['set', 'permits.csv', { number: 'FSP-1002' }, { expires: '2026-11-10' }], expect: ['Harbor Road | Food service permit', 'permit_expired'] },
      { id: 'permit-soon', op: ['set', 'permits.csv', { number: 'FSP-1003' }, { expires: '2026-12-15' }], expect: ['Airport Kiosk | Food service permit', 'permit_expiring'] },
    ],
  },

  'fairtable-inventory-counts': {
    planted: { 'Chicken Breast': ['big_variance'], 'House Vodka': ['big_variance'], 'Salmon Fillet': ['big_variance'], 'Heavy Cream': ['unit_suspect'], 'Olive Oil': ['missing_count'], 'Shrimp 21/25': ['no_cost'], 'Tequila Blanco': ['negative_count'], 'Cheddar Cheese': ['small_variance'] },
    clean: [
      ['set', 'counts.csv', { item: 'Chicken Breast' }, { counted_qty: '36' }],
      ['set', 'counts.csv', { item: 'House Vodka' }, { counted_qty: '14' }],
      ['set', 'counts.csv', { item: 'Salmon Fillet' }, { counted_qty: '10' }],
      ['set', 'counts.csv', { item: 'Heavy Cream' }, { counted_qty: '6' }],
      ['set', 'counts.csv', { item: 'Olive Oil' }, { counted_qty: '3' }],
      ['set', 'counts.csv', { item: 'Shrimp 21/25' }, { unit_cost: '9.50' }],
      ['set', 'counts.csv', { item: 'Tequila Blanco' }, { counted_qty: '3' }],
      ['set', 'counts.csv', { item: 'Cheddar Cheese' }, { counted_qty: '4.5' }],
    ],
    mutations: [
      { id: 'beef-short', op: ['set', 'counts.csv', { item: 'Ground Beef 80/20' }, { counted_qty: '22' }], expect: ['Ground Beef 80/20', 'big_variance'] },
      { id: 'fries-no-cost', op: ['set', 'counts.csv', { item: 'Frozen Fries' }, { unit_cost: '' }], expect: ['Frozen Fries', 'no_cost'] },
    ],
  },

  'fairtable-labor-dayparts': {
    planted: { '2026-11-03 Afternoon': ['labor_over_target', 'low_splh'], '2026-11-03 Breakfast': ['labor_no_sales'], 'Sales with no time': ['sales_no_time'] },
    clean: [
      ['set', 'sales.csv', { time: '15:30' }, { net_sales: '700.00' }],
      ['add', 'sales.csv', { date: '2026-11-03', time: '08:30', location: 'Main Street', item: 'Breakfast checks', qty: '1', net_sales: '800.00' }],
      ['set', 'sales.csv', { item: 'Catering pickup' }, { time: '12:00' }],
    ],
    mutations: [
      { id: 'rate-typo', op: ['set', 'timecards.csv', { employee: 'Taylor Brooks' }, { rate: '120.00' }], expect: ['2026-11-03 Lunch', 'labor_over_target'] },
      { id: 'sale-without-time', op: ['set', 'sales.csv', { time: '11:30' }, { time: '' }], expect: ['Sales with no time', 'sales_no_time'] },
    ],
  },

  'fairtable-location-comparison': {
    planted: { 'Uptown': ['food_pct_high', 'prime_pct_high', 'void_pct_high', 'discount_pct_high'], 'Airport Kiosk': ['avg_check_low'] },
    clean: [
      ['set', 'locations.csv', { location: 'Uptown' }, { food_cost: '40040.00', voids: '1300.00', discounts: '3300.00' }],
      ['set', 'locations.csv', { location: 'Airport Kiosk' }, { checks: '1600' }],
    ],
    mutations: [
      { id: 'voids-up', op: ['set', 'locations.csv', { location: 'Lakeside' }, { voids: '2000.00' }], expect: ['Lakeside', 'void_pct_high'] },
      { id: 'labor-up', op: ['set', 'locations.csv', { location: 'Harbor Road' }, { labor_cost: '45000.00' }], expect: ['Harbor Road', 'labor_pct_high'] },
    ],
  },

  'fairtable-meal-breaks': {
    planted: { 'Jordan Lee @ 2026-11-04T10:00': ['missed_meal_break'], 'Riley Chen': ['missed_second_meal'], 'Sam Patel': ['short_meal_break', 'minor_late_shift'], 'Taylor Brooks': ['minor_over_hours', 'minor_late_shift'], 'Casey Morgan': ['late_meal'] },
    clean: [
      ['set', 'timecards.csv', { employee: 'Jordan Lee', clock_in: '2026-11-04T10:00' }, { break_start: '2026-11-04T14:00', break_minutes: '30' }],
      ['set', 'timecards.csv', { employee: 'Casey Morgan' }, { break_start: '2026-11-03T11:30' }],
      ['set', 'timecards.csv', { employee: 'Riley Chen' }, { clock_out: '2026-11-04T20:30' }],
      ['set', 'timecards.csv', { employee: 'Sam Patel' }, { clock_out: '2026-11-05T22:15', break_minutes: '30' }],
      ['set', 'timecards.csv', { employee: 'Taylor Brooks' }, { clock_in: '2026-11-06T18:00', clock_out: '2026-11-06T21:00', break_start: '', break_minutes: '0' }],
    ],
    mutations: [
      { id: 'short-break', op: ['set', 'timecards.csv', { employee: 'Jordan Lee', clock_in: '2026-11-03T10:00' }, { break_minutes: '15' }], expect: ['Jordan Lee @ 2026-11-03T10:00', 'short_meal_break'] },
      { id: 'long-shift-no-break', op: ['set', 'timecards.csv', { employee: 'Avery Stone' }, { clock_out: '2026-11-06T23:00' }], expect: ['Avery Stone', 'missed_meal_break'] },
    ],
  },

  'fairtable-menu-engineering': {
    planted: { 'Beet Salad': ['dog'], 'Chef Special': ['no_cost'], 'Caesar Salad': ['plowhorse'], 'Chicken Sandwich': ['plowhorse'], 'Classic Burger': ['plowhorse'], 'Lamb Shank': ['puzzle'], 'Mushroom Risotto': ['puzzle'], 'Steak Frites': ['puzzle'] },
    clean: null,
    clean_note: 'Not measured: the check sorts every costed item into a quadrant against the menu\'s own averages, so plowhorse, puzzle and dog are labels on a normal menu, not errors. Only no_cost is a data problem, and it is covered by the planted set and a mutation.',
    mutations: [
      { id: 'cost-missing', op: ['set', 'costs.csv', { item: 'Cobb Salad' }, { plate_cost: '' }], expect: ['Cobb Salad', 'no_cost'] },
      { id: 'star-loses-margin', op: ['set', 'costs.csv', { item: 'Fish and Chips' }, { plate_cost: '15.00' }], expect: ['Fish and Chips', 'plowhorse'] },
    ],
  },

  'fairtable-no-shows': {
    planted: { 'All reservations': ['high_no_show_rate'], 'Morgan Ellis': ['repeat_no_show'], 'Casey Brennan': ['no_show', 'large_party_no_deposit'], 'Sam Whitaker': ['no_show', 'fee_not_charged'] },
    clean: [
      ['set', 'reservations.csv', { reservation_id: 'R-1002' }, { status: 'Seated' }],
      ['set', 'reservations.csv', { reservation_id: 'R-1005' }, { status: 'Seated' }],
      ['set', 'reservations.csv', { reservation_id: 'R-1010' }, { status: 'Seated' }],
      ['set', 'reservations.csv', { reservation_id: 'R-1003' }, { status: 'Seated', deposit: '160' }],
      ['set', 'reservations.csv', { reservation_id: 'R-1006' }, { status: 'Seated' }],
    ],
    mutations: [
      { id: 'one-no-show', op: ['set', 'reservations.csv', { reservation_id: 'R-1007' }, { status: 'No Show' }], expect: ['Taylor Grant', 'no_show'] },
      { id: 'large-party-no-deposit', op: ['set', 'reservations.csv', { reservation_id: 'R-1003' }, { status: 'No Show', deposit: '0' }], expect: ['Casey Brennan', 'large_party_no_deposit'] },
    ],
  },

  'fairtable-overtime': {
    planted: { 'Jordan Lee': ['overtime_high'], 'Casey Morgan': ['split_shift', 'spread_of_hours'], 'Riley Chen': ['clopen', 'missing_clock_out'], 'Sam Patel': ['spread_of_hours'] },
    clean: [
      ['drop', 'timecards.csv', { employee: 'Jordan Lee', clock_in: '2026-11-07T10:00' }],
      ['drop', 'timecards.csv', { employee: 'Casey Morgan', clock_in: '2026-11-03T16:00' }],
      ['set', 'timecards.csv', { employee: 'Riley Chen', clock_in: '2026-11-05T07:00' }, { clock_in: '2026-11-05T13:00', clock_out: '2026-11-05T19:00' }],
      ['set', 'timecards.csv', { employee: 'Riley Chen', clock_in: '2026-11-06T16:00' }, { clock_out: '2026-11-06T22:00' }],
      ['set', 'timecards.csv', { employee: 'Sam Patel' }, { clock_in: { replace: ['T08:00', 'T08:30'] } }],
    ],
    mutations: [
      { id: 'long-day', op: ['set', 'timecards.csv', { employee: 'Casey Morgan', clock_in: '2026-11-04T07:00' }, { clock_out: '2026-11-04T19:00' }], expect: ['Casey Morgan', 'spread_of_hours'] },
      { id: 'clopen', op: ['set', 'timecards.csv', { employee: 'Jordan Lee', clock_in: '2026-11-02T10:00' }, { clock_out: '2026-11-03T01:00' }], expect: ['Jordan Lee', 'clopen'] },
    ],
  },

  'fairtable-pour-cost': {
    planted: { 'Bourbon': ['over_pour'], 'Coffee Liqueur': ['no_close_count'], 'House Shot': ['drink_no_recipe'], 'London Dry Gin': ['not_in_recipes'], 'House Vodka': ['small_over_pour'], 'Triple Sec': ['small_over_pour'] },
    clean: [
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Bourbon' }, { counted_qty: '3.90' }],
      ['add', 'counts.csv', { count_date: '2026-11-08', item: 'Coffee Liqueur', counted_qty: '1.23', unit: 'bottle', size_ml: '750', unit_cost: '19.00', category: 'Liquor' }],
      ['drop', 'sales.csv', { item: 'House Shot' }],
      ['drop', 'counts.csv', { item: 'London Dry Gin' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'House Vodka' }, { counted_qty: '4.68' }],
      ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Triple Sec' }, { counted_qty: '2.90' }],
    ],
    mutations: [
      { id: 'tequila-short', op: ['set', 'counts.csv', { count_date: '2026-11-08', item: 'Tequila Blanco' }, { counted_qty: '2.0' }], expect: ['Tequila Blanco', 'over_pour'] },
      { id: 'recipe-under-states', op: ['set', 'recipes.csv', { recipe: 'Margarita', ingredient: 'Triple Sec' }, { qty: '0.5' }], expect: ['Triple Sec', 'over_pour'] },
    ],
  },

  'fairtable-price-creep': {
    planted: { 'Chicken Breast': ['pack_changed', 'price_up'], 'Fryer Oil': ['small_price_up', 'over_contract'], 'Ground Beef 80/20': ['price_up', 'steady_creep'], 'Salmon Fillet': ['price_up', 'over_contract'] },
    clean: [
      ['set', 'invoices.csv', { item: 'Ground Beef 80/20' }, { unit_price: '46.00', extended: '276.00' }],
      ['set', 'invoices.csv', { item: 'Fryer Oil', invoice_date: '2026-10-20' }, { unit_price: '38.50', extended: '77.00' }],
      ['set', 'invoices.csv', { item: 'Fryer Oil', invoice_date: '2026-11-03' }, { unit_price: '38.50', extended: '77.00' }],
      ['set', 'invoices.csv', { item: 'Chicken Breast', invoice_date: '2026-11-03' }, { pack: '4/10 LB' }],
      ['set', 'invoices.csv', { item: 'Salmon Fillet', invoice_date: '2026-11-05' }, { unit_price: '120.00', extended: '240.00' }],
    ],
    mutations: [
      { id: 'bun-over-bid', op: ['set', 'invoices.csv', { item: 'Brioche Bun', invoice_date: '2026-11-03' }, { unit_price: '47.00' }], expect: ['Brioche Bun', 'over_contract'] },
      { id: 'romaine-smaller-case', op: ['set', 'invoices.csv', { item: 'Romaine', invoice_date: '2026-11-04' }, { pack: '1/20 LB' }], expect: ['Romaine', 'pack_changed'] },
    ],
  },

  'fairtable-prime-cost': {
    planted: { 'Main Street 2026-10-26': ['prime_over_target', 'cogs_over_target', 'labor_over_target', 'rising_prime'], 'Main Street 2026-11-02': ['prime_over_target', 'cogs_over_target', 'labor_over_target', 'rising_prime'], 'Harbor Road 2026-10-26': ['missing_data'] },
    clean: [
      ['set', 'weeks.csv', { week: '2026-10-26', location: 'Main Street' }, { food_cost: '10800.00', labor_cost: '10400.00', labor_burden: '1560.00' }],
      ['set', 'weeks.csv', { week: '2026-11-02', location: 'Main Street' }, { food_cost: '10500.00', beverage_cost: '2800.00', labor_cost: '10200.00', labor_burden: '1530.00' }],
      ['set', 'weeks.csv', { week: '2026-10-26', location: 'Harbor Road' }, { labor_cost: '7400.00', labor_burden: '1110.00' }],
    ],
    mutations: [
      { id: 'labor-up', op: ['set', 'weeks.csv', { week: '2026-11-02', location: 'Harbor Road' }, { labor_cost: '9500.00' }], expect: ['Harbor Road 2026-11-02', 'labor_over_target'] },
      { id: 'sales-missing', op: ['set', 'weeks.csv', { week: '2026-10-12', location: 'Main Street' }, { net_sales: '' }], expect: ['Main Street 2026-10-12', 'missing_data'] },
    ],
  },

  'fairtable-receiving-credits': {
    planted: { 'Chicken Breast': ['rejected_not_credited'], 'Frozen Fries': ['short_not_credited'], 'Avocados': ['no_receiving_record'], 'Sweet Potato Fries': ['received_not_invoiced'] },
    clean: [
      ['add', 'credits.csv', { credit_number: 'CM-2250', vendor: 'Example Foodservice', invoice_number: 'EF-50311', item: 'Chicken Breast', amount: '156.00', credit_date: '2026-11-05' }],
      ['set', 'credits.csv', { credit_number: 'CM-2240' }, { amount: '33.00' }],
      ['add', 'receiving.csv', { vendor: 'Sample Produce Co', invoice_number: 'SP-7790', received_date: '2026-11-07', item: 'Avocados', qty_received: '2', qty_rejected: '0', note: '', received_by: 'Jordan Lee' }],
      ['drop', 'receiving.csv', { item: 'Sweet Potato Fries' }],
    ],
    mutations: [
      { id: 'romaine-short', op: ['set', 'receiving.csv', { item: 'Romaine' }, { qty_received: '1' }], expect: ['Romaine', 'short_not_credited'] },
      { id: 'cheddar-part-credit', op: ['set', 'credits.csv', { credit_number: 'CM-2201' }, { amount: '50.00' }], expect: ['Cheddar Cheese', 'short_not_credited'] },
    ],
  },

  'fairtable-recipe-costs': {
    planted: { 'Steak Frites': ['no_price', 'over_target', 'cost_rose'], 'Truffle Fries': ['unit_mismatch', 'no_menu_price'], 'House Lemonade': ['near_target'] },
    clean: [
      ['add', 'invoices.csv', { vendor: 'Example Foodservice', invoice_number: 'EF-50311', invoice_date: '2026-11-03', item_code: '500950', item: 'Herb Butter', pack: '1/5 LB', qty: '1', unit_price: '40.00', extended: '40.00' }],
      ['set', 'invoices.csv', { item: 'Ribeye', invoice_date: '2026-10-06' }, { unit_price: '186.00', extended: '372.00' }],
      ['set', 'recipes.csv', { recipe: 'Steak Frites' }, { menu_price: '48.00' }],
      ['set', 'recipes.csv', { recipe: 'Truffle Fries' }, { menu_price: '9.00' }],
      ['set', 'recipes.csv', { recipe: 'Truffle Fries', ingredient: 'Truffle Oil' }, { unit: 'oz' }],
      ['set', 'recipes.csv', { recipe: 'House Lemonade' }, { menu_price: '2.25' }],
    ],
    mutations: [
      { id: 'shrimp-portion', op: ['set', 'recipes.csv', { recipe: 'Shrimp Tacos', ingredient: 'Shrimp 21/25' }, { qty: '16' }], expect: ['Shrimp Tacos', 'over_target'] },
      { id: 'beef-price-rise', op: ['set', 'invoices.csv', { item: 'Ground Beef 80/20', invoice_date: '2026-11-03' }, { unit_price: '56.00' }], expect: ['Classic Burger', 'cost_rose'] },
    ],
  },

  'fairtable-sales-tax': {
    planted: { 'Main Street | Alcohol': ['under_collected'], 'Airport Kiosk | Food': ['unknown_location'], 'Main Street | Food | marketplace': ['marketplace_tax_in_pos'], 'Main Street | Grocery': ['over_collected'], 'Harbor Road | Food | exempt': ['exempt_sales'] },
    clean: [
      ['set', 'sales.csv', { location: 'Main Street', category: 'Alcohol' }, { tax: '430.50' }],
      ['set', 'sales.csv', { location: 'Main Street', category: 'Grocery' }, { tax: '0.00' }],
      ['set', 'sales.csv', { location: 'Main Street', channel: 'Uber Eats' }, { tax: '0.00' }],
      ['drop', 'sales.csv', { location: 'Airport Kiosk' }],
      ['drop', 'sales.csv', { tax_exempt: 'yes' }],
    ],
    mutations: [
      { id: 'food-under', op: ['set', 'sales.csv', { location: 'Harbor Road', category: 'Food' }, { tax: '560.00' }], expect: ['Harbor Road | Food', 'under_collected'] },
      { id: 'marketplace-taxed', op: ['set', 'sales.csv', { location: 'Main Street', channel: 'DoorDash' }, { tax: '173.25' }], expect: ['Main Street | Food | marketplace', 'marketplace_tax_in_pos'] },
    ],
  },

  'fairtable-schedule-vs-actual': {
    planted: { 'Jordan Lee': ['early_clock_in', 'late_clock_out', 'over_schedule'], 'Riley Chen': ['unscheduled_shift', 'over_schedule'], 'Jamie Ortiz': ['no_show'], 'Avery Stone': ['late_arrival'] },
    clean: [
      ['set', 'timecards.csv', { employee: 'Jordan Lee' }, { clock_in: { replace: ['T\\d\\d:\\d\\d', 'T10:00'] }, clock_out: { replace: ['T\\d\\d:\\d\\d', 'T18:00'] } }],
      ['drop', 'timecards.csv', { employee: 'Riley Chen', clock_in: '2026-11-07T17:00' }],
      ['add', 'timecards.csv', { employee: 'Jamie Ortiz', role: 'Server', location: 'Main Street', clock_in: '2026-11-06T16:00', clock_out: '2026-11-06T22:00', break_minutes: '0', rate: '2.13' }],
      ['set', 'timecards.csv', { employee: 'Avery Stone', clock_in: '2026-11-04T16:20' }, { clock_in: '2026-11-04T16:00' }],
    ],
    mutations: [
      { id: 'late-in', op: ['set', 'timecards.csv', { employee: 'Avery Stone', clock_in: '2026-11-05T16:00' }, { clock_in: '2026-11-05T16:25' }], expect: ['Avery Stone', 'late_arrival'] },
      { id: 'late-out', op: ['set', 'timecards.csv', { employee: 'Riley Chen', clock_in: '2026-11-05T17:00' }, { clock_out: '2026-11-05T23:45' }], expect: ['Riley Chen', 'late_clock_out'] },
    ],
  },

  'fairtable-stockouts': {
    planted: { 'Oysters': ['long_86', 'never_returned'], 'Short Rib': ['repeated_86', 'long_86', 'early_86'] },
    clean: [
      ['drop', 'eighty_six.csv', { item: 'Short Rib', date: '2026-11-03' }],
      ['drop', 'eighty_six.csv', { item: 'Short Rib', date: '2026-11-04' }],
      ['set', 'eighty_six.csv', { item: 'Short Rib', date: '2026-11-06' }, { out_at: '21:30' }],
      ['set', 'eighty_six.csv', { item: 'Oysters' }, { out_at: '21:00', back_at: '22:00' }],
    ],
    mutations: [
      { id: 'out-all-evening', op: ['set', 'eighty_six.csv', { item: 'Fish Tacos' }, { out_at: '17:00' }], expect: ['Fish Tacos', 'long_86'] },
      { id: 'never-back', op: ['set', 'eighty_six.csv', { item: 'Key Lime Pie' }, { back_at: '' }], expect: ['Key Lime Pie', 'never_returned'] },
    ],
  },

  'fairtable-tip-pooling': {
    planted: { 'Avery Stone @ 2026-11-09': ['tip_credit_shortfall', 'no_cash_declared'], 'Casey Moreno': ['tip_credit_shortfall', 'no_cash_declared'], 'Morgan Blake': ['manager_kept_tips'], 'Taylor Brooks': ['below_cash_wage', 'tip_credit_shortfall'], 'Jamie Ortiz': ['no_cash_declared'] },
    clean: [
      ['set', 'timecards.csv', { employee: 'Avery Stone', clock_in: '2026-11-11T11:00' }, { cash_tips: '30.00', card_tips: '100.00' }],
      ['set', 'timecards.csv', { employee: 'Casey Moreno' }, { cash_tips: '60.00', card_tips: '200.00' }],
      ['set', 'timecards.csv', { employee: 'Morgan Blake' }, { card_tips: '0.00' }],
      ['set', 'timecards.csv', { employee: 'Taylor Brooks' }, { rate: '2.13' }],
      ['set', 'timecards.csv', { employee: 'Avery Stone', clock_in: '2026-11-02T16:00' }, { card_tips: '850.00' }],
      ['set', 'timecards.csv', { employee: 'Jamie Ortiz' }, { cash_tips: '40.00' }],
    ],
    mutations: [
      { id: 'under-cash-wage', op: ['set', 'timecards.csv', { employee: 'Jamie Ortiz' }, { rate: '1.50' }], expect: ['Jamie Ortiz', 'below_cash_wage'] },
      { id: 'manager-in-pool', op: ['set', 'timecards.csv', { employee: 'Riley Chen' }, { role: 'Manager' }], expect: ['Riley Chen', 'manager_kept_tips'] },
    ],
  },

  'fairtable-utility-bills': {
    planted: { 'EL-4410 2026-10-01': ['usage_spike'], 'WT-7781 2026-09-01': ['duplicate_bill'], 'GS-2020 2026-09-01': ['estimated_twice'], 'GS-2020 2026-10-01': ['rate_jump', 'late_fee'], 'GS-2020 2026-08-01': ['estimated_read'] },
    clean: [
      ['set', 'bills.csv', { account: 'EL-4410', period_start: '2026-10-01' }, { usage: '9100', amount: '1547.00' }],
      ['set', 'bills.csv', { account: 'GS-2020', period_start: '2026-08-01' }, { read_type: 'actual' }],
      ['set', 'bills.csv', { account: 'GS-2020', period_start: '2026-09-01' }, { read_type: 'actual' }],
      ['set', 'bills.csv', { account: 'GS-2020', period_start: '2026-10-01' }, { amount: '651.00', late_fee: '0' }],
      ['dropLast', 'bills.csv', { account: 'WT-7781', period_start: '2026-09-01' }],
    ],
    mutations: [
      { id: 'water-spike', op: ['set', 'bills.csv', { account: 'WT-7781', period_start: '2026-10-01' }, { usage: '60000' }], expect: ['WT-7781 2026-10-01', 'usage_spike'] },
      { id: 'estimated', op: ['set', 'bills.csv', { account: 'EL-4410', period_start: '2026-09-01' }, { read_type: 'estimated' }], expect: ['EL-4410 2026-09-01', 'estimated_read'] },
    ],
  },

  'fairtable-voids-comps': {
    planted: { 'Avery Stone': ['self_approved', 'after_close', 'high_void_rate', 'no_reason'], 'Sam Patel': ['high_void_rate', 'full_check_void'], 'Jamie Ortiz': ['no_approver'] },
    clean: [
      ['drop', 'checks.csv', { check: '1002' }],
      ['drop', 'checks.csv', { check: '1003' }],
      ['set', 'checks.csv', { check: '1006' }, { approver: 'Morgan Blake' }],
      ['drop', 'checks.csv', { check: '1008' }],
      ['drop', 'checks.csv', { check: '1004' }],
    ],
    mutations: [
      { id: 'self-approved', op: ['set', 'checks.csv', { check: '1007' }, { approver: 'Riley Chen' }], expect: ['Riley Chen', 'self_approved'] },
      { id: 'no-reason', op: ['set', 'checks.csv', { check: '1005' }, { reason: '' }], expect: ['Jamie Ortiz', 'no_reason'] },
    ],
  },

  'fairtable-waste-log': {
    planted: { 'Chicken Breast': ['high_waste', 'repeat_reason'], 'Salmon Fillet': ['high_waste'], '2026-11-05': ['unlogged_day'], 'Brioche Bun': ['no_reason'], 'House Soup': ['no_value'], 'Fries': ['some_waste', 'repeat_reason'] },
    clean: [
      ['drop', 'waste.csv', { item: 'Chicken Breast', date: '2026-11-02' }],
      ['drop', 'waste.csv', { item: 'Chicken Breast', date: '2026-11-06' }],
      ['set', 'waste.csv', { item: 'Chicken Breast', date: '2026-11-08' }, { qty: '3' }],
      ['drop', 'waste.csv', { item: 'Salmon Fillet', date: '2026-11-07' }],
      ['set', 'waste.csv', { item: 'Salmon Fillet' }, { qty: '1' }],
      ['drop', 'waste.csv', { item: 'Fries', date: '2026-11-03' }],
      ['drop', 'waste.csv', { item: 'Fries', date: '2026-11-04' }],
            ['set', 'waste.csv', { item: 'Brioche Bun' }, { reason: 'stale' }],
      ['set', 'waste.csv', { item: 'House Soup' }, { unit_cost: '12.00' }],
      ['add', 'waste.csv', { date: '2026-11-05', location: 'Main Street', item: 'Romaine', qty: '1', unit: 'lb', unit_cost: '2.10', value: '', reason: 'spoiled', employee: 'Jordan Lee', shift: 'AM' }],
    ],
    mutations: [
      { id: 'romaine-binned', op: ['set', 'waste.csv', { item: 'Romaine', date: '2026-11-04' }, { qty: '12' }], expect: ['Romaine', 'some_waste'] },
      { id: 'no-reason', op: ['set', 'waste.csv', { item: 'Brioche Bun' }, { reason: '' }], expect: ['Brioche Bun', 'no_reason'] },
    ],
  },
};
