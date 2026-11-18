// Column vocabularies shared by the Fairtable agents, so a POS item-sales export,
// a distributor invoice or a timecard export reads the same way in every agent.
// Each field lists the header names it is also called. The names were written from
// knowledge of common POS, scheduling, invoice-processing, distributor, delivery-app
// and reservation exports; none was checked against a live account. A restaurant can
// name columns by hand in fairtable-sources.json.
//
// personal: true marks a field that holds a person's name or contact details. The
// agents mask those values in every result returned to the AI model; the report and
// draft files written on your machine keep the real values.
import { exportProfile, fullName } from './exports.js';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
const both = (d, tm) => ({ from: [d, tm], compute: (_r, get) => [get(d), get(tm)].map((v) => String(v ?? '').trim()).filter(Boolean).join(' ') });
const slash = (a, b) => ({ from: [a, b], compute: (_r, get) => { const x = String(get(a) ?? '').trim(), y = String(get(b) ?? '').trim(); return x && y ? `${x}/${y}` : x || y; } });

// ------------------------------------------------------------ POS sales ----

export const ITEM_SALES_FIELDS = Object.freeze({
  item: t(['Menu Item', 'Item', 'Item Name', 'Product', 'Product Name', 'Menu Item Name', 'Name'], { required: true }),
  date: t(['Order Date', 'Business Date', 'Date', 'Sale Date', 'Sent Date'], { type: 'date' }),
  location: t(['Location', 'Store', 'Restaurant', 'Store Name', 'Site', 'Unit']),
  category: t(['Sales Category', 'Category', 'Menu Group', 'Item Category', 'Reporting Category', 'Major Group']),
  qty: t(['Qty', 'Quantity', 'Qty Sold', 'Quantity Sold', 'Items Sold', 'Count', 'Number Sold', 'Sold'], { type: 'number' }),
  net_sales: t(['Net Sales', 'Net Price', 'Net Amount', 'Item Revenue', 'Net Revenue', 'Sales'], { type: 'money' }),
  gross_sales: t(['Gross Sales', 'Gross Price', 'Gross Amount', 'Total incl. tax'], { type: 'money' }),
  discount: t(['Discount', 'Discounts', 'Discount Amount', 'Promo Amount'], { type: 'money' }),
  order_id: t(['Order Id', 'Order ID', 'Transaction ID', 'Check Id', 'Ticket', 'Order Number']),
  time: t(['Time', 'Order Time', 'Sent Time', 'Opened'], {}),
});

export const ITEM_SALES_PROFILES = Object.freeze([
  exportProfile('toast_item_selection_details', { item: 'Menu Item', date: 'Order Date', location: 'Location', category: ['Sales Category', 'Menu Group'], qty: 'Qty', net_sales: 'Net Price', gross_sales: 'Gross Price', discount: 'Discount', order_id: 'Order Id' }),
  exportProfile('square_item_sales', { item: 'Item', date: 'Date', location: 'Location', category: 'Category', qty: 'Qty', net_sales: 'Net Sales', gross_sales: 'Gross Sales', discount: 'Discounts', order_id: 'Transaction ID', time: 'Time' }),
  exportProfile('clover_item_sales', { item: 'Item Name', category: 'Category', qty: 'Items Sold', net_sales: 'Item Revenue' }),
  exportProfile('lightspeed_product_sales', { item: 'Product', qty: 'Quantity', gross_sales: 'Total incl. tax', category: 'Category' }),
  exportProfile('revel_product_mix', { item: 'Product Name', qty: 'Quantity Sold', net_sales: 'Net Sales', category: 'Category' }),
]);

// ----------------------------------------------------- invoices (AP lines) ----

export const INVOICE_LINE_FIELDS = Object.freeze({
  vendor: t(['Vendor', 'Vendor Name', 'Supplier', 'Distributor', 'Supplier Name']),
  invoice_number: t(['Invoice Number', 'Invoice No', 'Invoice #', 'Invoice', 'Inv No', 'Document Number']),
  invoice_date: t(['Invoice Date', 'Date', 'Delivery Date', 'Document Date', 'Inv Date'], { type: 'date' }),
  item_code: t(['Vendor Item Code', 'Item Code', 'Item Number', 'SUPC', 'Product Number', 'Product Code', 'SKU', 'Item #']),
  item: t(['Item Description', 'Product Description', 'Description', 'Product', 'Item', 'Item Name'], { required: true }),
  pack: t(['Pack/Size', 'Pack Size', 'Pack', 'Size', 'Packaging']),
  unit: t(['UofM', 'Unit', 'UOM', 'Unit of Measure', 'Purchase Unit']),
  qty: t(['Quantity Shipped', 'Qty Shipped', 'Quantity', 'Qty', 'Shipped', 'Qty Invoiced'], { type: 'number' }),
  unit_price: t(['Unit Price', 'Case Price', 'Price', 'Each Price', 'Price per Unit'], { type: 'money' }),
  extended: t(['Extended Price', 'Extended', 'Line Total', 'Total', 'Amount', 'Ext Price'], { type: 'money' }),
  category: t(['Category', 'Item Category', 'Accounting Category', 'Product Category', 'Class']),
  gl_account: t(['GL Account', 'GL Code', 'Account', 'Expense Account', 'GL']),
  location: t(['Location', 'Store', 'Restaurant', 'Ship To', 'Unit']),
});

export const INVOICE_LINE_PROFILES = Object.freeze([
  exportProfile('marginedge_invoice_lines', { vendor: 'Vendor', invoice_number: 'Invoice Number', invoice_date: 'Invoice Date', item_code: 'Vendor Item Code', item: 'Product', pack: 'Pack Size', unit: 'Unit', qty: 'Quantity', unit_price: 'Unit Price', extended: 'Total', category: 'Category', location: 'Location' }),
  exportProfile('r365_ap_invoice_detail', { vendor: 'Vendor', invoice_number: 'Invoice Number', invoice_date: 'Invoice Date', item_code: 'Item Number', item: 'Item', unit: 'UofM', qty: 'Quantity', unit_price: 'Unit Price', extended: 'Extended Price', gl_account: 'GL Account', location: 'Location' }),
  exportProfile('xtrachef_invoice_details', { vendor: 'Vendor Name', invoice_number: 'Invoice Number', invoice_date: 'Invoice Date', item_code: 'Item Code', item: 'Item Description', pack: 'Pack/Size', unit: 'Unit', qty: 'Quantity', unit_price: 'Unit Price', extended: 'Total', category: 'Category' }),
  exportProfile('sysco_invoice_csv', { invoice_number: 'Invoice Number', invoice_date: 'Invoice Date', item_code: 'SUPC', item: 'Description', pack: slash('Pack', 'Size'), qty: 'Qty Shipped', unit_price: 'Unit Price', extended: 'Extended Price', vendor: { value: 'Sysco' } }),
  exportProfile('usfoods_invoice_csv', { invoice_number: 'Invoice Number', invoice_date: 'Invoice Date', item_code: 'Product Number', item: 'Product Description', pack: 'Pack Size', qty: 'Quantity Shipped', unit_price: 'Unit Price', extended: 'Extended Price', vendor: { value: 'US Foods' } }),
]);

// ------------------------------------------------------------- recipes ----

export const RECIPE_FIELDS = Object.freeze({
  recipe: t(['Recipe', 'Menu Item', 'Recipe Name', 'Dish', 'Item'], { required: true }),
  ingredient: t(['Ingredient', 'Component', 'Product', 'Inventory Item', 'Item Description'], { required: true }),
  qty: t(['Quantity', 'Qty', 'Amount', 'Portion', 'Recipe Qty'], { type: 'number' }),
  unit: t(['Unit', 'UOM', 'UofM', 'Recipe Unit', 'Measure']),
  yield_pct: t(['Yield %', 'Yield', 'Yield Percent', 'Usable %'], { type: 'number' }),
  menu_price: t(['Menu Price', 'Price', 'Sell Price', 'Selling Price'], { type: 'money' }),
  category: t(['Category', 'Menu Category', 'Menu Group', 'Recipe Category']),
});

// ---------------------------------------------------- inventory counts ----

export const COUNT_FIELDS = Object.freeze({
  item: t(['Item', 'Inventory Item', 'Product', 'Item Name', 'Description'], { required: true }),
  count_date: t(['Count Date', 'Date', 'Period End', 'Counted On'], { type: 'date' }),
  counted_qty: t(['Count Qty', 'Counted', 'Count', 'Quantity Counted', 'On Hand', 'Qty'], { type: 'number' }),
  unit: t(['Count UofM', 'Unit', 'UOM', 'UofM', 'Count Unit']),
  unit_cost: t(['Unit Cost', 'Cost', 'Last Cost', 'Price', 'Avg Cost'], { type: 'money' }),
  expected_qty: t(['Expected', 'Theoretical', 'Expected Qty', 'Theoretical Qty', 'System Qty', 'Book Qty'], { type: 'number' }),
  location: t(['Location', 'Store', 'Restaurant', 'Unit']),
  area: t(['Storage Area', 'Area', 'Storage Location', 'Shelf', 'Zone']),
  category: t(['Category', 'Item Category', 'Accounting Category', 'Class']),
});

export const COUNT_PROFILES = Object.freeze([
  exportProfile('r365_inventory_count', { item: 'Item', unit: 'Count UofM', counted_qty: 'Count Qty', unit_cost: 'Unit Cost', location: 'Location', count_date: 'Count Date', area: 'Storage Location' }),
]);

// ----------------------------------------------------- timecards, shifts ----

export const PUNCH_FIELDS = Object.freeze({
  employee: t(['Employee', 'Employee Name', 'Team Member', 'Name', 'Staff', 'Staff Name'], { required: true, personal: true }),
  employee_id: t(['Employee Id', 'Employee ID', 'Employee Number', 'Emp #', 'Payroll ID', 'Staff ID']),
  role: t(['Job Title', 'Role', 'Job', 'Position', 'Department', 'Job Code']),
  location: t(['Location', 'Store', 'Restaurant', 'Unit']),
  clock_in: t(['In Date', 'Clock In', 'Clock in', 'Clock-in', 'Start', 'Time In', 'Punch In'], { type: 'datetime' }),
  clock_out: t(['Out Date', 'Clock Out', 'Clock out', 'Clock-out', 'End', 'Time Out', 'Punch Out'], { type: 'datetime' }),
  hours: t(['Payable Hours', 'Total Hours', 'Total hours', 'Hours', 'Total Paid Hours', 'Paid Hours'], { type: 'number' }),
  break_minutes: t(['Break Minutes', 'Break length', 'Unpaid Break Minutes', 'Break (min)', 'Break'], { type: 'number' }),
  rate: t(['Wage', 'Wage rate', 'Hourly Rate', 'Rate', 'Pay Rate'], { type: 'money' }),
  cash_tips: t(['Cash Tips Declared', 'Declared Cash Tips', 'Cash tips', 'Cash Tips'], { type: 'money' }),
  card_tips: t(['Non Cash Tips', 'Credit tips', 'Card Tips', 'Transaction Tips', 'Credit Card Tips', 'Charged Tips'], { type: 'money' }),
  age: t(['Age', 'Employee Age'], { type: 'number' }),
});

export const PUNCH_PROFILES = Object.freeze([
  exportProfile('toast_time_entries', { employee: 'Employee', employee_id: 'Employee Id', role: 'Job Title', location: 'Location', clock_in: 'In Date', clock_out: 'Out Date', hours: 'Payable Hours', rate: 'Wage', cash_tips: 'Cash Tips Declared', card_tips: 'Non Cash Tips' }),
  exportProfile('square_timecards', { employee: fullName('First Name', 'Last Name'), role: 'Job Title', location: 'Location', clock_in: both('Clock In Date', 'Clock In Time'), clock_out: both('Clock Out Date', 'Clock Out Time'), hours: 'Total Paid Hours', rate: 'Wage', cash_tips: 'Declared Cash Tips', card_tips: 'Transaction Tips' }),
  exportProfile('seven_shifts_worked_hours', { employee: 'Employee', role: 'Role', location: 'Location', clock_in: 'Clock In', clock_out: 'Clock Out', hours: 'Total Hours', rate: 'Wage' }),
  exportProfile('homebase_timesheets', { employee: 'Employee', role: 'Role', location: 'Location', clock_in: 'Clock in', clock_out: 'Clock out', break_minutes: 'Break length', hours: 'Total hours', rate: 'Wage rate', cash_tips: 'Cash tips', card_tips: 'Credit tips' }),
]);

export const SHIFT_FIELDS = Object.freeze({
  employee: t(['Employee', 'Employee Name', 'Team Member', 'Name', 'Staff'], { required: true, personal: true }),
  role: t(['Role', 'Job Title', 'Position', 'Job', 'Department']),
  location: t(['Location', 'Store', 'Restaurant', 'Unit']),
  start: t(['Shift Start', 'Start', 'Scheduled Start', 'Start Time', 'From'], { type: 'datetime' }),
  end: t(['Shift End', 'End', 'Scheduled End', 'End Time', 'To'], { type: 'datetime' }),
});

export const SHIFT_PROFILES = Object.freeze([
  exportProfile('seven_shifts_schedule', { employee: 'Employee', role: 'Role', location: 'Location', start: 'Shift Start', end: 'Shift End' }),
]);

// ------------------------------------------- check lines: voids, comps ----

export const CHECK_LINE_FIELDS = Object.freeze({
  check: t(['Check #', 'Check Number', 'Check', 'Ticket', 'Order #', 'Order Number', 'Check Id'], { required: true }),
  date: t(['Business Date', 'Date', 'Void Date', 'Order Date'], { type: 'date' }),
  time: t(['Time', 'Void Time', 'Event Time', 'Timestamp']),
  employee: t(['Server', 'Employee', 'User', 'Void User', 'Staff', 'Team Member'], { personal: true }),
  approver: t(['Approver', 'Manager', 'Approved By', 'Void Approver', 'Authorized By'], { personal: true }),
  type: t(['Type', 'Action', 'Event Type', 'Adjustment Type']),
  item: t(['Item', 'Menu Item', 'Item Name', 'Discount Name', 'Promo']),
  amount: t(['Amount', 'Void Amount', 'Comp Amount', 'Discount Amount', 'Value'], { type: 'money' }),
  reason: t(['Reason', 'Void Reason', 'Comp Reason', 'Note', 'Comment']),
  location: t(['Location', 'Store', 'Restaurant', 'Unit']),
  check_total: t(['Check Total', 'Order Total', 'Check Amount', 'Subtotal'], { type: 'money' }),
  closed_at: t(['Closed', 'Closed At', 'Paid', 'Paid Date', 'Check Closed'], { type: 'datetime' }),
});

export const CHECK_LINE_PROFILES = Object.freeze([
  exportProfile('toast_void_details', { check: 'Check #', date: 'Business Date', time: 'Time', employee: 'Server', approver: 'Approver', type: 'Type', item: 'Item', amount: 'Amount', reason: 'Reason', location: 'Location' }),
]);

// --------------------------------------------------------- delivery apps ----

export const DELIVERY_ORDER_FIELDS = Object.freeze({
  order_id: t(['DoorDash order ID', 'Order ID', 'order_number', 'Order Number', 'Order #', 'External Order ID'], { required: true }),
  platform: t(['Platform', 'Channel', 'Marketplace', 'Source', 'Provider']),
  date: t(['Order Date', 'Date', 'transaction_date', 'Timestamp local date', 'Order Placed'], { type: 'date' }),
  location: t(['Store name', 'Restaurant', 'Store', 'Location', 'restaurant']),
  type: t(['Transaction type', 'Type', 'transaction_type', 'Order Status']),
  subtotal: t(['Subtotal', 'Sales (excl. tax)', 'subtotal', 'Food Sales', 'Order Subtotal'], { type: 'money' }),
  tax: t(['Subtotal tax passed to merchant', 'Tax on sales', 'tax', 'Tax', 'Sales Tax'], { type: 'money' }),
  commission: t(['Commission', 'Marketplace fee', 'commission', 'Service Fee', 'Delivery commission', 'delivery_commission'], { type: 'money' }),
  processing_fee: t(['Payment processing fee', 'Processing fee', 'processing_fee', 'Card fee'], { type: 'money' }),
  marketing_fee: t(['Marketing fees', 'Marketing fee', 'Ad spend', 'Ads', 'Sponsored listing'], { type: 'money' }),
  promo_funded: t(['Customer discounts from marketing (funded by you)', 'Promotions on items', 'Marketing adjustment', 'targeted_promotion', 'Promotion funded by restaurant', 'Merchant-funded discount'], { type: 'money' }),
  refund: t(['Error charges', 'Refunds', 'Refund', 'Order error adjustments', 'Customer refunds', 'refund'], { type: 'money' }),
  adjustment: t(['Adjustments', 'Adjustment', 'Other payments', 'Misc adjustment'], { type: 'money' }),
  payout: t(['Net total', 'Total payout', 'merchant_net_total', 'Net payout', 'Payout'], { type: 'money' }),
  payout_id: t(['Payout ID', 'Payout id', 'Transfer ID', 'deposit_id']),
  payout_date: t(['Payout date', 'Payout Date', 'Deposit date', 'deposit_date'], { type: 'date' }),
});

export const DELIVERY_ORDER_PROFILES = Object.freeze([
  exportProfile('doordash_transactions', { order_id: 'DoorDash order ID', platform: { value: 'DoorDash' }, location: 'Store name', type: 'Transaction type', subtotal: 'Subtotal', tax: 'Subtotal tax passed to merchant', commission: 'Commission', processing_fee: 'Payment processing fee', marketing_fee: 'Marketing fees', promo_funded: 'Customer discounts from marketing (funded by you)', refund: 'Error charges', adjustment: 'Adjustments', payout: 'Net total', payout_id: 'Payout ID', payout_date: 'Payout date' }),
  exportProfile('ubereats_payment_details', { order_id: 'Order ID', platform: { value: 'Uber Eats' }, location: 'Restaurant', subtotal: 'Sales (excl. tax)', tax: 'Tax on sales', commission: 'Marketplace fee', promo_funded: 'Promotions on items', marketing_fee: 'Ad spend', refund: 'Order error adjustments', adjustment: 'Other payments', payout: 'Total payout', date: 'Order Date' }),
  exportProfile('grubhub_transactions', { order_id: 'order_number', platform: { value: 'Grubhub' }, location: 'restaurant', date: 'transaction_date', type: 'transaction_type', subtotal: 'subtotal', tax: 'tax', commission: 'commission', processing_fee: 'processing_fee', promo_funded: 'targeted_promotion', refund: 'refund', payout: 'merchant_net_total', payout_id: 'deposit_id', payout_date: 'deposit_date' }),
]);

// ---------------------------------------------------------- reservations ----

export const RESERVATION_FIELDS = Object.freeze({
  reservation_id: t(['Reservation ID', 'Confirmation', 'Confirmation Number', 'Booking ID', 'Res ID']),
  guest: t(['Guest Name', 'Guest', 'Name', 'Customer', 'Booked By'], { personal: true }),
  phone: t(['Phone', 'Phone Number', 'Mobile', 'Guest Phone'], { personal: true }),
  email: t(['Email', 'Guest Email', 'E-mail'], { personal: true }),
  date: t(['Visit Date', 'Date', 'Reservation Date', 'Booking Date'], { type: 'date', required: true }),
  time: t(['Visit Time', 'Time', 'Reservation Time']),
  party_size: t(['Party Size', 'Covers', 'Guests', 'Party', 'Size'], { type: 'number' }),
  status: t(['Status', 'Reservation Status', 'Visit Status', 'State']),
  deposit: t(['Deposit', 'Deposit Amount', 'Prepayment', 'Card Hold'], { type: 'money' }),
  fee_charged: t(['No-show Fee', 'Cancellation Fee', 'Fee Charged', 'Penalty'], { type: 'money' }),
  source: t(['Source', 'Channel', 'Booked Via', 'Origin']),
  location: t(['Location', 'Restaurant', 'Venue', 'Store']),
});

export const RESERVATION_PROFILES = Object.freeze([
  exportProfile('opentable_reservations', { reservation_id: 'Confirmation Number', guest: 'Guest Name', phone: 'Phone', email: 'Email', date: 'Visit Date', time: 'Visit Time', party_size: 'Party Size', status: 'Status', source: 'Source' }),
  exportProfile('resy_reservations', { reservation_id: 'Reservation ID', guest: 'Guest', phone: 'Phone', email: 'Email', date: 'Date', time: 'Time', party_size: 'Party Size', status: 'Status', source: 'Source' }),
]);

/** Every shared vocabulary, for the README and the column checks. */
export const RESTAURANT_SOURCE_FIELDS = Object.freeze({ item_sales: ITEM_SALES_FIELDS, invoice_lines: INVOICE_LINE_FIELDS, recipes: RECIPE_FIELDS, counts: COUNT_FIELDS, punches: PUNCH_FIELDS, shifts: SHIFT_FIELDS, check_lines: CHECK_LINE_FIELDS, delivery_orders: DELIVERY_ORDER_FIELDS, reservations: RESERVATION_FIELDS });
