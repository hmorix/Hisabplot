/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { InvoiceEditor } from './components/InvoiceEditor';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { PrivacyView } from './components/PrivacyView';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';
import { InvoiceData } from './types/invoice';
import { 
  getSavedInvoices, 
  saveInvoice, 
  deleteInvoice, 
  clearAllInvoices, 
  resetToSampleInvoices 
} from './lib/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'dashboard' | 'history' | 'settings' | 'privacy'>('workspace');
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [currentEditingInvoice, setCurrentEditingInvoice] = useState<InvoiceData | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [printInvoice, setPrintInvoice] = useState<InvoiceData | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const loaded = getSavedInvoices();
    setInvoices(loaded);
  }, []);

  const handleExtractionSuccess = (invoice: InvoiceData) => {
    setCurrentEditingInvoice(invoice);
    const updatedList = saveInvoice(invoice);
    setInvoices(updatedList);
    setActiveTab('workspace');
  };

  const handleSaveInvoice = (invoice: InvoiceData) => {
    const updatedList = saveInvoice(invoice);
    setInvoices(updatedList);
    setCurrentEditingInvoice(invoice);
  };

  const handleDeleteInvoice = (id: string) => {
    const updatedList = deleteInvoice(id);
    setInvoices(updatedList);
    if (currentEditingInvoice?.id === id) {
      setCurrentEditingInvoice(null);
    }
  };

  const handleClearAll = () => {
    const cleared = clearAllInvoices();
    setInvoices(cleared);
    setCurrentEditingInvoice(null);
  };

  const handleResetSamples = () => {
    const reset = resetToSampleInvoices();
    setInvoices(reset);
    if (reset.length > 0) {
      setCurrentEditingInvoice(reset[0]);
    }
  };

  const handleSelectInvoice = (inv: InvoiceData) => {
    setCurrentEditingInvoice(inv);
    setActiveTab('workspace');
  };

  const reviewRequiredCount = invoices.filter((i) => i.needsReview).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Indian Tricolor Accent Line on Top Header */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600 print:hidden" />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        savedCount={invoices.length}
        reviewRequiredCount={reviewRequiredCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workspace' && (
          currentEditingInvoice ? (
            <InvoiceEditor
              invoice={currentEditingInvoice}
              onSave={handleSaveInvoice}
              onBackToUpload={() => setCurrentEditingInvoice(null)}
              onPrintPreview={(inv) => setPrintInvoice(inv)}
            />
          ) : (
            <UploadZone
              onExtractionSuccess={handleExtractionSuccess}
              selectedModel={selectedModel}
            />
          )
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            invoices={invoices}
            onSelectInvoice={handleSelectInvoice}
            onGoToUpload={() => {
              setCurrentEditingInvoice(null);
              setActiveTab('workspace');
            }}
            onLoadSamples={handleResetSamples}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            invoices={invoices}
            onSelectInvoice={handleSelectInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onClearAll={handleClearAll}
            onResetSamples={handleResetSamples}
            onGoToUpload={() => {
              setCurrentEditingInvoice(null);
              setActiveTab('workspace');
            }}
            onPrintPreview={(inv) => setPrintInvoice(inv)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        )}

        {activeTab === 'privacy' && <PrivacyView />}
      </main>

      {/* Printable Voucher Modal */}
      <PrintInvoiceModal
        invoice={printInvoice}
        onClose={() => setPrintInvoice(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">HisabPilot</span>
            <span>•</span>
            <span>AI Paperwork & GST Assistant for Indian Small Businesses</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className="hover:text-indigo-600 transition-colors"
            >
              Privacy & Legal Limitations
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="hover:text-indigo-600 transition-colors"
            >
              API Quota & Model Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
