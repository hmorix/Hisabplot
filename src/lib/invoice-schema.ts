import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '../types/invoice';

/**
 * Coerce string or number into a clean float or 0
 */
const numericCoerce = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    // Strip ₹, Rs, Rs., commas, spaces, currency symbols
    const cleaned = val.replace(/[₹$,A-Za-z\s]/g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}, z.number().nullable().optional());

const nonNullableNumericCoerce = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[₹$,A-Za-z\s]/g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}, z.number());

export const LineItemZodSchema = z.object({
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  description: z.string().min(1, 'Item description is required').default('Item'),
  hsnCode: z.string().nullable().optional(),
  quantity: nonNullableNumericCoerce.default(1),
  unitPrice: nonNullableNumericCoerce.default(0),
  discount: numericCoerce,
  taxRate: numericCoerce,
  taxAmount: numericCoerce,
  lineTotal: nonNullableNumericCoerce.default(0),
});

export const RawExtractionZodSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required').default('Unknown Vendor'),
  vendorAddress: z.string().nullable().optional(),
  vendorPhone: z.string().nullable().optional(),
  vendorEmail: z.string().nullable().optional(),
  supplierGstin: z.string().nullable().optional(),

  customerName: z.string().nullable().optional(),
  customerAddress: z.string().nullable().optional(),
  customerGstin: z.string().nullable().optional(),

  invoiceNumber: z.string().min(1, 'Invoice number is required').default(() => `INV-${Date.now().toString().slice(-6)}`),
  invoiceDate: z.string().default(() => new Date().toISOString().split('T')[0]),
  dueDate: z.string().nullable().optional(),
  placeOfSupply: z.string().nullable().optional(),
  currency: z.string().default('INR'),
  paymentMethod: z.string().nullable().optional(),
  expenseCategory: z.string().optional().default('Other Expense'),

  subtotal: nonNullableNumericCoerce.default(0),
  cgst: numericCoerce,
  sgst: numericCoerce,
  igst: numericCoerce,
  otherTaxes: numericCoerce,
  discount: numericCoerce,
  totalAmount: nonNullableNumericCoerce.default(0),
  amountPaid: numericCoerce,
  balanceDue: numericCoerce,

  lineItems: z.array(LineItemZodSchema).default([]),
  rawNotes: z.string().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional().default('medium'),
});

export type RawExtractionInput = z.infer<typeof RawExtractionZodSchema>;

/**
 * Normalizes category to one of our designated standard ExpenseCategory types
 */
export function normalizeCategory(categoryStr?: string | null): any {
  if (!categoryStr) return 'Other Expense';
  const match = EXPENSE_CATEGORIES.find(
    (c) => c.toLowerCase() === categoryStr.toLowerCase() ||
           categoryStr.toLowerCase().includes(c.toLowerCase().split(' ')[0])
  );
  return match || 'Other Expense';
}
