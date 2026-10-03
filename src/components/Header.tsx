import React from 'react';
import {
  Database,
  Code,
  RefreshCw,
  Layers,
  Sparkles,
  GitMerge,
  Network,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FolderTree,
} from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
  totalRecords: number;
  duplicateGroupCount: number;
  modifiedCount: number;
  reviewCount?: number;
  highConfidenceCount?: number;
  onReset: () => void;
  onOpenCode: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalRecords,
  duplicateGroupCount,
  modifiedCount,
  reviewCount = 0,
  highConfidenceCount = 0,
  onReset,
  onOpenCode,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="border-b border-slate-800/90 bg-[#0c0e14]/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title and description */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/90 text-white shadow-xs border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>HINDSIGHT360</span>
                  <span className="hidden sm:inline-block text-xs font-normal text-slate-400 border-l border-slate-700 pl-2">
                    Customer &bull; Property Linkage
                  </span>
                </h1>
                <span className="inline-flex items-center rounded-full bg-emerald-950/70 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-400 border border-emerald-800/70">
                  RapidFuzz Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Customer Database &bull; State APIs &amp; Permitted Feeds &bull; Normalization &bull; Review Queue
              </p>
            </div>
          </div>

          {/* Action & Code buttons */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              id="view-python-code-btn"
              onClick={onOpenCode}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#141822] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1a202d] hover:border-slate-700 hover:text-white transition"
              title="View Python Source Code"
            >
              <Code className="h-3.5 w-3.5 text-slate-400" />
              <span>Python RapidFuzz</span>
            </button>

            <button
              id="reset-sample-data-btn"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#141822] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1a202d] hover:border-slate-700 hover:text-white transition"
              title="Reset Sample Records"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs Ribbon */}
        <div className="mt-3 flex items-center overflow-x-auto pb-1 pt-1 border-t border-slate-800/80 gap-1.5 text-xs">
          <button
            id="view-pipeline-btn"
            onClick={() => setActiveView('pipeline')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition shrink-0 ${
              activeView === 'pipeline'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141824]'
            }`}
          >
            <Network className="h-3.5 w-3.5 text-emerald-400" />
            <span>Architecture &amp; Pipeline</span>
          </button>

          <button
            id="view-review-btn"
            onClick={() => setActiveView('review')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition shrink-0 ${
              activeView === 'review'
                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141824]'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Review Queue</span>
            {reviewCount > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-300 border border-amber-500/40">
                {reviewCount}
              </span>
            )}
          </button>

          <button
            id="view-high-conf-btn"
            onClick={() => setActiveView('high_confidence')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition shrink-0 ${
              activeView === 'high_confidence'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141824]'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>High Confidence</span>
            {highConfidenceCount > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300 border border-emerald-500/40">
                {highConfidenceCount}
              </span>
            )}
          </button>

          <button
            id="view-fuzzy-btn"
            onClick={() => setActiveView('fuzzy')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition shrink-0 ${
              activeView === 'fuzzy'
                ? 'bg-[#1e2433] text-white border border-slate-700 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141824]'
            }`}
          >
            <GitMerge className="h-3.5 w-3.5 text-emerald-400" />
            <span>Matching Engine</span>
          </button>

          <button
            id="view-batch-btn"
            onClick={() => setActiveView('batch')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition shrink-0 ${
              activeView === 'batch'
                ? 'bg-[#1e2433] text-white border border-slate-700 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141824]'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Batch Deduplicator ({totalRecords})</span>
          </button>

          <button
            id="view-tester-btn"
            onClick={() => setActiveView('tester')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition shrink-0 ${
              activeView === 'tester'
                ? 'bg-[#1e2433] text-white border border-slate-700 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141824]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            <span>Single Normalizer</span>
          </button>
          <button
            id="view-codebase-btn"
            onClick={() => setActiveView('codebase')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition shrink-0 ${
              activeView === 'codebase'
                ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/80 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141824]'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5 text-indigo-400" />
            <span>hindsight360-recovery/</span>
          </button>
        </div>
      </div>
    </header>
  );
};
