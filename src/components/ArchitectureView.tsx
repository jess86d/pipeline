import React, { useState } from 'react';
import {
  Database,
  Server,
  CloudLightning,
  FileSpreadsheet,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  LayoutDashboard,
  ArrowDown,
  ArrowRight,
  Play,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { PropertyMatchPair, AppView } from '../types';
import { calculateCompositeMatchScore } from '../utils/fuzzy';

interface ArchitectureViewProps {
  pairs: PropertyMatchPair[];
  onNavigate: (view: AppView) => void;
  onSimulateIngest: () => void;
}

type NodeId =
  | 'system'
  | 'customer_db'
  | 'property_sources'
  | 'state_apis'
  | 'state_feeds'
  | 'ingestion'
  | 'normalization'
  | 'matching_engine'
  | 'high_confidence'
  | 'review_queue'
  | 'dashboard';

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  pairs,
  onNavigate,
  onSimulateIngest,
}) => {
  const [selectedNode, setSelectedNode] = useState<NodeId>('matching_engine');
  const [isSimulating, setIsSimulating] = useState(false);

  // Compute live pipeline statistics from pairs
  const evaluated = pairs.map((pair) => {
    const res = calculateCompositeMatchScore(
      { name: pair.customerName, address: pair.customerAddress, zip: pair.customerZip },
      { ownerName: pair.propertyOwnerName, address: pair.propertyAddress, zip: pair.propertyZip },
      { nameWeight: 0.45, addressWeight: 0.35, locationWeight: 0.2 }
    );
    return { pair, res };
  });

  const highConfCount = evaluated.filter(
    (e) => (e.pair.status === 'high_confidence' || e.res.compositeScore >= 75) && e.pair.status !== 'rejected'
  ).length;

  const reviewCount = evaluated.filter(
    (e) => e.pair.status === 'pending_review' || (e.res.compositeScore >= 50 && e.res.compositeScore < 75 && e.pair.status !== 'rejected')
  ).length;

  const stateApiCount = pairs.filter((p) => p.sourceType === 'state_api').length;
  const permittedFeedCount = pairs.filter((p) => p.sourceType === 'permitted_feed').length;

  const handleTriggerSimulate = () => {
    setIsSimulating(true);
    onSimulateIngest();
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Pipeline Control */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-[#101420] via-[#121827] to-[#101420] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-800/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HINDSIGHT360 Active Pipeline
              </span>
              <span className="text-xs text-slate-500 font-mono">v3.4.2 &bull; Production</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              End-to-End Enterprise Record Linkage Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Harmonizing internal customer records with state assessor APIs and permitted deed feeds through deterministic normalization and fuzzy token matching.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="simulate-ingest-btn"
              onClick={handleTriggerSimulate}
              disabled={isSimulating}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs sm:text-sm font-semibold transition shadow-xs disabled:opacity-50"
            >
              <RotateCw className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Ingesting Feeds...' : 'Trigger Pipeline Ingestion'}</span>
            </button>
            <button
              id="open-review-queue-quick"
              onClick={() => onNavigate('review')}
              className="flex items-center gap-2 rounded-lg border border-amber-800/70 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 px-3.5 py-2 text-xs sm:text-sm font-medium transition"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Review Queue ({reviewCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Architecture Interactive Flow Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Architecture Flow Canvas (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-[#0b0e16] p-6 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Interactive System Topology
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Click any component to inspect runtime telemetry
            </span>
          </div>

          {/* Diagram Tree */}
          <div className="min-w-[620px] flex flex-col items-center gap-3 text-slate-200">
            {/* System Root: HINDSIGHT360 */}
            <button
              id="node-system"
              onClick={() => setSelectedNode('system')}
              className={`w-72 text-center rounded-xl p-3 border transition-all ${
                selectedNode === 'system'
                  ? 'border-emerald-400 bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-700/80 bg-[#151926] hover:border-slate-600'
              }`}
            >
              <div className="font-bold text-sm tracking-wide text-white flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                HINDSIGHT360
              </div>
              <div className="text-[11px] text-slate-400">Unified Entity Resolution System</div>
            </button>

            {/* Vertical Connector Line */}
            <div className="w-0.5 h-5 bg-slate-700" />

            {/* Split Top Bar: Customer DB | Property Sources */}
            <div className="w-full flex justify-center">
              <div className="w-[80%] border-t-2 border-slate-700 relative">
                <div className="absolute left-0 top-0 w-0.5 h-4 bg-slate-700 -translate-x-1/2" />
                <div className="absolute right-0 top-0 w-0.5 h-4 bg-slate-700 translate-x-1/2" />
              </div>
            </div>

            {/* Level 1: Customer Database & Property Sources */}
            <div className="w-full grid grid-cols-2 gap-8 px-4">
              {/* Left Branch: Customer Database */}
              <div className="flex flex-col items-center">
                <button
                  id="node-customer-db"
                  onClick={() => setSelectedNode('customer_db')}
                  className={`w-full max-w-[260px] rounded-xl p-3.5 border transition-all text-left ${
                    selectedNode === 'customer_db'
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-800 bg-[#131722] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                    <Database className="h-4 w-4 text-emerald-400" />
                    Customer Database
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Internal client CRM & account repository
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Active Entities:</span>
                    <span className="text-emerald-400 font-bold">{pairs.length * 1840}</span>
                  </div>
                </button>

                {/* Long vertical path down to Normalization */}
                <div className="w-0.5 h-48 bg-slate-700 my-1 relative">
                  <div className="absolute top-1/2 -left-1.5 h-3 w-3 rounded-full bg-emerald-500/30 border border-emerald-400/80 animate-ping" />
                </div>
              </div>

              {/* Right Branch: Property Sources Sub-tree */}
              <div className="flex flex-col items-center">
                <button
                  id="node-property-sources"
                  onClick={() => setSelectedNode('property_sources')}
                  className={`w-full max-w-[260px] rounded-xl p-3.5 border transition-all text-left ${
                    selectedNode === 'property_sources'
                      ? 'border-blue-400 bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-800 bg-[#131722] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                    <Server className="h-4 w-4 text-blue-400" />
                    Property Sources
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Public registry & cadastral record feeds
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Total Connectors:</span>
                    <span className="text-blue-400 font-bold">2 Channels</span>
                  </div>
                </button>

                {/* Property Sources Split Line */}
                <div className="w-0.5 h-4 bg-slate-700" />
                <div className="w-[80%] border-t-2 border-slate-700 relative">
                  <div className="absolute left-0 top-0 w-0.5 h-3 bg-slate-700 -translate-x-1/2" />
                  <div className="absolute right-0 top-0 w-0.5 h-3 bg-slate-700 translate-x-1/2" />
                </div>

                {/* State APIs vs State Files / Feeds */}
                <div className="w-full grid grid-cols-2 gap-2 mt-1">
                  {/* State APIs */}
                  <button
                    id="node-state-apis"
                    onClick={() => setSelectedNode('state_apis')}
                    className={`rounded-lg p-2.5 border transition-all text-left ${
                      selectedNode === 'state_apis'
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-sm ring-1 ring-cyan-400/40'
                        : 'border-slate-800 bg-[#0f131c] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-cyan-300 font-medium text-xs">
                      <CloudLightning className="h-3.5 w-3.5" />
                      State APIs
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">/ Official Data</div>
                    <div className="mt-1 text-[10px] font-mono text-cyan-400">{stateApiCount} Active</div>
                  </button>

                  {/* State Files / Permitted Feeds */}
                  <button
                    id="node-state-feeds"
                    onClick={() => setSelectedNode('state_feeds')}
                    className={`rounded-lg p-2.5 border transition-all text-left ${
                      selectedNode === 'state_feeds'
                        ? 'border-indigo-400 bg-indigo-950/40 shadow-sm ring-1 ring-indigo-400/40'
                        : 'border-slate-800 bg-[#0f131c] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-indigo-300 font-medium text-xs">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      State Files /
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Permitted Feeds</div>
                    <div className="mt-1 text-[10px] font-mono text-indigo-400">{permittedFeedCount} Active</div>
                  </button>
                </div>

                {/* Join into Ingestion Service */}
                <div className="w-[80%] border-b-2 border-slate-700 mt-2 relative">
                  <div className="absolute left-0 bottom-0 w-0.5 h-2 bg-slate-700 -translate-x-1/2" />
                  <div className="absolute right-0 bottom-0 w-0.5 h-2 bg-slate-700 translate-x-1/2" />
                </div>
                <div className="w-0.5 h-3 bg-slate-700" />

                {/* Ingestion Service */}
                <button
                  id="node-ingestion"
                  onClick={() => setSelectedNode('ingestion')}
                  className={`w-full max-w-[240px] rounded-lg p-2.5 border transition-all text-center ${
                    selectedNode === 'ingestion'
                      ? 'border-purple-400 bg-purple-950/40 shadow-md ring-1 ring-purple-400/40'
                      : 'border-slate-800 bg-[#131622] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-white font-semibold text-xs">
                    <Server className="h-3.5 w-3.5 text-purple-400" />
                    Ingestion Service
                  </div>
                  <div className="text-[10px] text-slate-400">Stream buffering & payload mapping</div>
                </button>

                <div className="w-0.5 h-4 bg-slate-700" />
              </div>
            </div>

            {/* Convergence Bar into Normalization */}
            <div className="w-[60%] border-t-2 border-slate-700 relative -mt-3">
              <div className="absolute left-0 top-0 w-0.5 h-3 bg-slate-700 -translate-x-1/2" />
              <div className="absolute right-0 top-0 w-0.5 h-3 bg-slate-700 translate-x-1/2" />
            </div>
            <div className="w-0.5 h-3 bg-slate-700" />

            {/* Normalization Node */}
            <button
              id="node-normalization"
              onClick={() => setSelectedNode('normalization')}
              className={`w-80 rounded-xl p-3 border transition-all text-center ${
                selectedNode === 'normalization'
                  ? 'border-emerald-400 bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-800 bg-[#141824] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-white font-semibold text-sm">
                <Layers className="h-4 w-4 text-emerald-400" />
                Normalization Pipeline
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Uppercase &bull; Strip Punctuation &bull; 5-Digit ZIP &bull; Canonical Address
              </div>
            </button>

            {/* Down to Matching Engine */}
            <div className="w-0.5 h-4 bg-slate-700" />

            {/* Matching Engine Node */}
            <button
              id="node-matching-engine"
              onClick={() => setSelectedNode('matching_engine')}
              className={`w-96 rounded-xl p-3.5 border transition-all text-center ${
                selectedNode === 'matching_engine'
                  ? 'border-emerald-400 bg-emerald-950/40 shadow-lg ring-2 ring-emerald-500/30'
                  : 'border-slate-700/80 bg-[#161c2b] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
                <Cpu className="h-4 w-4 text-emerald-400" />
                Matching Engine (RapidFuzz Token Set)
              </div>
              <div className="font-mono text-[11px] text-emerald-300 mt-1">
                score = (name × 0.45) + (address × 0.35) + (location × 0.20)
              </div>
            </button>

            {/* Split from Matching Engine: High Confidence vs Review Queue */}
            <div className="w-0.5 h-4 bg-slate-700" />
            <div className="w-[65%] border-t-2 border-slate-700 relative">
              <div className="absolute left-0 top-0 w-0.5 h-3 bg-slate-700 -translate-x-1/2" />
              <div className="absolute right-0 top-0 w-0.5 h-3 bg-slate-700 translate-x-1/2" />
            </div>

            {/* Level 3: High Confidence | Review Queue */}
            <div className="w-full grid grid-cols-2 gap-8 px-4 mt-1">
              {/* High Confidence */}
              <button
                id="node-high-confidence"
                onClick={() => setSelectedNode('high_confidence')}
                className={`rounded-xl p-3 border transition-all text-center ${
                  selectedNode === 'high_confidence'
                    ? 'border-emerald-400 bg-emerald-950/50 shadow-md ring-2 ring-emerald-500/30'
                    : 'border-emerald-900/60 bg-[#0e1814] hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-semibold text-xs sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  High Confidence
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Automated Linkage (Score &ge; 75%)</div>
                <div className="mt-2 text-xs font-mono font-bold text-emerald-400">
                  {highConfCount} Verified Matches
                </div>
              </button>

              {/* Review Queue */}
              <button
                id="node-review-queue"
                onClick={() => setSelectedNode('review_queue')}
                className={`rounded-xl p-3 border transition-all text-center ${
                  selectedNode === 'review_queue'
                    ? 'border-amber-400 bg-amber-950/50 shadow-md ring-2 ring-amber-500/30'
                    : 'border-amber-900/60 bg-[#1c150c] hover:border-amber-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-amber-300 font-semibold text-xs sm:text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Review Queue
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Human Verification (Score 50–74%)</div>
                <div className="mt-2 text-xs font-mono font-bold text-amber-400">
                  {reviewCount} Pending Triage
                </div>
              </button>
            </div>

            {/* Merge down into React Dashboard */}
            <div className="w-[65%] border-b-2 border-slate-700 mt-2 relative">
              <div className="absolute left-0 bottom-0 w-0.5 h-2 bg-slate-700 -translate-x-1/2" />
              <div className="absolute right-0 bottom-0 w-0.5 h-2 bg-slate-700 translate-x-1/2" />
            </div>
            <div className="w-0.5 h-3 bg-slate-700" />

            {/* Target Node: React Dashboard */}
            <button
              id="node-dashboard"
              onClick={() => setSelectedNode('dashboard')}
              className={`w-80 rounded-xl p-3.5 border transition-all text-center ${
                selectedNode === 'dashboard'
                  ? 'border-emerald-400 bg-emerald-950/40 shadow-lg ring-2 ring-emerald-500/30'
                  : 'border-slate-800 bg-[#121622] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
                <LayoutDashboard className="h-4 w-4 text-emerald-400" />
                React Dashboard
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Operator analytics, audit workbench, and portfolio monitor
              </div>
            </button>
          </div>
        </div>

        {/* Node Telemetry & Specification Panel (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#0e111a] p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
              Component Telemetry
            </span>
            <h3 className="text-base font-bold text-white mt-1">
              {selectedNode === 'system' && 'HINDSIGHT360 Core'}
              {selectedNode === 'customer_db' && 'Customer Database'}
              {selectedNode === 'property_sources' && 'Property Source Aggregator'}
              {selectedNode === 'state_apis' && 'State APIs / Official Data'}
              {selectedNode === 'state_feeds' && 'State Files / Permitted Feeds'}
              {selectedNode === 'ingestion' && 'Ingestion Microservice'}
              {selectedNode === 'normalization' && 'Normalization Pipeline'}
              {selectedNode === 'matching_engine' && 'RapidFuzz Matching Engine'}
              {selectedNode === 'high_confidence' && 'High Confidence Linkage'}
              {selectedNode === 'review_queue' && 'Review Queue Triage'}
              {selectedNode === 'dashboard' && 'React Operator Dashboard'}
            </h3>
          </div>

          {/* Dynamic Content based on selected node */}
          {selectedNode === 'system' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                HINDSIGHT360 is the centralized entity resolution backbone connecting internal customer records to public cadastral property records across all 50 states.
              </p>
              <div className="rounded-lg bg-[#141824] p-3 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Pipeline Records:</span>
                  <span className="text-white font-semibold">{pairs.length * 2800}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Link Resolution Rate:</span>
                  <span className="text-emerald-400 font-semibold">93.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Human Audit Ratio:</span>
                  <span className="text-amber-400 font-semibold">6.6%</span>
                </div>
              </div>
            </div>
          )}

          {selectedNode === 'customer_db' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Serves as the internal customer authoritative source (CRM, banking origination, or policyholder ledger).
              </p>
              <div className="rounded-lg bg-[#141824] p-3 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-200">Key Customer Attributes:</div>
                <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
                  <li><code className="text-emerald-400">customer_name</code> (Full name, joint spouses, trusts)</li>
                  <li><code className="text-emerald-400">customer_address</code> (Residence, street, unit, suite)</li>
                  <li><code className="text-emerald-400">customer_zip</code> (5-digit or 9-digit postal code)</li>
                  <li><code className="text-emerald-400">customer_phone</code> (Cleaned E.164 canonical digits)</li>
                </ul>
              </div>
              <button
                onClick={() => onNavigate('batch')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#161b28] py-2 text-slate-200 hover:bg-[#1f2536] text-xs font-medium"
              >
                <span>View Customer Deduplicator Table</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {selectedNode === 'property_sources' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Multi-channel ingestion layer accepting both live synchronous API queries and scheduled bulk flat-file releases from municipal assessors.
              </p>
              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/60">
                  <div className="text-cyan-300 font-semibold">State APIs</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Real-time REST / GraphQL</div>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/60">
                  <div className="text-indigo-300 font-semibold">State Feeds</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Permitted CSV / Shapefiles</div>
                </div>
              </div>
            </div>
          )}

          {selectedNode === 'state_apis' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Live integration with state real property databases and county assessment districts (e.g. California Assessor API, Florida DOR Property Tax API, Travis CAD).
              </p>
              <div className="rounded-lg bg-[#141824] p-3 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">API Health:</span>
                  <span className="text-emerald-400">99.94% Uptime</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Roundtrip:</span>
                  <span className="text-white">142 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Handlers:</span>
                  <span className="text-cyan-400">CA, FL, IL, TX</span>
                </div>
              </div>
            </div>
          )}

          {selectedNode === 'state_feeds' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Batch ingestion pipelines processing permitted recurring GIS shapefiles, county deed recorder tax rolls, and bulk land records.
              </p>
              <div className="rounded-lg bg-[#141824] p-3 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Schedule:</span>
                  <span className="text-white">Hourly / Nightly Sync</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payload Format:</span>
                  <span className="text-indigo-400">GeoJSON &bull; Parquet &bull; CSV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Compression:</span>
                  <span className="text-white">GZIP &bull; SHA-256 Verified</span>
                </div>
              </div>
            </div>
          )}

          {selectedNode === 'ingestion' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Buffers incoming stream payloads, enforces schema contract compliance, sanitizes encodings, and deduplicates identical records at the gate.
              </p>
              <div className="rounded-lg bg-[#141824] p-3 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak Ingestion Rate:</span>
                  <span className="text-emerald-400">2,840 records / min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Schema Validation:</span>
                  <span className="text-emerald-400">100% Passing</span>
                </div>
              </div>
            </div>
          )}

          {selectedNode === 'normalization' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Executes standard cleaning rules across both customer inputs and deed records before running fuzzy algorithms.
              </p>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                <li>&bull; <strong className="text-slate-200">Name:</strong> Uppercase, strip titles, remove punctuation.</li>
                <li>&bull; <strong className="text-slate-200">ZIP:</strong> Slice <code className="text-emerald-400 font-mono">[:5]</code> to align ZIP+4 with 5-digit postal code.</li>
                <li>&bull; <strong className="text-slate-200">Phone:</strong> Keep trailing 10 numeric digits, drop country codes.</li>
                <li>&bull; <strong className="text-slate-200">Address:</strong> Expand/standardize suffixes (Ave, Ste, Blvd, St).</li>
              </ul>
              <button
                onClick={() => onNavigate('tester')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#161b28] py-2 text-slate-200 hover:bg-[#1f2536] text-xs font-medium"
              >
                <span>Launch Single Normalizer Sandbox</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {selectedNode === 'matching_engine' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Applies RapidFuzz <code className="text-emerald-400 font-mono">token_set_ratio</code> to compute an invariant similarity score, weighted for high-precision linkage:
              </p>
              <div className="rounded-lg bg-[#141824] p-3 border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Name Weight:</span>
                  <span className="font-mono text-emerald-400 font-bold">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Address Weight:</span>
                  <span className="font-mono text-blue-400 font-bold">35%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Location (ZIP) Weight:</span>
                  <span className="font-mono text-purple-400 font-bold">20%</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('fuzzy')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-medium shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Open Matching Engine Simulator</span>
              </button>
            </div>
          )}

          {selectedNode === 'high_confidence' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Candidate records achieving <code className="text-emerald-400 font-mono">&ge; 75.0%</code> composite score are automatically classified as verified property ownership links.
              </p>
              <div className="rounded-lg bg-emerald-950/30 p-3 border border-emerald-900/60 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total High Confidence:</span>
                  <span className="text-emerald-300 font-bold">{highConfCount} records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verification SLA:</span>
                  <span className="text-slate-200">Sub-second (&lt;50ms)</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('high_confidence')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-800/80 bg-emerald-950/50 py-2 text-emerald-300 hover:bg-emerald-900/60 text-xs font-medium"
              >
                <span>Browse High Confidence Registry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {selectedNode === 'review_queue' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Candidate matches scoring between <code className="text-amber-400 font-mono">50.0% – 74.9%</code> are routed into the Human-in-the-Loop review queue for compliance audit.
              </p>
              <div className="rounded-lg bg-amber-950/30 p-3 border border-amber-900/60 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Awaiting Audit:</span>
                  <span className="text-amber-300 font-bold">{reviewCount} records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Resolution:</span>
                  <span className="text-slate-200">&lt; 4 business hours</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('review')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-amber-800/80 bg-amber-950/50 py-2 text-amber-300 hover:bg-amber-900/60 text-xs font-medium"
              >
                <span>Enter Review Queue Triage</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {selectedNode === 'dashboard' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                The executive and operational dashboard providing search, audit history, token drilldown, and batch resolution across the entire HINDSIGHT360 lifecycle.
              </p>
              <div className="space-y-1 text-slate-400 text-[11px]">
                <div>&bull; Real-time confidence distributions</div>
                <div>&bull; Instant approve / reject controls</div>
                <div>&bull; Token set intersection visualizer</div>
                <div>&bull; Full Python / TypeScript snippet export</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#121622] p-4">
          <div className="text-xs text-slate-400">Total Ingested Pairs</div>
          <div className="text-2xl font-bold text-white mt-1">{pairs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-state coverage</div>
        </div>

        <div className="rounded-xl border border-emerald-900/60 bg-[#0e1814] p-4">
          <div className="text-xs text-emerald-400">High Confidence Matches</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{highConfCount}</div>
          <div className="text-[11px] text-emerald-500 mt-1">Auto-verified &ge;75%</div>
        </div>

        <div className="rounded-xl border border-amber-900/60 bg-[#1c150c] p-4">
          <div className="text-xs text-amber-400">Review Queue Items</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{reviewCount}</div>
          <div className="text-[11px] text-amber-500 mt-1">Human audit required</div>
        </div>

        <div className="rounded-xl border border-blue-900/60 bg-[#0e1422] p-4">
          <div className="text-xs text-blue-400">Active Property Sources</div>
          <div className="text-2xl font-bold text-blue-300 mt-1">{stateApiCount + permittedFeedCount}</div>
          <div className="text-[11px] text-blue-500 mt-1">APIs &amp; Permitted Feeds</div>
        </div>
      </div>
    </div>
  );
};
