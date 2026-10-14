import React from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { InvoiceData } from '../types/invoice';
import { formatINR, formatDate } from '../lib/formatters';

interface PrintInvoiceModalProps {
  invoice: InvoiceData | null;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  invoice,
  onClose,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Printable Audit Voucher
            </span>
            <span className="text-xs text-slate-500">
              #{invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-8 sm:p-10 overflow-y-auto font-sans text-slate-800 space-y-6 print:p-0 print:m-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                HisabPilot Verified Paperwork Report
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                {invoice.vendorName}
              </h1>
              {invoice.vendorAddress && (
                <p className="text-xs text-slate-600 max-w-sm mt-1">
                  {invoice.vendorAddress}
                </p>
              )}
              {invoice.supplierGstin && (
                <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                  Supplier GSTIN: {invoice.supplierGstin}
                </p>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {invoice.expenseCategory}
              </span>
              <p className="text-sm font-bold text-slate-900 mt-2 font-mono">
                Invoice #{invoice.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500">
                Date: {formatDate(invoice.invoiceDate)}
              </p>
              {invoice.dueDate && (
                <p className="text-xs text-slate-500">
                  Due: {formatDate(invoice.dueDate)}
                </p>
              )}
            </div>
          </div>

          {/* Customer / Billed To Info */}
          {(invoice.customerName || invoice.customerGstin) && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Billed To:</span>
                <p className="font-bold text-slate-900">{invoice.customerName || 'N/A'}</p>
                {invoice.customerAddress && <p className="text-slate-600">{invoice.customerAddress}</p>}
              </div>
              <div>
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Buyer GSTIN:</span>
                <p className="font-mono font-bold text-slate-900">{invoice.customerGstin || 'Unregistered'}</p>
                {invoice.placeOfSupply && <p className="text-slate-600">Place of Supply: {invoice.placeOfSupply}</p>}
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Itemized Line Items
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">HSN</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Tax %</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        No line items parsed. Subtotal: {formatINR(invoice.subtotal)}
                      </td>
                    </tr>
                  ) : (
                    invoice.lineItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{item.description}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">{item.hsnCode || '-'}</td>
                        <td className="py-2 px-3 text-right font-mono">{item.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatINR(item.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-mono">{item.taxRate ? `${item.taxRate}%` : '-'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{formatINR(item.lineTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Subtotal Before Tax:</span>
                <span className="font-mono font-semibold">{formatINR(invoice.subtotal)}</span>
              </div>
              {invoice.discount ? (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono font-semibold">- {formatINR(invoice.discount)}</span>
                </div>
              ) : null}
              {invoice.cgst ? (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">CGST (Central GST):</span>
                  <span className="font-mono font-semibold">{formatINR(invoice.cgst)}</span>
                </div>
              ) : null}
              {invoice.sgst ? (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">SGST (State GST):</span>
                  <span className="font-mono font-semibold">{formatINR(invoice.sgst)}</span>
                </div>
              ) : null}
              {invoice.igst ? (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">IGST (Inter-state):</span>
                  <span className="font-mono font-semibold">{formatINR(invoice.igst)}</span>
                </div>
              ) : null}
              {invoice.otherTaxes ? (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Other Charges / Cess:</span>
                  <span className="font-mono font-semibold">{formatINR(invoice.otherTaxes)}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold">
                <span>Grand Total:</span>
                <span className="font-mono text-indigo-900">{formatINR(invoice.totalAmount)}</span>
              </div>
              {invoice.amountPaid !== null && invoice.amountPaid !== undefined && (
                <div className="flex justify-between py-1 text-slate-500">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{formatINR(invoice.amountPaid)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Audit Verification Note */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Processed with Google Gemini AI via HisabPilot</span>
            </span>
            <span>Generated on {new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
