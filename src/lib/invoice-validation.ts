import { InvoiceData, ValidationWarning, LineItem } from '../types/invoice';

// Indian GSTIN format regex: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit/letter + Z + 1 check digit
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function validateGstin(gstin: string | null | undefined): { isValid: boolean; stateCode?: string; message?: string } {
  if (!gstin) return { isValid: false, message: 'GSTIN is not provided' };
  const cleaned = gstin.trim().toUpperCase();
  if (cleaned.length !== 15) {
    return { isValid: false, message: `GSTIN must be 15 characters (currently ${cleaned.length})` };
  }
  if (!GSTIN_REGEX.test(cleaned)) {
    return { isValid: false, message: 'Invalid GSTIN structure (expected: 2-digit state + 10-char PAN + 1 entity + Z + check digit)' };
  }
  return { isValid: true, stateCode: cleaned.slice(0, 2) };
}

export function validateInvoiceFinances(invoice: Partial<InvoiceData>): {
  warnings: ValidationWarning[];
  needsReview: boolean;
  calculatedSubtotal: number;
  calculatedTaxTotal: number;
  calculatedGrandTotal: number;
} {
  const warnings: ValidationWarning[] = [];
  let needsReview = false;

  const subtotal = invoice.subtotal || 0;
  const cgst = invoice.cgst || 0;
  const sgst = invoice.sgst || 0;
  const igst = invoice.igst || 0;
  const otherTaxes = invoice.otherTaxes || 0;
  const discount = invoice.discount || 0;
  const totalAmount = invoice.totalAmount || 0;
  const lineItems = invoice.lineItems || [];

  // 1. Mandatory Core Fields Check
  if (!invoice.vendorName || invoice.vendorName.trim() === '' || invoice.vendorName.toLowerCase() === 'unknown vendor') {
    warnings.push({
      code: 'MISSING_VENDOR',
      field: 'vendorName',
      message: 'Vendor / Supplier name was not detected or is unclear.',
      severity: 'error',
    });
    needsReview = true;
  }

  if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
    warnings.push({
      code: 'MISSING_INVOICE_NUM',
      field: 'invoiceNumber',
      message: 'Invoice number was not found on document.',
      severity: 'warning',
    });
    needsReview = true;
  }

  // 2. GSTIN Validation
  if (invoice.supplierGstin) {
    const supplierCheck = validateGstin(invoice.supplierGstin);
    if (!supplierCheck.isValid) {
      warnings.push({
        code: 'INVALID_SUPPLIER_GSTIN',
        field: 'supplierGstin',
        message: `Supplier GSTIN format error: ${supplierCheck.message}`,
        severity: 'warning',
        documentValue: invoice.supplierGstin,
      });
      needsReview = true;
    }
  } else {
    warnings.push({
      code: 'NO_SUPPLIER_GSTIN',
      field: 'supplierGstin',
      message: 'No Supplier GSTIN found. Document may be a non-GST bill or unregistered vendor.',
      severity: 'info',
    });
  }

  if (invoice.customerGstin) {
    const custCheck = validateGstin(invoice.customerGstin);
    if (!custCheck.isValid) {
      warnings.push({
        code: 'INVALID_CUSTOMER_GSTIN',
        field: 'customerGstin',
        message: `Buyer GSTIN format error: ${custCheck.message}`,
        severity: 'warning',
        documentValue: invoice.customerGstin,
      });
    }
  }

  // 3. GST Tax Structure Check (Intra-state vs Inter-state)
  const isCgstPresent = cgst > 0;
  const isSgstPresent = sgst > 0;
  const isIgstPresent = igst > 0;

  if (isCgstPresent && isIgstPresent) {
    warnings.push({
      code: 'MIXED_GST_TYPES',
      field: 'igst',
      message: 'Both CGST/SGST and IGST are charged together. In Indian GST, transactions are either Intra-state (CGST+SGST) or Inter-state (IGST).',
      severity: 'warning',
    });
    needsReview = true;
  }

  if (isCgstPresent !== isSgstPresent && !isIgstPresent) {
    // Only one of CGST/SGST is present
    warnings.push({
      code: 'UNBALANCED_CGST_SGST',
      field: 'cgst',
      message: `CGST (₹${cgst.toFixed(2)}) and SGST (₹${sgst.toFixed(2)}) should generally be equal in Intra-state supply.`,
      severity: 'warning',
    });
    needsReview = true;
  }

  // If both GSTINs are provided, compare state codes
  if (invoice.supplierGstin && invoice.customerGstin) {
    const sState = invoice.supplierGstin.trim().slice(0, 2);
    const cState = invoice.customerGstin.trim().slice(0, 2);
    if (sState && cState) {
      if (sState === cState && isIgstPresent && !isCgstPresent) {
        warnings.push({
          code: 'GST_STATE_MISMATCH_IGST',
          field: 'igst',
          message: `Supplier and Buyer are both in state ${sState} (Intra-state), but IGST was charged instead of CGST+SGST.`,
          severity: 'warning',
        });
        needsReview = true;
      } else if (sState !== cState && (isCgstPresent || isSgstPresent) && !isIgstPresent) {
        warnings.push({
          code: 'GST_STATE_MISMATCH_CGST',
          field: 'cgst',
          message: `Supplier (State ${sState}) and Buyer (State ${cState}) are in different states (Inter-state), but CGST/SGST was charged instead of IGST.`,
          severity: 'warning',
        });
        needsReview = true;
      }
    }
  }

  // 4. Line Items Consistency
  let sumLineTotals = 0;
  lineItems.forEach((item, index) => {
    sumLineTotals += item.lineTotal;
    
    // Check quantity * price consistency if provided
    if (item.quantity > 0 && item.unitPrice > 0) {
      const baseProduct = item.quantity * item.unitPrice;
      const expectedTotal = baseProduct - (item.discount || 0) + (item.taxAmount || 0);
      const diff = Math.abs(expectedTotal - item.lineTotal);
      if (diff > 1.5 && Math.abs(baseProduct - item.lineTotal) > 1.5) {
        warnings.push({
          code: `LINE_ITEM_MATH_${index}`,
          field: `lineItems[${index}]`,
          message: `Item #${index + 1} "${item.description}": Qty (${item.quantity}) × Rate (${item.unitPrice}) != Line Total (${item.lineTotal})`,
          severity: 'info',
          calculatedValue: expectedTotal,
          documentValue: item.lineTotal,
        });
      }
    }
  });

  if (lineItems.length > 0 && subtotal > 0) {
    const lineSubtotalDiff = Math.abs(sumLineTotals - subtotal);
    if (lineSubtotalDiff > 2.0) {
      warnings.push({
        code: 'LINE_SUM_SUBTOTAL_MISMATCH',
        field: 'subtotal',
        message: `Sum of line items (₹${sumLineTotals.toFixed(2)}) does not match document subtotal (₹${subtotal.toFixed(2)}). Difference: ₹${lineSubtotalDiff.toFixed(2)}`,
        severity: 'warning',
        calculatedValue: sumLineTotals,
        documentValue: subtotal,
      });
      needsReview = true;
    }
  }

  // 5. Total Financial Equation Check
  const totalTaxes = cgst + sgst + igst + otherTaxes;
  const calculatedGrandTotal = subtotal + totalTaxes - discount;
  const totalDifference = Math.abs(calculatedGrandTotal - totalAmount);

  if (totalAmount <= 0) {
    warnings.push({
      code: 'ZERO_OR_MISSING_TOTAL',
      field: 'totalAmount',
      message: 'Total invoice amount is zero or missing.',
      severity: 'error',
      calculatedValue: calculatedGrandTotal,
      documentValue: totalAmount,
    });
    needsReview = true;
  } else if (totalDifference > 2.0 && subtotal > 0) {
    warnings.push({
      code: 'TOTAL_CALCULATION_DISCREPANCY',
      field: 'totalAmount',
      message: `Financial total mismatch: Subtotal (₹${subtotal.toFixed(2)}) + Taxes (₹${totalTaxes.toFixed(2)}) - Discount (₹${discount.toFixed(2)}) = ₹${calculatedGrandTotal.toFixed(2)}, but document total is ₹${totalAmount.toFixed(2)}. Difference: ₹${totalDifference.toFixed(2)}.`,
      severity: 'warning',
      calculatedValue: calculatedGrandTotal,
      documentValue: totalAmount,
    });
    needsReview = true;
  }

  // 6. Date validation
  if (invoice.invoiceDate) {
    const parsedDate = new Date(invoice.invoiceDate);
    const now = new Date();
    // Allow slight buffer for timezone difference
    const bufferDays = 2 * 24 * 60 * 60 * 1000;
    if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() > (now.getTime() + bufferDays)) {
      warnings.push({
        code: 'FUTURE_INVOICE_DATE',
        field: 'invoiceDate',
        message: `Invoice date (${invoice.invoiceDate}) appears to be in the future.`,
        severity: 'info',
      });
    }
  }

  return {
    warnings,
    needsReview,
    calculatedSubtotal: sumLineTotals > 0 ? sumLineTotals : subtotal,
    calculatedTaxTotal: totalTaxes,
    calculatedGrandTotal,
  };
}

export function autoRecalculateInvoice(invoice: InvoiceData): InvoiceData {
  let newSubtotal = 0;
  const updatedLineItems = invoice.lineItems.map(item => {
    // If line total is 0 or inconsistent, compute from quantity * unitPrice
    let lineTotal = item.lineTotal;
    if (lineTotal === 0 && item.quantity > 0 && item.unitPrice > 0) {
      lineTotal = item.quantity * item.unitPrice - (item.discount || 0) + (item.taxAmount || 0);
    }
    newSubtotal += lineTotal;
    return { ...item, lineTotal: Math.round(lineTotal * 100) / 100 };
  });

  const finalSubtotal = updatedLineItems.length > 0 && newSubtotal > 0 ? Math.round(newSubtotal * 100) / 100 : invoice.subtotal;
  const taxes = (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0) + (invoice.otherTaxes || 0);
  const discount = invoice.discount || 0;
  const newTotal = Math.max(0, Math.round((finalSubtotal + taxes - discount) * 100) / 100);

  const updated: InvoiceData = {
    ...invoice,
    subtotal: finalSubtotal,
    lineItems: updatedLineItems,
    totalAmount: newTotal,
    balanceDue: (invoice.amountPaid !== null && invoice.amountPaid !== undefined) 
      ? Math.max(0, Math.round((newTotal - invoice.amountPaid) * 100) / 100)
      : newTotal,
    updatedAt: new Date().toISOString(),
  };

  const validation = validateInvoiceFinances(updated);
  return {
    ...updated,
    validationWarnings: validation.warnings,
    needsReview: validation.needsReview,
  };
}
