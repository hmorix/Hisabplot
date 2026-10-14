import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  Save, 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText,
  Building2,
  Receipt,
  Tag,
  ShieldCheck,
  Eye,
  Info
} from 'lucide-react';
import { InvoiceData, LineItem, EXPENSE_CATEGORIES, ExpenseCategory } from '../types/invoice';
import { validateInvoiceFinances, autoRecalculateInvoice, validateGstin } from '../lib/invoice-validation';
import { formatINR, formatINRPlain } from '../lib/formatters';
import { exportInvoicesToExcel, exportInvoicesToCsv } from '../lib/export';

interface InvoiceEditorProps {
  invoice: InvoiceData;
  onSave: (updated: InvoiceData) => void;
  onBackToUpload: () => void;
  onPrintPreview: (invoice: InvoiceData) => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice: initialInvoice,
  onSave,
  onBackToUpload,
  onPrintPreview,
}) => {
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoice);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'tax'>('details');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Field change handler
  const handleFieldChange = (field: keyof InvoiceData, value: any) => {
    const updated = { ...invoice, [field]: value };
    // Re-run validation
    const audit = validateInvoiceFinances(updated);
    setInvoice({
      ...updated,
      validationWarnings: audit.warnings,
      needsReview: audit.needsReview,
    });
  };

  // Line item change handler
  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...invoice.lineItems];
    const targetItem = { ...updatedItems[index], [field]: value };

    // Auto compute line total if qty or unit price changes
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'taxAmount') {
      const qty = Number(field === 'quantity' ? value : targetItem.quantity) || 0;
      const rate = Number(field === 'unitPrice' ? value : targetItem.unitPrice) || 0;
      const disc = Number(field === 'discount' ? value : targetItem.discount) || 0;
      const tax = Number(field === 'taxAmount' ? value : targetItem.taxAmount) || 0;
      targetItem.lineTotal = Math.max(0, Math.round((qty * rate - disc + tax) * 100) / 100);
    }

    updatedItems[index] = targetItem;
    const updatedInvoice = { ...invoice, lineItems: updatedItems };
    const audit = validateInvoiceFinances(updatedInvoice);
    setInvoice({
      ...updatedInvoice,
      validationWarnings: audit.warnings,
      needsReview: audit.needsReview,
    });
  };

  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `li_${Date.now()}`,
      description: 'New Item',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 18,
      taxAmount: 0,
      lineTotal: 0,
    };
    const updatedInvoice = {
      ...invoice,
      lineItems: [...invoice.lineItems, newItem],
    };
    setInvoice(updatedInvoice);
  };

  const handleDeleteLineItem = (index: number) => {
    const updatedItems = invoice.lineItems.filter((_, i) => i !== index);
    const updatedInvoice = { ...invoice, lineItems: updatedItems };
    const audit = validateInvoiceFinances(updatedInvoice);
    setInvoice({
      ...updatedInvoice,
      validationWarnings: audit.warnings,
      needsReview: audit.needsReview,
    });
  };

  // Auto-recalculate button
  const handleAutoRecalculate = () => {
    const recalculated = autoRecalculateInvoice(invoice);
    setInvoice(recalculated);
  };

  // Save changes
  const handleSaveAndVerify = () => {
    const finalized: InvoiceData = {
      ...invoice,
      userVerified: true,
      needsReview: false, // User explicitly approves
      updatedAt: new Date().toISOString(),
    };
    setInvoice(finalized);
    onSave(finalized);
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 3000);
  };

  const supplierGstinCheck = validateGstin(invoice.supplierGstin);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToUpload}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Process Another Document"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">
                {invoice.vendorName || 'Extracted Invoice'}
              </h2>
              {invoice.needsReview ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Review Required</span>
                </span>
              ) : invoice.userVerified ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>User Verified</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>AI Verified</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoice #{invoice.invoiceNumber} • Dated {invoice.invoiceDate} • Total: {formatINR(invoice.totalAmount)}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoRecalculate}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Automatically compute line items and grand totals"
          >
            <Calculator className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recalculate Math</span>
          </button>

          <button
            type="button"
            onClick={() => onPrintPreview(invoice)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print View</span>
          </button>

          <button
            type="button"
            onClick={() => exportInvoicesToExcel([invoice], `Invoice_${invoice.invoiceNumber}`)}
            className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel XLSX</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndVerify}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{invoice.userVerified ? 'Saved & Verified' : 'Verify & Save'}</span>
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Invoice verified and saved to your history!</span>
        </div>
      )}

      {/* Discrepancies & Warnings Box */}
      {invoice.validationWarnings && invoice.validationWarnings.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-900 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Audit Checks & Discrepancy Alerts ({invoice.validationWarnings.length})</span>
            </div>
            <button
              type="button"
              onClick={handleAutoRecalculate}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
            >
              Auto-Align Totals with Line Items
            </button>
          </div>

          <div className="space-y-2">
            {invoice.validationWarnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2.5 text-xs text-amber-900/90 bg-white/70 p-2.5 rounded-xl border border-amber-100"
              >
                <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                  warning.severity === 'error' ? 'bg-red-500' : warning.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div className="space-y-0.5">
                  <p className="font-medium">{warning.message}</p>
                  {warning.calculatedValue !== undefined && warning.documentValue !== undefined && (
                    <p className="text-slate-500 text-[11px]">
                      Calculated from lines: ₹{Number(warning.calculatedValue).toFixed(2)} | Document Value: ₹{Number(warning.documentValue).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Split: Document Preview (Left) vs Editable Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Original Document Viewer */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden sticky top-20">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Original Document</span>
            </span>

            {/* Viewer Controls */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-500 px-1 font-mono">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded ml-1"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-[520px] bg-slate-900/5 overflow-auto flex items-center justify-center p-4">
            {invoice.documentPreviewData ? (
              invoice.fileType === 'application/pdf' ? (
                <iframe
                  src={invoice.documentPreviewData}
                  title="PDF Preview"
                  className="w-full h-full rounded border border-slate-300"
                />
              ) : (
                <img
                  src={invoice.documentPreviewData}
                  alt="Document"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-w-full max-h-full object-contain rounded shadow-sm"
                />
              )
            ) : (
              <div className="text-center p-8 text-slate-400 space-y-2">
                <FileText className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
                <p className="text-xs">No visual image attached to this record.</p>
                <p className="text-[11px] text-slate-400">
                  Document data parsed and ready for editing.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="truncate max-w-[200px]">{invoice.fileName || 'invoice_document'}</span>
            <span>Confidence: <strong className="text-indigo-600 capitalize">{invoice.modelConfidence || 'high'}</strong></span>
          </div>
        </div>

        {/* Right Column: Editable Invoice Fields */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3 space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Parties & Invoice Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`pb-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors ${
                activeTab === 'items'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Line Items ({invoice.lineItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tax')}
              className={`pb-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors ${
                activeTab === 'tax'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Taxes & Grand Totals</span>
            </button>
          </div>

          {/* TAB 1: Parties & General Details */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
              {/* Supplier (Vendor) Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Vendor / Supplier (Seller)</span>
                  </h3>
                  {supplierGstinCheck.isValid && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      State {supplierGstinCheck.stateCode} GSTIN Valid
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Vendor / Shop Name *</label>
                    <input
                      type="text"
                      value={invoice.vendorName}
                      onChange={(e) => handleFieldChange('vendorName', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Supplier GSTIN (15 chars)</span>
                      {!supplierGstinCheck.isValid && invoice.supplierGstin && (
                        <span className="text-[10px] text-amber-600 font-normal">Check format</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={invoice.supplierGstin || ''}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      onChange={(e) => handleFieldChange('supplierGstin', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Vendor Phone / Contact</label>
                    <input
                      type="text"
                      value={invoice.vendorPhone || ''}
                      placeholder="+91..."
                      onChange={(e) => handleFieldChange('vendorPhone', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Vendor Address</label>
                    <textarea
                      rows={2}
                      value={invoice.vendorAddress || ''}
                      onChange={(e) => handleFieldChange('vendorAddress', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Customer (Buyer) Details */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customer / Billed To</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Customer Name</label>
                    <input
                      type="text"
                      value={invoice.customerName || ''}
                      placeholder="Individual or Business Name"
                      onChange={(e) => handleFieldChange('customerName', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Buyer GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={invoice.customerGstin || ''}
                      placeholder="Buyer 15-char GSTIN for ITC"
                      onChange={(e) => handleFieldChange('customerGstin', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Invoice Identifiers & Classification</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Invoice Number *</label>
                    <input
                      type="text"
                      value={invoice.invoiceNumber}
                      onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Invoice Date *</label>
                    <input
                      type="date"
                      value={invoice.invoiceDate || ''}
                      onChange={(e) => handleFieldChange('invoiceDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Payment Due Date</label>
                    <input
                      type="date"
                      value={invoice.dueDate || ''}
                      onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Expense Category</label>
                    <select
                      value={invoice.expenseCategory}
                      onChange={(e) => handleFieldChange('expenseCategory', e.target.value as ExpenseCategory)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Payment Mode</label>
                    <input
                      type="text"
                      value={invoice.paymentMethod || ''}
                      placeholder="UPI, Cash, NEFT, Card..."
                      onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Place of Supply</label>
                    <input
                      type="text"
                      value={invoice.placeOfSupply || ''}
                      placeholder="e.g. 07-Delhi"
                      onChange={(e) => handleFieldChange('placeOfSupply', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Line Items Table */}
          {activeTab === 'items' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Extracted Line Items</h3>
                  <p className="text-xs text-slate-500">
                    Verify quantity, rate, and line totals extracted by Gemini
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {invoice.lineItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                  <Receipt className="w-8 h-8 mx-auto text-slate-400 stroke-1" />
                  <p className="text-xs text-slate-500">No individual line items were extracted.</p>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-indigo-600 font-semibold underline"
                  >
                    Add line item manually
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 min-w-[180px]">Item / Description</th>
                        <th className="py-2.5 px-2 w-16 text-center">HSN</th>
                        <th className="py-2.5 px-2 w-16 text-right">Qty</th>
                        <th className="py-2.5 px-2 w-24 text-right">Rate (₹)</th>
                        <th className="py-2.5 px-2 w-16 text-right">Tax %</th>
                        <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.lineItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-medium text-slate-900"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.hsnCode || ''}
                              placeholder="-"
                              onChange={(e) => handleLineItemChange(idx, 'hsnCode', e.target.value)}
                              className="w-full px-1.5 py-1 text-center rounded border border-slate-200 text-xs font-mono text-slate-700"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-1 text-right rounded border border-slate-200 text-xs font-mono text-slate-900"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleLineItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-1 text-right rounded border border-slate-200 text-xs font-mono text-slate-900"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.taxRate || ''}
                              placeholder="18"
                              onChange={(e) => handleLineItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-1 text-right rounded border border-slate-200 text-xs font-mono text-slate-700"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.lineTotal}
                              onChange={(e) => handleLineItemChange(idx, 'lineTotal', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-right font-bold rounded border border-slate-200 text-xs font-mono text-slate-900"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteLineItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Taxes & Grand Totals Breakdown */}
          {activeTab === 'tax' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tax Breakdown & Financial Totals</h3>
                <p className="text-xs text-slate-500">
                  Standard Indian GST separation: CGST + SGST (Intra-state) or IGST (Inter-state)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Taxable Subtotal */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Subtotal Before Tax (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.subtotal}
                    onChange={(e) => handleFieldChange('subtotal', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>

                {/* Discount */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Total Discount Deducted</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.discount || ''}
                    placeholder="0.00"
                    onChange={(e) => handleFieldChange('discount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>

                {/* CGST */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">CGST (Central GST)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.cgst || ''}
                    placeholder="0.00"
                    onChange={(e) => handleFieldChange('cgst', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>

                {/* SGST */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">SGST (State GST)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.sgst || ''}
                    placeholder="0.00"
                    onChange={(e) => handleFieldChange('sgst', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>

                {/* IGST */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">IGST (Inter-state Integrated GST)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.igst || ''}
                    placeholder="0.00"
                    onChange={(e) => handleFieldChange('igst', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>

                {/* Other Taxes / Round off */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Cess / Other Charges / Rounding</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.otherTaxes || ''}
                    placeholder="0.00"
                    onChange={(e) => handleFieldChange('otherTaxes', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>

                {/* Grand Total */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Total Invoice Payable
                      </span>
                      <p className="text-[11px] text-indigo-700">
                        Subtotal + Taxes - Discounts
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-slate-700">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={invoice.totalAmount}
                        onChange={(e) => handleFieldChange('totalAmount', parseFloat(e.target.value) || 0)}
                        className="w-44 px-3 py-2 text-xl font-extrabold text-indigo-900 bg-white rounded-xl border border-indigo-200 text-right font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Paid & Balance Due */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Amount Paid</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.amountPaid || ''}
                    placeholder="0.00"
                    onChange={(e) => handleFieldChange('amountPaid', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Balance Due</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.balanceDue || ''}
                    placeholder="0.00"
                    onChange={(e) => handleFieldChange('balanceDue', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
