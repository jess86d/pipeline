import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Check,
  RotateCcw,
  Building,
  User,
  MapPin,
  FileText,
  ShieldCheck,
  Download,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { PropertyMatchPair } from '../types';
import { calculateCompositeMatchScore, analyzeTokenSetRatio } from '../utils/fuzzy';
import { exportReviewQueueFindingsCsv, CsvExportResult } from '../utils/csvExporter';

interface ReviewQueueViewProps {
  pairs: PropertyMatchPair[];
  onUpdatePairStatus: (id: string, newStatus: 'pending_review' | 'high_confidence' | 'rejected', note?: string) => void;
  onOpenCodeModal: () => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  pairs,
  onUpdatePairStatus,
  onOpenCodeModal,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [auditNoteInput, setAuditNoteInput] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastExport, setLastExport] = useState<CsvExportResult | null>(null);

  // Calculate scores for all pairs
  const evaluatedPairs = pairs.map((pair) => {
    const res = calculateCompositeMatchScore(
      { name: pair.customerName, address: pair.customerAddress, zip: pair.customerZip },
      { ownerName: pair.propertyOwnerName, address: pair.propertyAddress, zip: pair.propertyZip },
      { nameWeight: 0.45, addressWeight: 0.35, locationWeight: 0.20 }
    );
    return { pair, res };
  });

  const pendingList = evaluatedPairs.filter(({ pair, res }) => {
    return pair.status === 'pending_review' || (!pair.status && res.compositeScore >= 50 && res.compositeScore < 75);
  });

  const approvedList = evaluatedPairs.filter(({ pair, res }) => {
    return pair.status === 'high_confidence' || (!pair.status && res.compositeScore >= 75);
  });

  const rejectedList = evaluatedPairs.filter(({ pair }) => {
    return pair.status === 'rejected';
  });

  // Filter based on tab and search
  const filtered = evaluatedPairs.filter(({ pair, res }) => {
    // Tab filter
    if (filterTab === 'pending') {
      const isPending = pair.status === 'pending_review' || (!pair.status && res.compositeScore >= 50 && res.compositeScore < 75);
      if (!isPending) return false;
    } else if (filterTab === 'approved') {
      if (pair.status !== 'high_confidence' && res.compositeScore < 75) return false;
    } else if (filterTab === 'rejected') {
      if (pair.status !== 'rejected') return false;
    }

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      pair.customerName.toLowerCase().includes(q) ||
      pair.propertyOwnerName.toLowerCase().includes(q) ||
      pair.customerAddress.toLowerCase().includes(q) ||
      pair.propertyAddress.toLowerCase().includes(q) ||
      (pair.customerId && pair.customerId.toLowerCase().includes(q)) ||
      (pair.parcelId && pair.parcelId.toLowerCase().includes(q))
    );
  });

  const activePairObj = evaluatedPairs.find((p) => p.pair.id === selectedPairId) || filtered[0] || null;

  const handleApprove = (pairId: string) => {
    onUpdatePairStatus(pairId, 'high_confidence', auditNoteInput.trim() || 'Verified by operator review');
    setAuditNoteInput('');
  };

  const handleReject = (pairId: string) => {
    onUpdatePairStatus(pairId, 'rejected', auditNoteInput.trim() || 'Rejected: Insufficient token match or false entity link');
    setAuditNoteInput('');
  };

  const handleResetToPending = (pairId: string) => {
    onUpdatePairStatus(pairId, 'pending_review', 'Re-queued for supervisor review');
  };

  const handleExportFiltered = () => {
    const pairsToExport = filtered.map((p) => p.pair);
    const result = exportReviewQueueFindingsCsv(pairsToExport, `filtered_${filterTab}`);
    setLastExport(result);
    setShowExportMenu(false);
    setTimeout(() => setLastExport(null), 6000);
  };

  const handleExportAll = () => {
    const pairsToExport = evaluatedPairs.map((p) => p.pair);
    const result = exportReviewQueueFindingsCsv(pairsToExport, 'all_candidates');
    setLastExport(result);
    setShowExportMenu(false);
    setTimeout(() => setLastExport(null), 6000);
  };

  const handleExportPending = () => {
    const pairsToExport = pendingList.map((p) => p.pair);
    const result = exportReviewQueueFindingsCsv(pairsToExport, 'pending_triage');
    setLastExport(result);
    setShowExportMenu(false);
    setTimeout(() => setLastExport(null), 6000);
  };

  const handleExportApproved = () => {
    const pairsToExport = approvedList.map((p) => p.pair);
    const result = exportReviewQueueFindingsCsv(pairsToExport, 'approved_decisions');
    setLastExport(result);
    setShowExportMenu(false);
    setTimeout(() => setLastExport(null), 6000);
  };

  const handleExportRejected = () => {
    const pairsToExport = rejectedList.map((p) => p.pair);
    const result = exportReviewQueueFindingsCsv(pairsToExport, 'rejected_findings');
    setLastExport(result);
    setShowExportMenu(false);
    setTimeout(() => setLastExport(null), 6000);
  };

  const handleExportSingleActivePair = () => {
    if (!activePairObj) return;
    const result = exportReviewQueueFindingsCsv([activePairObj.pair], `finding_${activePairObj.pair.customerId || activePairObj.pair.id}`);
    setLastExport(result);
    setTimeout(() => setLastExport(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-amber-900/60 bg-[#16120c] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-800/80">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Human-in-the-Loop Triage
              </span>
              <span className="text-xs text-slate-400 font-mono">Scores 50.0% – 74.9%</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              HINDSIGHT360 Review Queue
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Review borderline entity pairs requiring human verification before linking customer profiles to public land and tax records.
            </p>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              id="export-review-queue-btn"
              onClick={handleExportFiltered}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 text-xs sm:text-sm font-semibold transition shadow-xs"
              title="Download CSV for review queue auditor findings"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV ({filtered.length})</span>
            </button>

            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center rounded-lg bg-amber-700 hover:bg-amber-600 text-white p-2 text-xs font-semibold transition shadow-xs"
              title="Export Options"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            <button
              onClick={onOpenCodeModal}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#1e2332] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-[#282f42] transition"
            >
              <span>View RapidFuzz Logic</span>
            </button>

            {/* Dropdown menu */}
            {showExportMenu && (
              <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-slate-700 bg-[#161c2a] p-2 shadow-2xl space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Auditor CSV Exports
                </div>
                <button
                  onClick={handleExportFiltered}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#202738] rounded-lg transition"
                >
                  <span className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-amber-400" />
                    <span>Current Filtered View</span>
                  </span>
                  <span className="font-mono text-amber-400 font-semibold">{filtered.length} rows</span>
                </button>

                <button
                  onClick={handleExportPending}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#202738] rounded-lg transition"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Pending Triage Only</span>
                  </span>
                  <span className="font-mono text-amber-400 font-semibold">{pendingList.length} rows</span>
                </button>

                <button
                  onClick={handleExportApproved}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#202738] rounded-lg transition"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Approved Decisions</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">{approvedList.length} rows</span>
                </button>

                <button
                  onClick={handleExportRejected}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#202738] rounded-lg transition"
                >
                  <span className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Rejected Findings</span>
                  </span>
                  <span className="font-mono text-rose-400 font-semibold">{rejectedList.length} rows</span>
                </button>

                <div className="border-t border-slate-700/80 my-1" />

                <button
                  onClick={handleExportAll}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#202738] rounded-lg transition"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
                    <span>All Candidate Pairs</span>
                  </span>
                  <span className="font-mono text-cyan-400 font-semibold">{evaluatedPairs.length} rows</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Export Notification Banner */}
        {lastExport && (
          <div className="mt-4 rounded-lg bg-amber-950/80 border border-amber-800/80 p-3 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>Audit Findings Exported:</strong> Saved <strong>{lastExport.totalRecords}</strong> findings to <code className="font-mono bg-amber-900/60 px-1 py-0.5 rounded text-[11px]">{lastExport.filename}</code> ({lastExport.approvedCount} approved, {lastExport.rejectedCount} rejected, {lastExport.pendingCount} pending).
              </span>
            </div>
            <button
              onClick={() => setLastExport(null)}
              className="text-amber-400 hover:text-amber-200 text-xs font-semibold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-[#141824] p-1 border border-slate-800">
          <button
            id="tab-pending-btn"
            onClick={() => setFilterTab('pending')}
            className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              filterTab === 'pending'
                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Review
          </button>
          <button
            id="tab-approved-btn"
            onClick={() => setFilterTab('approved')}
            className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              filterTab === 'approved'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Approved Links
          </button>
          <button
            id="tab-rejected-btn"
            onClick={() => setFilterTab('rejected')}
            className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              filterTab === 'rejected'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rejected Links
          </button>
          <button
            id="tab-all-btn"
            onClick={() => setFilterTab('all')}
            className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              filterTab === 'all'
                ? 'bg-[#1f2535] text-white border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Candidates
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer, APN, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-[#121622] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Review Layout: List on left, inspection & audit controls on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of candidates (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0e111a] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300">
              Candidate Pairs ({filtered.length})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Weighted RapidFuzz</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No candidate pairs match the current filter.
              </div>
            ) : (
              filtered.map(({ pair, res }) => {
                const isSelected = activePairObj?.pair.id === pair.id;
                const scoreColor =
                  res.compositeScore >= 75
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80'
                    : res.compositeScore >= 50
                    ? 'text-amber-400 bg-amber-950/60 border-amber-800/80'
                    : 'text-rose-400 bg-rose-950/60 border-rose-800/80';

                return (
                  <button
                    key={pair.id}
                    onClick={() => {
                      setSelectedPairId(pair.id);
                      setAuditNoteInput(pair.auditNote || '');
                    }}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${
                      isSelected
                        ? 'border-emerald-500/80 bg-[#161c2b] shadow-md ring-1 ring-emerald-500/30'
                        : 'border-slate-800/80 bg-[#121622] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
                          {pair.customerName}
                        </span>
                        {pair.customerId && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ({pair.customerId})
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                        {res.compositeScore}%
                      </div>
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 truncate">
                      <Building className="h-3 w-3 text-slate-500 shrink-0" />
                      <span className="truncate">{pair.propertyOwnerName}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[170px]">{pair.sourceName || 'State Assessor Feed'}</span>
                      {pair.status === 'high_confidence' ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      ) : pair.status === 'rejected' ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Needs Review
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Token Inspection & Audit Action Panel (7 cols) */}
        {activePairObj ? (
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0e111a] p-5 shadow-sm space-y-5">
            {/* Top Bar of active pair */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {activePairObj.pair.customerId || 'ID-N/A'} &bull; {activePairObj.pair.parcelId || 'APN-N/A'}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                    {activePairObj.pair.sourceType === 'state_api' ? 'State API' : 'Permitted Feed'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Candidate Link Verification
                </h3>
              </div>

              {/* Composite Score Pill */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Composite Score</div>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      activePairObj.res.compositeScore >= 75
                        ? 'text-emerald-400'
                        : activePairObj.res.compositeScore >= 50
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {activePairObj.res.compositeScore}%
                  </div>
                </div>
              </div>
            </div>

            {/* Side by side records */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Database Record */}
              <div className="rounded-xl border border-slate-800/90 bg-[#121622] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>Customer Database Record</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Internal</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500">Customer Name:</span>
                  <div className="text-xs font-semibold text-white">
                    {activePairObj.pair.customerName}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500">Address on File:</span>
                  <div className="text-xs text-slate-300">
                    {activePairObj.pair.customerAddress}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500">ZIP Code:</span>
                    <div className="text-xs font-mono text-slate-300">
                      {activePairObj.pair.customerZip}
                    </div>
                  </div>
                  {activePairObj.pair.customerPhone && (
                    <div>
                      <span className="text-[10px] uppercase text-slate-500">Phone:</span>
                      <div className="text-xs font-mono text-slate-300">
                        {activePairObj.pair.customerPhone}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Assessor / Deed Record */}
              <div className="rounded-xl border border-slate-800/90 bg-[#121622] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-400 pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" />
                    <span>Property Cadastral Record</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Official</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500">Deed Owner Name:</span>
                  <div className="text-xs font-semibold text-white">
                    {activePairObj.pair.propertyOwnerName}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500">Property Address:</span>
                  <div className="text-xs text-slate-300">
                    {activePairObj.pair.propertyAddress}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500">Property ZIP:</span>
                    <div className="text-xs font-mono text-slate-300">
                      {activePairObj.pair.propertyZip}
                    </div>
                  </div>
                  {activePairObj.pair.parcelId && (
                    <div>
                      <span className="text-[10px] uppercase text-slate-500">APN / Parcel:</span>
                      <div className="text-xs font-mono text-slate-300">
                        {activePairObj.pair.parcelId}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Score Weights Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-[#121520] p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-200">
                RapidFuzz Component Score Breakdown
              </span>

              <div className="grid grid-cols-3 gap-3 text-center">
                {/* Name Score */}
                <div className="p-2.5 rounded-lg bg-[#161a28] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Name Match (45%)</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                    {activePairObj.res.nameScore}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">fuzz.token_set_ratio</div>
                </div>

                {/* Address Score */}
                <div className="p-2.5 rounded-lg bg-[#161a28] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Address Match (35%)</div>
                  <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
                    {activePairObj.res.addressScore}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">fuzz.token_set_ratio</div>
                </div>

                {/* Location Score */}
                <div className="p-2.5 rounded-lg bg-[#161a28] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Location Match (20%)</div>
                  <div className="text-base font-bold font-mono text-purple-400 mt-0.5">
                    {activePairObj.res.locationScore}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">5-digit ZIP proximity</div>
                </div>
              </div>

              {/* Notes on this pair */}
              {activePairObj.pair.notes && (
                <div className="text-xs text-slate-400 bg-[#161a28] p-3 rounded-lg border border-slate-800/80">
                  <span className="font-semibold text-slate-300">System Linkage Notes: </span>
                  {activePairObj.pair.notes}
                </div>
              )}
            </div>

            {/* Auditor Actions & Notes Form */}
            <div className="rounded-xl border border-slate-800 bg-[#141824] p-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Auditor Assessment &amp; Notes
              </label>
              <textarea
                rows={2}
                placeholder="Add audit rationale (e.g., 'Confirmed deed transfer reflects living trust of customer')..."
                value={auditNoteInput}
                onChange={(e) => setAuditNoteInput(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#0d1017] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    id="approve-link-btn"
                    onClick={() => handleApprove(activePairObj.pair.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-xs transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve &amp; Link</span>
                  </button>

                  <button
                    id="reject-link-btn"
                    onClick={() => handleReject(activePairObj.pair.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white px-4 py-2 text-xs font-semibold shadow-xs transition"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject / False Positive</span>
                  </button>

                  <button
                    onClick={handleExportSingleActivePair}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#1a2130] hover:bg-[#232c3f] text-slate-200 px-3 py-2 text-xs font-medium transition"
                    title="Export this single candidate record as CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-amber-400" />
                    <span>Export Finding</span>
                  </button>
                </div>

                {activePairObj.pair.status && activePairObj.pair.status !== 'pending_review' && (
                  <button
                    onClick={() => handleResetToPending(activePairObj.pair.id)}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset to Pending</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0e111a] p-12 text-center text-slate-500">
            Select a candidate pair to begin audit review.
          </div>
        )}
      </div>
    </div>
  );
};
