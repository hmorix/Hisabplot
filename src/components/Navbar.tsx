import React from 'react';
import { 
  FileSpreadsheet, 
  LayoutDashboard, 
  Clock, 
  Settings, 
  ShieldCheck, 
  Sparkles,
  Receipt,
  FileCheck2
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'workspace' | 'dashboard' | 'history' | 'settings' | 'privacy';
  setActiveTab: (tab: 'workspace' | 'dashboard' | 'history' | 'settings' | 'privacy') => void;
  savedCount: number;
  reviewRequiredCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  reviewRequiredCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('workspace')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                  Hisab<span className="text-indigo-600">Pilot</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  GST AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Your invoices, organized in seconds
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'workspace'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'history'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>History</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold bg-slate-200 text-slate-700 rounded-full">
                  {savedCount}
                </span>
              )}
              {reviewRequiredCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 right-1 ring-2 ring-white" title={`${reviewRequiredCount} require review`} />
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Settings & Quota"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'privacy'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Security & Disclaimer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden lg:inline">Privacy</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
