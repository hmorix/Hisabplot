/**
 * HisabPilot - Invoice & Extraction Type Definitions
 */

export type ExpenseCategory =
  | 'Inventory / Stock'
  | 'Office Supplies'
  | 'Logistics & Transport'
  | 'Utilities (Electricity/Water/Internet)'
  | 'Rent & Facility'
  | 'IT & Software Subscriptions'
  | 'Meals & Refreshments'
  | 'Professional & Legal Fees'
  | 'Repairs & Maintenance'
  | 'Capital Equipment'
  | 'Marketing & Advertising'
  | 'Other Expense';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Inventory / Stock',
  'Office Supplies',
  'Logistics & Transport',
  'Utilities (Electricity/Water/Internet)',
  'Rent & Facility',
  'IT & Software Subscriptions',
  'Meals & Refreshments',
  'Professional & Legal Fees',
  'Repairs & Maintenance',
  'Capital Equipment',
  'Marketing & Advertising',
  'Other Expense',
];

export interface LineItem {
  id: string;
  description: string;
  hsnCode?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number | null;
  taxRate?: number | null; // e.g., 5, 12, 18, 28
  taxAmount?: number | null;
  lineTotal: number;
}

export type WarningSeverity = 'error' | 'warning' | 'info';

export interface ValidationWarning {
  code: string;
  field?: string;
  message: string;
  severity: WarningSeverity;
  calculatedValue?: number | string | null;
  documentValue?: number | string | null;
}

export interface InvoiceData {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // Basic Metadata
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  documentPreviewData?: string; // base64 data url for viewing original
  pageCount?: number;

  // Vendor Information
  vendorName: string;
  vendorAddress: string | null;
  vendorPhone?: string | null;
  vendorEmail?: string | null;
  supplierGstin: string | null;

  // Customer Information
  customerName: string | null;
  customerAddress: string | null;
  customerGstin: string | null;

  // Invoice Details
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD or as found
  dueDate: string | null;
  placeOfSupply?: string | null;
  currency: string; // Default 'INR' / '₹'
  paymentMethod: string | null; // 'UPI' | 'Cash' | 'NEFT/RTGS' | 'Card' | 'Cheque' etc.
  expenseCategory: ExpenseCategory;

  // Financial Totals
  subtotal: number;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  otherTaxes: number | null;
  discount: number | null;
  totalAmount: number;
  amountPaid: number | null;
  balanceDue: number | null;

  // Line Items
  lineItems: LineItem[];

  // Validation & Review
  needsReview: boolean;
  validationWarnings: ValidationWarning[];
  userVerified: boolean;
  rawNotes?: string | null;
  modelConfidence?: 'high' | 'medium' | 'low';
}

export interface ExtractionResponse {
  success: boolean;
  invoice?: InvoiceData;
  error?: string;
  errorCode?: string;
  rawResponse?: string;
  warnings?: ValidationWarning[];
  modelUsed?: string;
  processingTimeMs?: number;
}

export interface DashboardStats {
  totalInvoices: number;
  totalSpend: number;
  totalTax: number;
  reviewRequiredCount: number;
  verifiedCount: number;
  categoryBreakdown: Record<string, { count: number; total: number }>;
}
