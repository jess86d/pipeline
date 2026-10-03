import React, { useState } from 'react';
import { ShieldCheck, LayoutDashboard, Database, GitMerge, FileCode2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Matches from './pages/Matches';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-slate-300 flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0c0e14] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-black text-white text-base tracking-tight flex items-center gap-2">
                HINDSIGHT360
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  v1.0.0
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Customer Database &bull; State APIs &bull; Permitted Feeds &bull; RapidFuzz
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                currentPage === 'dashboard'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentPage('customers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                currentPage === 'customers'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => setCurrentPage('matches')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                currentPage === 'matches'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitMerge className="h-4 w-4" />
              <span>Matches &amp; Review</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'customers' && <Customers />}
        {currentPage === 'matches' && <Matches />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c0e14] py-3 text-center text-xs text-slate-500">
        HINDSIGHT360 Recovery Architecture &bull; FastAPI + RapidFuzz Backend &bull; React Frontend
      </footer>
    </div>
  );
}
