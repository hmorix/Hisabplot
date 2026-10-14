import React from 'react';
import { 
  TrendingUp, 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  UploadCloud, 
  ArrowRight,
  PieChart,
  Tag,
  ShieldAlert
} from 'lucide-react';
import { InvoiceData } from '../types/invoice';
import { formatINR, formatDate } from '../lib/formatters';
import { exportInvoicesToExcel, exportInvoicesToCsv } from '../lib/export';

interface DashboardViewProps {
  invoices: InvoiceData[];
  onSelectInvoice: (invoice: InvoiceData) => void;
  onGoToUpload: () => void;
  onLoadSamples: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  onSelectInvoice,
  onGoToUpload,
  onLoadSamples,
}) => {
  // Compute metrics from actual invoice records
  const totalInvoices = invoices.length;
  const totalSpend = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalTax = invoices.reduce(
    (sum, inv) => sum + (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0) + (inv.otherTaxes || 0),
    0
  );
  const totalCgst = invoices.reduce((sum, inv) => sum + (inv.cgst || 0), 0);
  const totalSgst = invoices.reduce((sum, inv) => sum + (inv.sgst || 0), 0);
  const totalIgst = invoices.reduce((sum, inv) => sum + (inv.igst || 0), 0);

  const reviewRequiredList = invoices.filter((inv) => inv.needsReview);
  const verifiedList = invoices.filter((inv) => inv.userVerified);

  // Category breakdown
  const categoryStats: Record<string, { count: number; total: number }> = {};
  invoices.forEach((inv) => {
    const cat = inv.expenseCategory || 'Other Expense';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, total: 0 };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].total += inv.totalAmount || 0;
  });

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1].total - a[1].total);

  // If no records exist, show proper empty state
  if (totalInvoices === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <Receipt className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">No Invoices Processed Yet</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload your first invoice or receipt to see automated GST tax extraction, expense categorization, and financial metrics here.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoToUpload}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center space-x-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload First Invoice</span>
          </button>
          <button
            type="button"
            onClick={onLoadSamples}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors"
          >
            Load Demo Indian Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Paperwork & GST Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated metrics computed from your {totalInvoices} active invoice records
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => exportInvoicesToExcel(invoices)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export All ({invoices.length}) to Excel</span>
          </button>
          <button
            type="button"
            onClick={onGoToUpload}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Scan Invoice</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Invoices</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalInvoices}</p>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-medium">{verifiedList.length} verified</span>
            <span>•</span>
            <span>{invoices.length - verifiedList.length} pending check</span>
          </div>
        </div>

        {/* Total Invoice Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-sans">{formatINR(totalSpend)}</p>
          <p className="text-[11px] text-slate-500">
            Gross document total payable
          </p>
        </div>

        {/* Total Tax Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Tax / GST</span>
            <Tag className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-900 font-sans">{formatINR(totalTax)}</p>
          <p className="text-[11px] text-slate-500">
            Eligible Input Tax Credit (ITC) pool
          </p>
        </div>

        {/* Review Required */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Review Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{reviewRequiredList.length}</p>
          <p className="text-[11px] text-slate-500">
            {reviewRequiredList.length === 0 ? 'All invoices pass audit checks' : 'Records with math or GST discrepancies'}
          </p>
        </div>
      </div>

      {/* Middle Row: GST Split + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GST Components Box */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">GST Tax Breakdown</h3>
              <p className="text-xs text-slate-500">Cumulative taxes by classification</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              ITC Ready
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700">CGST (Central GST)</p>
                <p className="text-[11px] text-slate-400">Intra-state supplies</p>
              </div>
              <span className="text-sm font-bold text-slate-900 font-sans">{formatINR(totalCgst)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700">SGST (State GST)</p>
                <p className="text-[11px] text-slate-400">Intra-state supplies</p>
              </div>
              <span className="text-sm font-bold text-slate-900 font-sans">{formatINR(totalSgst)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700">IGST (Integrated GST)</p>
                <p className="text-[11px] text-slate-400">Inter-state supplies</p>
              </div>
              <span className="text-sm font-bold text-slate-900 font-sans">{formatINR(totalIgst)}</span>
            </div>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Expense Category Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution across business expense heads</p>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {sortedCategories.map(([category, data]) => {
              const percentage = totalSpend > 0 ? (data.total / totalSpend) * 100 : 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {category} <span className="text-slate-400">({data.count})</span>
                    </span>
                    <span className="font-semibold text-slate-900 font-sans">
                      {formatINR(data.total)} <span className="text-slate-400 font-normal">({percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recently Processed Invoices</h3>
            <p className="text-xs text-slate-500">Click any row to open side-by-side verification editor</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-3">Invoice No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier GSTIN</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.slice(0, 5).map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-[200px] truncate">
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
                  <td className="py-3 px-3 text-right font-bold text-slate-900 font-sans">
                    {formatINR(inv.totalAmount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {inv.needsReview ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        Needs Review
                      </span>
                    ) : inv.userVerified ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                        Auto-Parsed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-indigo-600 font-semibold hover:underline flex items-center justify-end space-x-1">
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
