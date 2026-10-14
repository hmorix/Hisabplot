import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  EyeOff, 
  FileCheck2, 
  HelpCircle,
  ExternalLink 
} from 'lucide-react';

export const PrivacyView: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Privacy, Data Safety & Limitations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete transparency regarding document handling, artificial intelligence inference, and GST legal disclaimers
        </p>
      </div>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ephemeral Processing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Zero Server-Side Storage</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Uploaded document images and PDF files are received strictly in memory, processed through Gemini's multimodal vision endpoint, and promptly discarded. HisabPilot maintains no server-side document database.
          </p>
        </div>

        {/* Private Client Persistence */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Local Browser Storage</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your invoice history and verified records reside in your browser's local sandbox (LocalStorage). You maintain full control to export, back up, or wipe your records at any time.
          </p>
        </div>
      </div>

      {/* Google Gemini Data Flow */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
            AI
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Google Gemini API Processing</h3>
            <p className="text-xs text-slate-500">How artificial intelligence extracts invoice fields</p>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            When you submit an invoice, receipt, or PDF, the image data is transmitted to the official Google Gemini API via encrypted HTTPS requests. The model inspects the typography, table boundaries, handwritten notations, and tax schedules to generate structured JSON.
          </p>
          <p>
            API calls are executed using server-side environment variables. Your API keys are never transmitted to client browsers, third-party analytics trackers, or public CDNs.
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            For further information regarding Google AI Studio data handling terms, please visit{' '}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 font-semibold underline inline-flex items-center space-x-1"
            >
              <span>Google AI Studio Terms of Service</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>.
          </div>
        </div>
      </div>

      {/* Statutory Disclaimer & Accounting Limitations */}
      <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6 space-y-3">
        <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Statutory Accounting & GST Legal Disclaimer</span>
        </div>

        <div className="text-xs text-amber-900/90 space-y-2 leading-relaxed">
          <p>
            <strong>1. Not a Tax Filing Portal:</strong> HisabPilot is a productivity assistant designed for scanning and extracting text and numbers from paperwork. It does not connect directly to the Goods and Services Tax Network (GSTN) or file GSTR-1, GSTR-3B, or GSTR-9 returns.
          </p>
          <p>
            <strong>2. Not Certified Accounting or Legal Advice:</strong> Extracted fields, tax rates (CGST/SGST/IGST), and mathematical totals must be verified by a qualified business owner, accountant, or Chartered Accountant (CA) prior to tax filing or balance sheet auditing.
          </p>
          <p>
            <strong>3. User Verification Required:</strong> AI models may encounter blurry images, faint ink, torn receipts, or unusual column layouts. Always inspect the extracted values against your physical or digital original before approving records.
          </p>
        </div>
      </div>
    </div>
  );
};
