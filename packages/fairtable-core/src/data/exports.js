// Catalogue of export files from point-of-sale, scheduling, invoice-processing,
// distributor, delivery-app and reservation systems that the Fairtable agents
// recognise.
//
// Each entry says how to recognise the file (column names that must be there).
// An agent turns an entry into a profile by adding its own column map:
//
//   exportProfile('toast_item_selection_details', { item: 'Menu Item', qty: 'Qty' })
//
// basis:
//   'documented'  the column names were checked against the vendor's own
//                 documentation (source and date given);
//   'recalled'    the layout was written from knowledge of the export and was
//                 not checked against documentation or a live account.
// Every entry here is 'recalled'. None was tested against a live account. When a
// header differs, the file still maps by each column's "also called" list,
// `inspect` shows what was matched, and fairtable-sources.json names the columns by hand.

const e = (id, system, label, signature, extra = {}) => Object.freeze({ id, system, label, signature, basis: 'recalled', ...extra });

export const EXPORTS = Object.freeze(Object.fromEntries([
  // Point of sale
  e('toast_item_selection_details', 'Toast', 'ItemSelectionDetails export (one row per item sold)', ['Item Selection Id', 'Menu Item', 'Qty', 'Net Price']),
  e('toast_time_entries', 'Toast', 'TimeEntries export (one row per clock-in)', ['Employee', 'Job Title', 'In Date', 'Out Date', 'Payable Hours']),
  e('toast_payment_details', 'Toast', 'PaymentDetails export (one row per payment)', ['Payment Id', 'Paid Date', 'Cash Drawer', 'Amount']),
  e('toast_void_details', 'Toast', 'Void and discount details export (one row per check line)', ['Check #', 'Server', 'Reason', 'Approver']),
  e('square_item_sales', 'Square', 'Items > Item Sales export (CSV)', ['Item', 'Qty', 'Gross Sales', 'Net Sales', 'Transaction ID']),
  e('square_timecards', 'Square', 'Team > Timecards export (CSV)', ['Clock In Date', 'Clock In Time', 'Clock Out Date', 'Clock Out Time']),
  e('clover_item_sales', 'Clover', 'Reports > Sales > Items export', ['Item Name', 'Items Sold', 'Item Revenue']),
  e('lightspeed_product_sales', 'Lightspeed Restaurant', 'Product sales report export', ['Product', 'Quantity', 'Total incl. tax']),
  e('revel_product_mix', 'Revel Systems', 'Product Mix report export', ['Product Name', 'Quantity Sold', 'Net Sales']),
  // Scheduling and time
  e('seven_shifts_worked_hours', '7shifts', 'Worked hours and wages export', ['Employee', 'Role', 'Clock In', 'Clock Out', 'Total Hours']),
  e('seven_shifts_schedule', '7shifts', 'Schedule export (one row per shift)', ['Employee', 'Role', 'Shift Start', 'Shift End']),
  e('homebase_timesheets', 'Homebase', 'Timesheets export', ['Employee', 'Clock in', 'Clock out', 'Break length']),
  // Invoices and inventory
  e('marginedge_invoice_lines', 'MarginEdge', 'Invoice line items export', ['Vendor', 'Invoice Number', 'Vendor Item Code', 'Product', 'Unit Price']),
  e('r365_ap_invoice_detail', 'Restaurant365', 'AP invoice detail export', ['Vendor', 'Invoice Number', 'Item Number', 'UofM', 'Extended Price']),
  e('xtrachef_invoice_details', 'xtraCHEF by Toast', 'Invoice details export', ['Vendor Name', 'Invoice Number', 'Item Code', 'Item Description', 'Pack/Size']),
  e('sysco_invoice_csv', 'Sysco', 'Invoice download (CSV)', ['SUPC', 'Pack', 'Size', 'Qty Shipped']),
  e('usfoods_invoice_csv', 'US Foods', 'Invoice download (CSV)', ['Product Number', 'Product Description', 'Pack Size', 'Quantity Shipped']),
  e('r365_inventory_count', 'Restaurant365', 'Inventory count export', ['Item', 'Count UofM', 'Count Qty']),
  // Delivery apps
  e('doordash_transactions', 'DoorDash Merchant Portal', 'Financials > Transactions export', ['DoorDash order ID', 'Subtotal', 'Commission', 'Net total']),
  e('ubereats_payment_details', 'Uber Eats Manager', 'Payment details report', ['Order ID', 'Sales (excl. tax)', 'Marketplace fee', 'Total payout']),
  e('grubhub_transactions', 'Grubhub for Restaurants', 'Transactions export', ['order_number', 'subtotal', 'commission', 'merchant_net_total']),
  // Reservations
  e('opentable_reservations', 'OpenTable', 'Reservations / guest visits export', ['Visit Date', 'Party Size', 'Status', 'Guest Name']),
  e('resy_reservations', 'Resy', 'Reservations export', ['Date', 'Time', 'Party Size', 'Status', 'Guest', 'Table']),
].map((x) => [x.id, x])));

export const EXPORTS_BASIS_NOTE = 'Where a layout says "checked", its column names were compared with the vendor\'s documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.';
