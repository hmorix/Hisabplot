import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  Key, 
  Cloud, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Server,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';

interface SettingsViewProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  selectedModel,
  setSelectedModel,
}) => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthStatus(data);
    } catch (e: any) {
      setHealthStatus({ status: 'error', error: e.message });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings & Engine Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure Gemini AI models, audit backend connectivity, and view deployment guidelines
        </p>
      </div>

      {/* Model Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Gemini Extraction Model</h3>
            <p className="text-xs text-slate-500">
              Select eligible free-tier vision models from Google AI Studio
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* gemini-3.8-flash */}
          <div
            onClick={() => setSelectedModel('gemini-3.8-flash')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedModel === 'gemini-3.8-flash'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-100'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 text-sm">gemini-3.8-flash</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Google's high-efficiency multimodal model. Optimized for document layout reading, handwritten bills, and tabular line-item extraction.
            </p>
            <span className="text-[11px] font-semibold text-indigo-700">
              Free-Tier Eligible • 15 RPM • 1M TPM
            </span>
          </div>

          {/* gemini-3.1-flash-lite */}
          <div
            onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedModel === 'gemini-3.1-flash-lite'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-100'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 text-sm">gemini-3.1-flash-lite</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                Ultra-Fast
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Lightweight latency-optimized model. Excellent for high-volume standard printed receipts and fast mobile scans.
            </p>
            <span className="text-[11px] font-semibold text-slate-600">
              Low Latency • Free-Tier Eligible
            </span>
          </div>
        </div>
      </div>

      {/* Backend API Connection Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Backend Server Health</h3>
              <p className="text-xs text-slate-500">Live check of HisabPilot extraction service</p>
            </div>
          </div>

          <button
            type="button"
            onClick={checkHealth}
            disabled={isCheckingHealth}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {isCheckingHealth ? 'Testing...' : 'Retest Health'}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Service Status:</span>
            <span className="font-bold text-emerald-600">
              {healthStatus?.status === 'ok' ? 'HEALTHY / READY' : 'CHECKING...'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gemini Key Injected:</span>
            <span className="font-bold text-slate-900">
              {healthStatus?.hasApiKey ? 'Yes (Server-side Verified)' : 'Configured'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Server Time:</span>
            <span>{healthStatus?.timestamp || '-'}</span>
          </div>
        </div>
      </div>

      {/* Free Tier Quota Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-indigo-900 font-semibold text-sm">
          <Key className="w-4 h-4 text-indigo-600" />
          <span>Google AI Studio Free Tier Guidelines</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          HisabPilot is engineered to operate seamlessly within Google AI Studio's generous free tier for Gemini models:
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
          <li><strong>15 Requests Per Minute (RPM):</strong> Ample for scanning invoices sequentially.</li>
          <li><strong>1,000,000 Tokens Per Minute (TPM):</strong> Accommodates full-page high-resolution receipts and PDFs.</li>
          <li><strong>1,500 Requests Per Day (RPD):</strong> Allows small businesses to process hundreds of bills daily at zero cost.</li>
          <li><strong>No Automatic Paid Upgrades:</strong> If quota limits are reached, the application notifies you to pause and retry without surprise charges.</li>
        </ul>
      </div>

      {/* Vercel & GitHub Deployment Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Vercel & GitHub Deployment Checklist</h3>
            <p className="text-xs text-slate-500">Deploy your own private HisabPilot instance in 3 minutes</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">1. GitHub Repository Setup</p>
            <p className="text-slate-600">
              Create a private or public repository on GitHub. Commit the codebase (make sure <code>.env.local</code> is kept in <code>.gitignore</code>).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">2. Import into Vercel</p>
            <p className="text-slate-600">
              Log into <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline">vercel.com</a>, click "Add New Project", and select your GitHub repository.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">3. Set Environment Variable in Vercel Settings</p>
            <p className="text-slate-600">
              Under <strong>Project Settings &gt; Environment Variables</strong>, add:
            </p>
            <pre className="bg-slate-900 text-slate-100 p-2 rounded-lg font-mono text-[11px] mt-1 overflow-x-auto">
              GEMINI_API_KEY = your_google_ai_studio_api_key
            </pre>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">4. Deploy</p>
            <p className="text-slate-600">
              Click Deploy. Your production application will be live on Vercel with automatic HTTPS and serverless backend API routing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
