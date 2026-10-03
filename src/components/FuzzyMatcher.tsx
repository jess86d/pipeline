import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Trash2,
  Search,
  BookOpen,
} from 'lucide-react';
import { calculateCompositeMatchScore, analyzeTokenSetRatio, calculateLocationScore } from '../utils/fuzzy';
import { samplePropertyPairs } from '../data/samplePropertyPairs';
import { PropertyMatchPair } from '../types';

interface FuzzyMatcherProps {
  onOpenCodeModal: () => void;
}

export const FuzzyMatcher: React.FC<FuzzyMatcherProps> = ({ onOpenCodeModal }) => {
  // Active test inputs
  const [customerName, setCustomerName] = useState('Jonathan R. Smith');
  const [customerAddress, setCustomerAddress] = useState('124 Maple Ave, Suite 300');
  const [customerZip, setCustomerZip] = useState('90210');

  const [propertyOwnerName, setPropertyOwnerName] = useState('SMITH JONATHAN ROBERT LIVING TRUST');
  const [propertyAddress, setPropertyAddress] = useState('124 MAPLE AVENUE STE 300');
  const [propertyZip, setPropertyZip] = useState('90210-4321');

  // Weights (Default to exact user formula: 0.45, 0.35, 0.20)
  const [nameWeight, setNameWeight] = useState(0.45);
  const [addressWeight, setAddressWeight] = useState(0.35);
  const [locationWeight, setLocationWeight] = useState(0.20);
  const [showAdvancedWeights, setShowAdvancedWeights] = useState(false);

  // Match threshold
  const [threshold, setThreshold] = useState(75);

  // Batch property pairs
  const [pairs, setPairs] = useState<PropertyMatchPair[]>(samplePropertyPairs);
  const [batchSearch, setBatchSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState<'all' | 'match' | 'review' | 'nomatch'>('all');
  const [copiedFormula, setCopiedFormula] = useState(false);

  // Show new pair form
  const [showAddPair, setShowAddPair] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');
  const [newCustZip, setNewCustZip] = useState('');
  const [newPropOwner, setNewPropOwner] = useState('');
  const [newPropAddr, setNewPropAddr] = useState('');
  const [newPropZip, setNewPropZip] = useState('');

  // Calculate live match score
  const matchResult = useMemo(() => {
    return calculateCompositeMatchScore(
      { name: customerName, address: customerAddress, zip: customerZip },
      { ownerName: propertyOwnerName, address: propertyAddress, zip: propertyZip },
      { nameWeight, addressWeight, locationWeight }
    );
  }, [customerName, customerAddress, customerZip, propertyOwnerName, propertyAddress, propertyZip, nameWeight, addressWeight, locationWeight]);

  // Evaluated batch pairs
  const evaluatedPairs = useMemo(() => {
    return pairs.map((pair) => {
      const res = calculateCompositeMatchScore(
        { name: pair.customerName, address: pair.customerAddress, zip: pair.customerZip },
        { ownerName: pair.propertyOwnerName, address: pair.propertyAddress, zip: pair.propertyZip },
        { nameWeight, addressWeight, locationWeight }
      );
      return { pair, res };
    });
  }, [pairs, nameWeight, addressWeight, locationWeight]);

  const filteredBatchPairs = useMemo(() => {
    return evaluatedPairs.filter(({ pair, res }) => {
      // Filter type
      if (batchFilter === 'match' && res.compositeScore < threshold) return false;
      if (batchFilter === 'review' && (res.compositeScore >= threshold || res.compositeScore < 55)) return false;
      if (batchFilter === 'nomatch' && res.compositeScore >= 55) return false;

      // Search query
      if (!batchSearch.trim()) return true;
      const q = batchSearch.toLowerCase();
      return (
        pair.customerName.toLowerCase().includes(q) ||
        pair.propertyOwnerName.toLowerCase().includes(q) ||
        pair.customerAddress.toLowerCase().includes(q) ||
        pair.propertyAddress.toLowerCase().includes(q) ||
        (pair.notes && pair.notes.toLowerCase().includes(q))
      );
    });
  }, [evaluatedPairs, batchFilter, batchSearch, threshold]);

  const handleSelectPreset = (pair: PropertyMatchPair) => {
    setCustomerName(pair.customerName);
    setCustomerAddress(pair.customerAddress);
    setCustomerZip(pair.customerZip);
    setPropertyOwnerName(pair.propertyOwnerName);
    setPropertyAddress(pair.propertyAddress);
    setPropertyZip(pair.propertyZip);
  };

  const handleResetWeights = () => {
    setNameWeight(0.45);
    setAddressWeight(0.35);
    setLocationWeight(0.20);
  };

  const handleCopyFormulaSnippet = () => {
    const snippet = `name_score = fuzz.token_set_ratio(customer_name, property_owner_name)
address_score = fuzz.token_set_ratio(customer_address, property_address)
score = (
    name_score * ${nameWeight.toFixed(2)} +
    address_score * ${addressWeight.toFixed(2)} +
    location_score * ${locationWeight.toFixed(2)}
)`;
    navigator.clipboard.writeText(snippet);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  const handleAddCustomPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() && !newPropOwner.trim()) return;

    const newPair: PropertyMatchPair = {
      id: `pair-${Date.now()}`,
      customerName: newCustName.trim(),
      customerAddress: newCustAddr.trim(),
      customerZip: newCustZip.trim(),
      propertyOwnerName: newPropOwner.trim(),
      propertyAddress: newPropAddr.trim(),
      propertyZip: newPropZip.trim(),
      notes: 'Custom user-entered pair',
    };

    setPairs([newPair, ...pairs]);
    handleSelectPreset(newPair);
    setNewCustName('');
    setNewCustAddr('');
    setNewCustZip('');
    setNewPropOwner('');
    setNewPropAddr('');
    setNewPropZip('');
    setShowAddPair(false);
  };

  const handleDeletePair = (id: string) => {
    setPairs(pairs.filter((p) => p.id !== id));
  };

  // Weighted contributions
  const nameContribution = (matchResult.nameScore * nameWeight);
  const addressContribution = (matchResult.addressScore * addressWeight);
  const locationContribution = (matchResult.locationScore * locationWeight);

  const isMatched = matchResult.compositeScore >= threshold;
  const isReview = !isMatched && matchResult.compositeScore >= 55;

  return (
    <div className="space-y-6">
      {/* Top Banner: Formula & Python RapidFuzz Implementation */}
      <div className="rounded-xl border border-slate-800/90 bg-[#11141c] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Fuzzy Record Linkage
              </span>
              <span className="text-xs text-slate-400 font-mono">fuzz.token_set_ratio + Weighted Composite</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Customer vs Property Owner Record Matcher
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Calculates matching confidence using token set ratios across customer names and property deeds,
              tolerating reordered words, legal entity suffixes, and address abbreviations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-fuzzy-code-btn"
              onClick={handleCopyFormulaSnippet}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#161a25] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#1e2333] hover:text-white transition"
              title="Copy Python formula"
            >
              {copiedFormula ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Formula Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Formula</span>
                </>
              )}
            </button>
            <button
              id="view-fuzzy-code-btn"
              onClick={onOpenCodeModal}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition shadow-xs"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>View Code</span>
            </button>
          </div>
        </div>

        {/* Live Mathematical Formula Visualization */}
        <div className="mt-4 rounded-lg bg-[#0d1017] border border-slate-800/80 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400">Composite Score =</span>
              <span className="bg-blue-950/50 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded">
                name_score × {nameWeight.toFixed(2)} ({matchResult.nameScore}% × {nameWeight} = <strong className="text-blue-200">{nameContribution.toFixed(1)}</strong>)
              </span>
              <span className="text-slate-500">+</span>
              <span className="bg-purple-950/50 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded">
                address_score × {addressWeight.toFixed(2)} ({matchResult.addressScore}% × {addressWeight} = <strong className="text-purple-200">{addressContribution.toFixed(1)}</strong>)
              </span>
              <span className="text-slate-500">+</span>
              <span className="bg-amber-950/50 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded">
                location_score × {locationWeight.toFixed(2)} ({matchResult.locationScore}% × {locationWeight} = <strong className="text-amber-200">{locationContribution.toFixed(1)}</strong>)
              </span>
              <span className="text-slate-500">=</span>
              <span className={`px-2.5 py-0.5 rounded font-bold text-sm border ${
                isMatched
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : isReview
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                  : 'bg-rose-950/60 text-rose-300 border-rose-800'
              }`}>
                {matchResult.compositeScore.toFixed(1)}%
              </span>
            </div>

            <button
              id="toggle-weights-btn"
              onClick={() => setShowAdvancedWeights(!showAdvancedWeights)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
            >
              <Sliders className="h-3 w-3" />
              <span>{showAdvancedWeights ? 'Hide Weights' : 'Adjust Weights'}</span>
            </button>
          </div>

          {/* Advanced Weight Adjustments */}
          {showAdvancedWeights && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Name Weight: <strong className="text-blue-300">{Math.round(nameWeight * 100)}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={nameWeight}
                  onChange={(e) => setNameWeight(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Address Weight: <strong className="text-purple-300">{Math.round(addressWeight * 100)}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={addressWeight}
                  onChange={(e) => setAddressWeight(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Location Weight: <strong className="text-amber-300">{Math.round(locationWeight * 100)}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={locationWeight}
                  onChange={(e) => setLocationWeight(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1">
                    Match Threshold: <strong className="text-emerald-300">{threshold}%</strong>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <button
                  onClick={handleResetWeights}
                  className="p-1.5 rounded bg-[#161a25] border border-slate-700 text-slate-400 hover:text-slate-200"
                  title="Reset to 0.45 / 0.35 / 0.20 defaults"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          Quick Test Scenarios:
        </span>
        {samplePropertyPairs.slice(0, 5).map((pair, idx) => (
          <button
            key={pair.id}
            id={`preset-pair-${idx}`}
            onClick={() => handleSelectPreset(pair)}
            className="rounded-lg border border-slate-800/80 bg-[#11141c] hover:bg-[#161a25] hover:border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition"
          >
            {pair.customerName} vs {pair.propertyOwnerName.split(' ')[0]}...
          </button>
        ))}
      </div>

      {/* Primary Comparison Card: Customer vs Property Owner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Customer Record Inputs (Left 5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800/90 bg-[#11141c] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                1. Customer Record
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Source: CRM / Application</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Customer Full Name (<code className="text-blue-400 font-mono">customer_name</code>)
            </label>
            <input
              id="input-customer-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Jonathan R. Smith"
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Customer Address (<code className="text-blue-400 font-mono">customer_address</code>)
            </label>
            <input
              id="input-customer-address"
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="e.g. 124 Maple Ave, Suite 300"
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              ZIP Code (<code className="text-blue-400 font-mono">customer_zip</code>)
            </label>
            <input
              id="input-customer-zip"
              type="text"
              value={customerZip}
              onChange={(e) => setCustomerZip(e.target.value)}
              placeholder="e.g. 90210"
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
            />
          </div>
        </div>

        {/* Property Deed / Registry Inputs (Right 5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800/90 bg-[#11141c] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                2. Property / County Deed Record
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Source: Assessor Registry</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Property Owner Name (<code className="text-purple-400 font-mono">property_owner_name</code>)
            </label>
            <input
              id="input-property-owner-name"
              type="text"
              value={propertyOwnerName}
              onChange={(e) => setPropertyOwnerName(e.target.value)}
              placeholder="e.g. SMITH JONATHAN ROBERT LIVING TRUST"
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Property Address (<code className="text-purple-400 font-mono">property_address</code>)
            </label>
            <input
              id="input-property-address"
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="e.g. 124 MAPLE AVENUE STE 300"
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Property ZIP Code (<code className="text-purple-400 font-mono">property_zip</code>)
            </label>
            <input
              id="input-property-zip"
              type="text"
              value={propertyZip}
              onChange={(e) => setPropertyZip(e.target.value)}
              placeholder="e.g. 90210-4321"
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden font-mono"
            />
          </div>
        </div>

        {/* Score Card & Verdict (Right 2 cols / Full width on mobile) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/90 bg-[#11141c] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Match Verdict
            </div>

            <div className={`p-4 rounded-xl border text-center ${
              isMatched
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : isReview
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
            }`}>
              <div className="text-3xl font-black font-mono tracking-tight">
                {matchResult.compositeScore.toFixed(1)}%
              </div>
              <div className="mt-1 text-xs font-bold uppercase flex items-center justify-center gap-1">
                {isMatched ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Match Verified</span>
                  </>
                ) : isReview ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Review Needed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span>No Match</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Threshold: {threshold}%
              </div>
            </div>

            {/* Score Breakdown List */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Name (45%):</span>
                <span className="font-mono font-bold text-blue-400">{matchResult.nameScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Address (35%):</span>
                <span className="font-mono font-bold text-purple-400">{matchResult.addressScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Location (20%):</span>
                <span className="font-mono font-bold text-amber-400">{matchResult.locationScore}%</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-4 text-[11px] text-slate-400">
            {matchResult.locationMatchDetail}
          </div>
        </div>
      </div>

      {/* Deep Token Set Ratio Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Name Token Breakdown */}
        <div className="rounded-xl border border-slate-800/90 bg-[#11141c] p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-100">
                Name: <code>fuzz.token_set_ratio</code> Breakdown
              </h4>
            </div>
            <span className="font-mono text-sm font-bold text-blue-400">
              {matchResult.nameScore}%
            </span>
          </div>

          {/* Tokens Visualizer */}
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="text-[11px] text-slate-400 mb-1">
                Customer Name Tokens:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.nameAnalysis.tokens1.map((tok, i) => {
                  const isShared = matchResult.nameAnalysis.intersection.includes(tok);
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                        isShared
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : 'bg-blue-950/40 text-blue-300 border-blue-800/60'
                      }`}
                    >
                      {tok} {isShared && '✓'}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-1">
                Property Owner Name Tokens:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.nameAnalysis.tokens2.map((tok, i) => {
                  const isShared = matchResult.nameAnalysis.intersection.includes(tok);
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                        isShared
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                      }`}
                    >
                      {tok} {isShared && '✓'}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-[#0d1017] border border-slate-800/80 p-2.5 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Common Intersection Tokens (T0):</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  [{matchResult.nameAnalysis.intersection.join(', ') || 'None'}]
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unique to Customer (Diff 1):</span>
                <span className="text-blue-300 font-mono">
                  [{matchResult.nameAnalysis.diff1.join(', ') || 'None'}]
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unique to Property (Diff 2):</span>
                <span className="text-purple-300 font-mono">
                  [{matchResult.nameAnalysis.diff2.join(', ') || 'None'}]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Address Token Breakdown */}
        <div className="rounded-xl border border-slate-800/90 bg-[#11141c] p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-slate-100">
                Address: <code>fuzz.token_set_ratio</code> Breakdown
              </h4>
            </div>
            <span className="font-mono text-sm font-bold text-purple-400">
              {matchResult.addressScore}%
            </span>
          </div>

          {/* Tokens Visualizer */}
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="text-[11px] text-slate-400 mb-1">
                Customer Address Tokens:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.addressAnalysis.tokens1.map((tok, i) => {
                  const isShared = matchResult.addressAnalysis.intersection.includes(tok);
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                        isShared
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : 'bg-blue-950/40 text-blue-300 border-blue-800/60'
                      }`}
                    >
                      {tok} {isShared && '✓'}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-1">
                Property Address Tokens:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.addressAnalysis.tokens2.map((tok, i) => {
                  const isShared = matchResult.addressAnalysis.intersection.includes(tok);
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                        isShared
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                      }`}
                    >
                      {tok} {isShared && '✓'}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-[#0d1017] border border-slate-800/80 p-2.5 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Common Intersection Tokens (T0):</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  [{matchResult.addressAnalysis.intersection.join(', ') || 'None'}]
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unique to Customer (Diff 1):</span>
                <span className="text-blue-300 font-mono">
                  [{matchResult.addressAnalysis.diff1.join(', ') || 'None'}]
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unique to Property (Diff 2):</span>
                <span className="text-purple-300 font-mono">
                  [{matchResult.addressAnalysis.diff2.join(', ') || 'None'}]
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Records Evaluation Table */}
      <div className="rounded-xl border border-slate-800/90 bg-[#11141c] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Batch Record Linkage Evaluator
              </h3>
              <p className="text-xs text-slate-400">
                Simultaneously score customer applications against deeds to isolate authentic owners
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="add-custom-pair-btn"
                onClick={() => setShowAddPair(!showAddPair)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Add Pair to Test</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search pairs by customer, owner, address..."
                value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBatchFilter('all')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  batchFilter === 'all'
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'bg-[#161a24] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({evaluatedPairs.length})
              </button>
              <button
                onClick={() => setBatchFilter('match')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  batchFilter === 'match'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/70 hover:bg-emerald-900/30'
                }`}
              >
                High Matches (≥{threshold}%)
              </button>
              <button
                onClick={() => setBatchFilter('review')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  batchFilter === 'review'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-amber-950/40 text-amber-300 border border-amber-800/70 hover:bg-amber-900/30'
                }`}
              >
                Review (55-{threshold}%)
              </button>
              <button
                onClick={() => setBatchFilter('nomatch')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  batchFilter === 'nomatch'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-800/70 hover:bg-rose-900/30'
                }`}
              >
                No Match (&lt;55%)
              </button>
            </div>
          </div>
        </div>

        {/* Add Custom Pair Form */}
        {showAddPair && (
          <form
            onSubmit={handleAddCustomPair}
            className="bg-[#131923] border-b border-emerald-900/70 p-4 transition"
          >
            <div className="text-xs font-bold text-emerald-300 mb-3 flex items-center justify-between">
              <span>Add Custom Customer & Property Pair:</span>
              <button
                type="button"
                onClick={() => setShowAddPair(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-blue-300">Customer Data:</div>
                <input
                  placeholder="Customer Name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 font-mono"
                  required
                />
                <input
                  placeholder="Customer Address"
                  value={newCustAddr}
                  onChange={(e) => setNewCustAddr(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 font-mono"
                  required
                />
                <input
                  placeholder="Customer ZIP"
                  value={newCustZip}
                  onChange={(e) => setNewCustZip(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-purple-300">Property Deed Data:</div>
                <input
                  placeholder="Property Owner Name"
                  value={newPropOwner}
                  onChange={(e) => setNewPropOwner(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 font-mono"
                  required
                />
                <input
                  placeholder="Property Address"
                  value={newPropAddr}
                  onChange={(e) => setNewPropAddr(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 font-mono"
                  required
                />
                <input
                  placeholder="Property ZIP"
                  value={newPropZip}
                  onChange={(e) => setNewPropZip(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                Add & Test Pair
              </button>
            </div>
          </form>
        )}

        {/* Table of pairs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0e1118] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer Record</th>
                <th className="py-3 px-4">Property Deed Record</th>
                <th className="py-3 px-4 text-center">Name (45%)</th>
                <th className="py-3 px-4 text-center">Address (35%)</th>
                <th className="py-3 px-4 text-center">Location (20%)</th>
                <th className="py-3 px-4 text-center">Composite Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredBatchPairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No customer/property pairs match your filter.
                  </td>
                </tr>
              ) : (
                filteredBatchPairs.map(({ pair, res }, index) => {
                  const isPairMatch = res.compositeScore >= threshold;
                  const isPairReview = !isPairMatch && res.compositeScore >= 55;

                  return (
                    <tr
                      key={pair.id}
                      className="hover:bg-slate-800/30 transition text-slate-200"
                    >
                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-100">
                          {pair.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {pair.customerAddress}, {pair.customerZip}
                        </div>
                        {pair.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            {pair.notes}
                          </div>
                        )}
                      </td>

                      {/* Property */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-100">
                          {pair.propertyOwnerName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {pair.propertyAddress}, {pair.propertyZip}
                        </div>
                      </td>

                      {/* Name Score */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-blue-400">
                          {res.nameScore}%
                        </span>
                      </td>

                      {/* Address Score */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-purple-400">
                          {res.addressScore}%
                        </span>
                      </td>

                      {/* Location Score */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-amber-400">
                          {res.locationScore}%
                        </span>
                      </td>

                      {/* Composite Score */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isPairMatch
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                              : isPairReview
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                              : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                          }`}
                        >
                          {res.compositeScore.toFixed(1)}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`load-pair-${pair.id}`}
                            onClick={() => handleSelectPreset(pair)}
                            className="rounded px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-950/40 border border-emerald-800/60 transition"
                            title="Load into inspector"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDeletePair(pair.id)}
                            className="text-slate-500 hover:text-rose-400 transition p-1"
                            title="Delete pair"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/80 bg-[#0e1118] px-4 py-3 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            Showing <strong>{filteredBatchPairs.length}</strong> of{' '}
            <strong>{pairs.length}</strong> evaluated property pairs
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            score = (name_score * {nameWeight.toFixed(2)}) + (address_score * {addressWeight.toFixed(2)}) + (location_score * {locationWeight.toFixed(2)})
          </div>
        </div>
      </div>
    </div>
  );
};
