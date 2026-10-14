import * as XLSX from 'xlsx';
import { InvoiceData } from '../types/invoice';

/**
 * Generates an Excel workbook (.xlsx) containing:
 * 1. "Invoices Overview" sheet
 * 2. "Line Items Breakdown" sheet
 */
export function exportInvoicesToExcel(invoices: InvoiceData[], filenamePrefix = 'HisabPilot_Invoices'): void {
  const wb = XLSX.utils.book_new();

  // 1. Overview Sheet Data
  const overviewData = invoices.map((inv, idx) => ({
    'S.No': idx + 1,
    'Invoice Number': inv.invoiceNumber,
    'Invoice Date': inv.invoiceDate,
    'Due Date': inv.dueDate || '-',
    'Vendor / Supplier': inv.vendorName,
    'Supplier GSTIN': inv.supplierGstin || 'Unregistered / Non-GST',
    'Customer / Buyer': inv.customerName || '-',
    'Customer GSTIN': inv.customerGstin || '-',
    'Place of Supply': inv.placeOfSupply || '-',
    'Expense Category': inv.expenseCategory,
    'Payment Method': inv.paymentMethod || '-',
    'Subtotal (INR)': inv.subtotal,
    'CGST (INR)': inv.cgst || 0,
    'SGST (INR)': inv.sgst || 0,
    'IGST (INR)': inv.igst || 0,
    'Other Taxes/Fees': inv.otherTaxes || 0,
    'Discount (INR)': inv.discount || 0,
    'Total Amount (INR)': inv.totalAmount,
    'Amount Paid': inv.amountPaid || 0,
    'Balance Due': inv.balanceDue || 0,
    'Verification Status': inv.userVerified ? 'Verified by User' : (inv.needsReview ? 'Needs Review' : 'Auto-Parsed'),
    'Validation Warnings': (inv.validationWarnings || []).map(w => w.message).join('; ') || 'None',
  }));

  const overviewWs = XLSX.utils.json_to_sheet(overviewData);

  // Set column widths for readability
  overviewWs['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 20 }, // Invoice No
    { wch: 12 }, // Date
    { wch: 12 }, // Due Date
    { wch: 30 }, // Vendor
    { wch: 18 }, // Supplier GSTIN
    { wch: 25 }, // Customer
    { wch: 18 }, // Customer GSTIN
    { wch: 16 }, // Place of Supply
    { wch: 22 }, // Category
    { wch: 16 }, // Payment Method
    { wch: 14 }, // Subtotal
    { wch: 12 }, // CGST
    { wch: 12 }, // SGST
    { wch: 12 }, // IGST
    { wch: 14 }, // Other Taxes
    { wch: 14 }, // Discount
    { wch: 16 }, // Total
    { wch: 14 }, // Paid
    { wch: 14 }, // Balance
    { wch: 18 }, // Status
    { wch: 45 }, // Warnings
  ];

  XLSX.utils.book_append_sheet(wb, overviewWs, 'Invoices Overview');

  // 2. Line Items Sheet Data
  const lineItemsData: Record<string, any>[] = [];
  invoices.forEach((inv) => {
    if (!inv.lineItems || inv.lineItems.length === 0) {
      lineItemsData.push({
        'Invoice Number': inv.invoiceNumber,
        'Invoice Date': inv.invoiceDate,
        'Vendor': inv.vendorName,
        'Item Description': 'No individual line items parsed',
        'HSN / SAC Code': '-',
        'Quantity': 1,
        'Unit Price': inv.subtotal,
        'Discount': inv.discount || 0,
        'Tax Rate %': '-',
        'Tax Amount': (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0),
        'Line Total (INR)': inv.totalAmount,
      });
    } else {
      inv.lineItems.forEach((item, itemIdx) => {
        lineItemsData.push({
          'Invoice Number': inv.invoiceNumber,
          'Invoice Date': inv.invoiceDate,
          'Vendor': inv.vendorName,
          'Item #': itemIdx + 1,
          'Item Description': item.description,
          'HSN / SAC Code': item.hsnCode || '-',
          'Quantity': item.quantity,
          'Unit Price': item.unitPrice,
          'Discount': item.discount || 0,
          'Tax Rate %': item.taxRate ? `${item.taxRate}%` : '-',
          'Tax Amount': item.taxAmount || 0,
          'Line Total (INR)': item.lineTotal,
        });
      });
    }
  });

  const lineItemsWs = XLSX.utils.json_to_sheet(lineItemsData);
  lineItemsWs['!cols'] = [
    { wch: 20 }, // Invoice No
    { wch: 12 }, // Date
    { wch: 25 }, // Vendor
    { wch: 8 },  // Item #
    { wch: 35 }, // Description
    { wch: 14 }, // HSN
    { wch: 10 }, // Quantity
    { wch: 12 }, // Unit Price
    { wch: 10 }, // Discount
    { wch: 12 }, // Tax Rate %
    { wch: 12 }, // Tax Amount
    { wch: 14 }, // Line Total
  ];

  XLSX.utils.book_append_sheet(wb, lineItemsWs, 'Line Items Breakdown');

  // Write file to user's browser
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  XLSX.writeFile(wb, `${filenamePrefix}_${timestamp}.xlsx`);
}

/**
 * Generates and downloads a clean CSV file
 */
export function exportInvoicesToCsv(invoices: InvoiceData[], filenamePrefix = 'HisabPilot_Invoices'): void {
  const headers = [
    'Invoice Number',
    'Date',
    'Vendor Name',
    'Supplier GSTIN',
    'Customer Name',
    'Customer GSTIN',
    'Category',
    'Subtotal',
    'CGST',
    'SGST',
    'IGST',
    'Total Amount',
    'Payment Method',
    'Status',
  ];

  const rows = invoices.map(inv => [
    `"${(inv.invoiceNumber || '').replace(/"/g, '""')}"`,
    `"${inv.invoiceDate || ''}"`,
    `"${(inv.vendorName || '').replace(/"/g, '""')}"`,
    `"${(inv.supplierGstin || '').replace(/"/g, '""')}"`,
    `"${(inv.customerName || '').replace(/"/g, '""')}"`,
    `"${(inv.customerGstin || '').replace(/"/g, '""')}"`,
    `"${inv.expenseCategory}"`,
    inv.subtotal.toFixed(2),
    (inv.cgst || 0).toFixed(2),
    (inv.sgst || 0).toFixed(2),
    (inv.igst || 0).toFixed(2),
    inv.totalAmount.toFixed(2),
    `"${(inv.paymentMethod || '').replace(/"/g, '""')}"`,
    `"${inv.userVerified ? 'Verified' : (inv.needsReview ? 'Needs Review' : 'Auto')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads full JSON representation for developer/API audit export
 */
export function exportInvoicesToJson(invoices: InvoiceData[], filenamePrefix = 'HisabPilot_Data'): void {
  const jsonContent = JSON.stringify(invoices, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
