import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Plus,
  ArrowRight,
  Printer
} from 'lucide-react';
import { InvoiceData, EXPENSE_CATEGORIES } from '../types/invoice';
import { formatINR, formatDate } from '../lib/formatters';
import { exportInvoicesToExcel, exportInvoicesToCsv, exportInvoicesToJson } from '../lib/export';

interface HistoryViewProps {
  invoices: InvoiceData[];
  onSelectInvoice: (invoice: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
  onClearAll: () => void;
  onResetSamples: () => void;
  onGoToUpload: () => void;
  onPrintPreview: (invoice: InvoiceData) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onClearAll,
  onResetSamples,
  onGoToUpload,
  onPrintPreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REVIEW' | 'VERIFIED'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      inv.vendorName.toLowerCase().includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.supplierGstin && inv.supplierGstin.toLowerCase().includes(q)) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'ALL' || inv.expenseCategory === selectedCategory;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'REVIEW' && inv.needsReview) ||
      (statusFilter === 'VERIFIED' && inv.userVerified);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredInvoices.map((inv) => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedInvoices = invoices.filter((inv) => selectedIds.includes(inv.id));
  const activeExportList = selectedInvoices.length > 0 ? selectedInvoices : filteredInvoices;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header and Bulk Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice History & Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, audit, and batch export your verified paperwork
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Excel Export */}
          <button
            type="button"
            onClick={() => exportInvoicesToExcel(activeExportList, 'HisabPilot_Records')}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export ({activeExportList.length}) to Excel</span>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={() => exportInvoicesToCsv(activeExportList, 'HisabPilot_CSV')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          {/* JSON Export */}
          <button
            type="button"
            onClick={() => exportInvoicesToJson(activeExportList, 'HisabPilot_JSON')}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Download JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={onGoToUpload}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Scan New</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by vendor, invoice no, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="REVIEW">Review Required</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
        </div>

        {/* Selected count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing {filteredInvoices.length} of {invoices.length} invoices
            {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
          </span>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onResetSamples}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Sample Records</span>
            </button>
            {invoices.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-700">No matching invoices found</p>
            <p className="text-xs text-slate-400">Try resetting filters or uploading a new invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredInvoices.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-3 px-3">Vendor / Shop</th>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Supplier GSTIN</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Tax (GST)</th>
                  <th className="py-3 px-3 text-right">Total (INR)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectInvoice(inv)}
                  >
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => handleToggleSelect(inv.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-[180px] truncate">
                      {inv.vendorName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {inv.supplierGstin || <span className="text-slate-400 italic">Unregistered</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {inv.expenseCategory}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-purple-900 font-sans">
                      {formatINR((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-sans">
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {inv.needsReview ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 flex items-center justify-center space-x-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                          <span>Review</span>
                        </span>
                      ) : inv.userVerified ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center justify-center space-x-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                          Auto
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onPrintPreview(inv)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteInvoice(inv.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete"
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
    </div>
  );
};
