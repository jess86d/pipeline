import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Search,
  Download,
  Building,
  User,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  ArrowUpDown,
  ChevronDown,
  Check,
} from 'lucide-react';
import { PropertyMatchPair } from '../types';
import { calculateCompositeMatchScore } from '../utils/fuzzy';
import { exportHighConfidenceMatchesCsv, CsvExportResult } from '../utils/csvExporter';

interface HighConfidenceViewProps {
  pairs: PropertyMatchPair[];
  onOpenCodeModal: () => void;
}

export const HighConfidenceView: React.FC<HighConfidenceViewProps> = ({
  pairs,
  onOpenCodeModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'state_api' | 'permitted_feed'>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastExport, setLastExport] = useState<CsvExportResult | null>(null);

  // Filter high confidence pairs (status is high_confidence OR score >= 75 and not rejected)
  const evaluated = pairs.map((pair) => {
    const res = calculateCompositeMatchScore(
      { name: pair.customerName, address: pair.customerAddress, zip: pair.customerZip },
      { ownerName: pair.propertyOwnerName, address: pair.propertyAddress, zip: pair.propertyZip },
      { nameWeight: 0.45, addressWeight: 0.35, locationWeight: 0.20 }
    );
    return { pair, res };
  });

  const highConfidenceList = evaluated.filter(({ pair, res }) => {
    if (pair.status === 'rejected') return false;
    return pair.status === 'high_confidence' || res.compositeScore >= 75;
  });

  // Apply search and source filter
  const filtered = highConfidenceList.filter(({ pair }) => {
    if (sourceFilter !== 'all' && pair.sourceType !== sourceFilter) return false;
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

  const avgScore =
    highConfidenceList.length > 0
      ? (
          highConfidenceList.reduce((acc, curr) => acc + curr.res.compositeScore, 0) /
          highConfidenceList.length
        ).toFixed(1)
      : '0.0';

  const stateApiCount = highConfidenceList.filter((p) => p.pair.sourceType === 'state_api').length;
  const permittedCount = highConfidenceList.filter((p) => p.pair.sourceType === 'permitted_feed').length;

  const handleExportFiltered = () => {
    const pairsToExport = filtered.map((item) => item.pair);
    const result = exportHighConfidenceMatchesCsv(pairsToExport, 'hindsight360_high_confidence_filtered');
    setLastExport(result);
    setShowExportMenu(false);
    setTimeout(() => setLastExport(null), 6000);
  };

  const handleExportAll = () => {
    const pairsToExport = highConfidenceList.map((item) => item.pair);
    const result = exportHighConfidenceMatchesCsv(pairsToExport, 'hindsight360_high_confidence_all');
    setLastExport(result);
    setShowExportMenu(false);
    setTimeout(() => setLastExport(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-emerald-900/60 bg-[#0c1511] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-800/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Verified Entity Registry
              </span>
              <span className="text-xs text-slate-400 font-mono">Scores &ge; 75.0%</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              High Confidence Matches
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Automated deterministic and fuzzy linkages linking customers to deed registries with verified confidence.
            </p>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              id="export-high-conf-btn"
              onClick={handleExportFiltered}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs sm:text-sm font-semibold transition shadow-xs"
              title="Download CSV for high-confidence auditor findings"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV ({filtered.length})</span>
            </button>

            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white p-2 text-xs font-semibold transition shadow-xs"
              title="Additional Export Options"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Dropdown menu */}
            {showExportMenu && (
              <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-slate-700 bg-[#161c2a] p-2 shadow-2xl space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Export Findings
                </div>
                <button
                  onClick={handleExportFiltered}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#202738] rounded-lg transition"
                >
                  <span className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Current Filtered View</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">{filtered.length} rows</span>
                </button>

                <button
                  onClick={handleExportAll}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#202738] rounded-lg transition"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>All High Confidence Matches</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">{highConfidenceList.length} rows</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Export Notification Banner */}
        {lastExport && (
          <div className="mt-4 rounded-lg bg-emerald-950/80 border border-emerald-800/80 p-3 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Audit Export Generated:</strong> Saved <strong>{lastExport.totalRecords}</strong> high-confidence findings to <code className="font-mono bg-emerald-900/60 px-1 py-0.5 rounded text-[11px]">{lastExport.filename}</code> (Avg Score: {lastExport.averageScore}%).
              </span>
            </div>
            <button
              onClick={() => setLastExport(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#121622] p-4">
          <div className="text-xs text-slate-400">Total Linked Records</div>
          <div className="text-2xl font-bold text-white mt-1">{highConfidenceList.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Ready for CRM sync</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#121622] p-4">
          <div className="text-xs text-slate-400">Average Match Confidence</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{avgScore}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Above 75% bar</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#121622] p-4">
          <div className="text-xs text-slate-400">State API Sources</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{stateApiCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Direct Assessor APIs</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#121622] p-4">
          <div className="text-xs text-slate-400">Permitted Feed Sources</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{permittedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">CAD/GIS File Ingests</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-[#141824] p-1 border border-slate-800">
          <button
            onClick={() => setSourceFilter('all')}
            className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              sourceFilter === 'all'
                ? 'bg-[#1f2535] text-white border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Sources ({highConfidenceList.length})
          </button>
          <button
            onClick={() => setSourceFilter('state_api')}
            className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              sourceFilter === 'state_api'
                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            State APIs ({stateApiCount})
          </button>
          <button
            onClick={() => setSourceFilter('permitted_feed')}
            className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              sourceFilter === 'permitted_feed'
                ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Permitted Feeds ({permittedCount})
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer, APN, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-[#121622] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* High Confidence Records Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0e111a] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#121622] border-b border-slate-800 font-semibold text-slate-400">
              <tr>
                <th className="py-3 px-4">Entity Key (Customer &amp; APN)</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Deed Owner / Public Record</th>
                <th className="py-3 px-4">Property Address &amp; ZIP</th>
                <th className="py-3 px-4">Source Channel</th>
                <th className="py-3 px-4 text-center">RapidFuzz Score</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                    No verified records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(({ pair, res }) => (
                  <tr key={pair.id} className="hover:bg-[#141825]/70 transition-colors">
                    {/* Entity Key */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-white font-medium">
                        {pair.customerId || 'CUST-AUTO'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {pair.parcelId || 'APN-PENDING'}
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-500" />
                        <span>{pair.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {pair.customerAddress}
                      </div>
                    </td>

                    {/* Deed Owner */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Building className="h-3 w-3 text-slate-500" />
                        <span>{pair.propertyOwnerName}</span>
                      </div>
                      {pair.notes && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-[220px]">
                          {pair.notes}
                        </div>
                      )}
                    </td>

                    {/* Property Address */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{pair.propertyAddress}</div>
                      <div className="font-mono text-[11px] text-emerald-400">
                        {pair.propertyZip}
                      </div>
                    </td>

                    {/* Source Channel */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          pair.sourceType === 'state_api'
                            ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80'
                        }`}
                      >
                        {pair.sourceType === 'state_api' ? 'State API' : 'Permitted Feed'}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                        {pair.sourceName || 'County Assessor'}
                      </div>
                    </td>

                    {/* Composite Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
                        {res.compositeScore}%
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {res.nameScore}N / {res.addressScore}A / {res.locationScore}L
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 text-xs">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verified Link</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
