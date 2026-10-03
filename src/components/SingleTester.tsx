import React, { useState } from 'react';
import {
  analyzeNameNormalization,
  analyzeZipNormalization,
  analyzePhoneNormalization,
  getMatchKey,
} from '../utils/normalizer';
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  GitCompare,
  User,
  MapPin,
  Phone,
  Key,
} from 'lucide-react';

export const SingleTester: React.FC = () => {
  // Primary record state
  const [name, setName] = useState<string>('  Dr. Robert J. Downey, Jr.  ');
  const [zip, setZip] = useState<string>('90210-4321');
  const [phone, setPhone] = useState<string>('+1 (310) 555-0199 ext 4');

  // Second record for comparison test mode
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [nameB, setNameB] = useState<string>('robert j downey jr');
  const [zipB, setZipB] = useState<string>(' 90210 ');
  const [phoneB, setPhoneB] = useState<string>('310.555.0199');

  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Analysis
  const nameAnalysis = analyzeNameNormalization(name);
  const zipAnalysis = analyzeZipNormalization(zip);
  const phoneAnalysis = analyzePhoneNormalization(phone);
  const matchKeyA = getMatchKey(name, zip, phone);

  const matchKeyB = getMatchKey(nameB, zipB, phoneB);
  const isMatch = matchKeyA === matchKeyB && matchKeyA.length > 2;

  const copyKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const applyPreset = (presetType: 'doctor' | 'business' | 'clean' | 'international') => {
    if (presetType === 'doctor') {
      setName('  Dr. Jane M. Doe, Ph.D.  ');
      setZip('10001-4455');
      setPhone('+1 (212) 555-0123');

      setNameB('JANE M DOE PHD');
      setZipB('10001');
      setPhoneB('2125550123');
    } else if (presetType === 'business') {
      setName('Acme Logistics, Inc.');
      setZip('94103-1200');
      setPhone('1-415-555-9000');

      setNameB('  acme logistics inc  ');
      setZipB(' 94103 ');
      setPhoneB('(415) 555-9000');
    } else if (presetType === 'international') {
      setName('O. B. Wan Kenobi, Gen.');
      setZip('02138');
      setPhone('+1-617-555-0199');

      setNameB('ob wan kenobi gen');
      setZipB('02138-0000');
      setPhoneB('6175550199');
    } else {
      setName('Sarah Connor');
      setZip('90001');
      setPhone('213-555-0144');

      setNameB('sarah connor');
      setZipB(' 90001 ');
      setPhoneB('(213) 555-0144');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Presets */}
      <div className="rounded-xl border border-slate-800/90 bg-[#11141c] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Live Interactive Normalization Sandbox
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit the fields below to inspect the step-by-step transformation and deterministic match key.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 mr-1">Load Presets:</span>
            <button
              id="preset-doctor-btn"
              onClick={() => applyPreset('doctor')}
              className="rounded-md border border-slate-800 bg-[#161a24] px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-[#1f2433] hover:text-white hover:border-slate-700 transition"
            >
              Honorifics & Ph.D.
            </button>
            <button
              id="preset-business-btn"
              onClick={() => applyPreset('business')}
              className="rounded-md border border-slate-800 bg-[#161a24] px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-[#1f2433] hover:text-white hover:border-slate-700 transition"
            >
              Inc. & ZIP+4
            </button>
            <button
              id="preset-intl-btn"
              onClick={() => applyPreset('international')}
              className="rounded-md border border-slate-800 bg-[#161a24] px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-[#1f2433] hover:text-white hover:border-slate-700 transition"
            >
              Country Code (+1)
            </button>
          </div>
        </div>

        {/* Toggle comparison mode */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 select-none">
            <input
              id="toggle-compare-mode"
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <GitCompare className="h-4 w-4 text-slate-400" />
            Enable Two-Record Deduplication Matcher (Compare Variant A vs Variant B)
          </label>
          <span className="text-xs text-slate-500">
            Rules: <code className="font-mono text-emerald-400">upper + strip + strip[.,]</code>,{' '}
            <code className="font-mono text-emerald-400">[:5]</code>,{' '}
            <code className="font-mono text-emerald-400">digits[-10:]</code>
          </span>
        </div>
      </div>

      {/* Comparison Match Status Banner (if compare mode enabled) */}
      {compareMode && (
        <div
          id="comparison-status-banner"
          className={`rounded-xl border p-4 transition ${
            isMatch
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMatch ? (
                <div className="rounded-full bg-emerald-600 p-1.5 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-600 p-1.5 text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold">
                  {isMatch
                    ? 'Records Successfully Resolved to the Same Entity!'
                    : 'Records Do Not Match'}
                </h3>
                <p className="text-xs opacity-85 mt-0.5">
                  {isMatch
                    ? 'Despite different casing, punctuation, ZIP+4 suffix, or phone formatting, both inputs produce the exact same composite match key.'
                    : 'The normalized keys differ. Adjust the inputs or check differences in name, 5-digit zip, or 10-digit phone.'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono px-2 py-1 rounded bg-[#0a0d13]/80 border border-current font-semibold">
                {isMatch ? 'MATCH: TRUE' : 'MATCH: FALSE'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Record Inputs */}
      <div className={`grid gap-6 ${compareMode ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Record A */}
        <div className="rounded-xl border border-slate-800/90 bg-[#11141c] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                A
              </span>
              <h3 className="text-sm font-semibold text-slate-200">
                {compareMode ? 'Record Variant A (e.g. Web Form Submission)' : 'Active Test Record'}
              </h3>
            </div>
            <span className="text-xs text-slate-500">Raw Input</span>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              Name Input
            </label>
            <input
              id="input-record-a-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Robert J. Downey, Jr."
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>Normalized:</span>
              <span className="font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/70">
                "{nameAnalysis.normalized}"
              </span>
            </div>
          </div>

          {/* Zip Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              ZIP Code Input
            </label>
            <input
              id="input-record-a-zip"
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="e.g. 90210-4321"
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>Normalized:</span>
              <span className="font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/70">
                "{zipAnalysis.normalized}"
              </span>
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Phone Number Input
            </label>
            <input
              id="input-record-a-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (310) 555-0199"
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>Normalized (Last 10 Digits):</span>
              <span className="font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/70">
                "{phoneAnalysis.normalized}"
              </span>
            </div>
          </div>

          {/* Resulting Match Key for A */}
          <div className="rounded-lg bg-[#151923] border border-slate-800 p-3 mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-emerald-400" />
                Composite Match Key A
              </span>
              <button
                id="copy-match-key-a-btn"
                onClick={() => copyKey(matchKeyA)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
              >
                {copiedKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedKey ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="font-mono text-xs font-bold text-emerald-300 break-all bg-[#0d1017] p-2 rounded border border-slate-800">
              {matchKeyA || '<empty>'}
            </div>
          </div>
        </div>

        {/* Record B (in compare mode) */}
        {compareMode && (
          <div className="rounded-xl border border-slate-800/90 bg-[#11141c] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  B
                </span>
                <h3 className="text-sm font-semibold text-slate-200">
                  Record Variant B (e.g. Existing CRM Record)
                </h3>
              </div>
              <span className="text-xs text-slate-500">Variant Input</span>
            </div>

            {/* Name Input B */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Name Input
              </label>
              <input
                id="input-record-b-name"
                type="text"
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                placeholder="e.g. robert j downey jr"
                className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
              />
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>Normalized:</span>
                <span className="font-mono font-semibold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/70">
                  "{analyzeNameNormalization(nameB).normalized}"
                </span>
              </div>
            </div>

            {/* Zip Input B */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                ZIP Code Input
              </label>
              <input
                id="input-record-b-zip"
                type="text"
                value={zipB}
                onChange={(e) => setZipB(e.target.value)}
                placeholder="e.g. 90210"
                className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
              />
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>Normalized:</span>
                <span className="font-mono font-semibold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/70">
                  "{analyzeZipNormalization(zipB).normalized}"
                </span>
              </div>
            </div>

            {/* Phone Input B */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Phone Number Input
              </label>
              <input
                id="input-record-b-phone"
                type="text"
                value={phoneB}
                onChange={(e) => setPhoneB(e.target.value)}
                placeholder="e.g. 3105550199"
                className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
              />
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>Normalized (Last 10 Digits):</span>
                <span className="font-mono font-semibold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/70">
                  "{analyzePhoneNormalization(phoneB).normalized}"
                </span>
              </div>
            </div>

            {/* Resulting Match Key for B */}
            <div className="rounded-lg bg-[#151923] border border-slate-800 p-3 mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-blue-400" />
                  Composite Match Key B
                </span>
                <span className="text-xs text-slate-500">
                  {matchKeyA === matchKeyB ? 'Equals Key A' : 'Different'}
                </span>
              </div>
              <div
                className={`font-mono text-xs font-bold break-all p-2 rounded border ${
                  isMatch
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/70'
                    : 'bg-[#0d1017] text-slate-200 border-slate-800'
                }`}
              >
                {matchKeyB || '<empty>'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step-by-Step Python Pipeline Breakdown */}
      <div className="rounded-xl border border-slate-800/90 bg-[#11141c] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-1">
          Pipeline Transformation Breakdown
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Observe how each Python method changes the raw data sequentially.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name Pipeline */}
          <div className="rounded-lg border border-slate-800/80 bg-[#141822] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  normalize_name(name)
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-[#0d1017] px-1.5 py-0.5 rounded border border-slate-800">
                  {nameAnalysis.modifications.length} changes
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {nameAnalysis.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border ${
                      s.changed
                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                        : 'bg-[#0e1118] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-300">{s.label}</span>
                      <code className="text-emerald-400 font-mono text-[10px]">{s.operation}</code>
                    </div>
                    <div className="font-bold truncate text-slate-100">"{s.value}"</div>
                    {s.notes && (
                      <div className="text-[10px] font-sans text-slate-500 mt-1">{s.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <span className="text-[11px] font-sans text-slate-500 block">Final Output:</span>
              <span className="font-bold text-emerald-400 truncate block">"{nameAnalysis.normalized}"</span>
            </div>
          </div>

          {/* Zip Pipeline */}
          <div className="rounded-lg border border-slate-800/80 bg-[#141822] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  normalize_zip(zip_code)
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-[#0d1017] px-1.5 py-0.5 rounded border border-slate-800">
                  {zipAnalysis.modifications.length} changes
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {zipAnalysis.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border ${
                      s.changed
                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                        : 'bg-[#0e1118] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-300">{s.label}</span>
                      <code className="text-emerald-400 font-mono text-[10px]">{s.operation}</code>
                    </div>
                    <div className="font-bold truncate text-slate-100">"{s.value}"</div>
                    {s.notes && (
                      <div className="text-[10px] font-sans text-slate-500 mt-1">{s.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <span className="text-[11px] font-sans text-slate-500 block">Final Output:</span>
              <span className="font-bold text-emerald-400 truncate block">"{zipAnalysis.normalized}"</span>
            </div>
          </div>

          {/* Phone Pipeline */}
          <div className="rounded-lg border border-slate-800/80 bg-[#141822] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  normalize_phone(phone)
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-[#0d1017] px-1.5 py-0.5 rounded border border-slate-800">
                  {phoneAnalysis.modifications.length} changes
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {phoneAnalysis.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border ${
                      s.changed
                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                        : 'bg-[#0e1118] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-300">{s.label}</span>
                      <code className="text-emerald-400 font-mono text-[10px]">{s.operation}</code>
                    </div>
                    <div className="font-bold truncate text-slate-100">"{s.value}"</div>
                    {s.notes && (
                      <div className="text-[10px] font-sans text-slate-500 mt-1">{s.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <span className="text-[11px] font-sans text-slate-500 block">Final Output:</span>
              <span className="font-bold text-emerald-400 truncate block">"{phoneAnalysis.normalized}"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
