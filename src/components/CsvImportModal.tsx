import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Check } from 'lucide-react';
import { createRecord } from '../data/sampleRecords';
import { DataRecord } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: DataRecord[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const defaultText = `raw_name,raw_zip,raw_phone
"Dr. Albert E. Einstein, Ph.D.", "08540-1234", "+1 (609) 555-0100"
"albert e einstein phd", " 08540 ", "609.555.0100"
"Ada Lovelace, Countess", "WC1E 6BT", "+44 (020) 7946 0912"
"ada lovelace countess", "WC1E6", "02079460912"
"Nikola Tesla, Eng.", "10001", "(212) 555-7375"`;

  const [text, setText] = useState<string>(defaultText);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseAndImport = () => {
    try {
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        setError('Please enter at least one row of data.');
        return;
      }

      // Simple CSV line splitter that respects quoted strings
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if ((char === ',' || char === '\t') && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result.map((col) => col.replace(/^"(.*)"$/, '$1').trim());
      };

      let startIndex = 0;
      const firstLineCols = parseCSVLine(lines[0]).map((c) => c.toLowerCase());
      // Check if header row exists
      if (
        firstLineCols.some(
          (c) => c.includes('name') || c.includes('zip') || c.includes('phone')
        )
      ) {
        startIndex = 1;
      }

      const newRecords: DataRecord[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length >= 1) {
          const rawName = cols[0] || '';
          const rawZip = cols[1] || '';
          const rawPhone = cols[2] || '';
          newRecords.push(createRecord(rawName, rawZip, rawPhone));
        }
      }

      if (newRecords.length === 0) {
        setError('No valid rows found to import.');
        return;
      }

      onImport(newRecords);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error parsing CSV data');
    }
  };

  return (
    <div
      id="csv-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="csv-modal-container"
        className="w-full max-w-2xl rounded-xl border border-slate-800/90 bg-[#11141c] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#0e1118]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-600 p-2 text-white">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Import CSV / Text Records</h2>
              <p className="text-xs text-slate-400">Paste comma-separated or tab-separated data (Name, Zip, Phone)</p>
            </div>
          </div>
          <button
            id="close-csv-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-rose-950/40 border border-rose-900/80 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              CSV or Tab-Separated Data:
            </label>
            <textarea
              id="csv-import-textarea"
              rows={8}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              placeholder={`"Name", "Zip Code", "Phone Number"\n"Dr. Jane Doe, Jr.", "90210-1234", "+1 (310) 555-0199"`}
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="rounded-lg bg-[#131722] border border-slate-800 p-3 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-200 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              Column Order & Auto-Detection:
            </p>
            <p>
              Column 1: <strong className="text-slate-200">Name</strong> (will run through <code className="text-emerald-400 font-mono">normalize_name</code>)
            </p>
            <p>
              Column 2: <strong className="text-slate-200">ZIP Code</strong> (will run through <code className="text-emerald-400 font-mono">normalize_zip</code>)
            </p>
            <p>
              Column 3: <strong className="text-slate-200">Phone</strong> (will run through <code className="text-emerald-400 font-mono">normalize_phone</code>)
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-[#0e1118] px-6 py-3 flex items-center justify-between">
          <button
            id="reset-template-csv-btn"
            onClick={() => setText(defaultText)}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium underline"
          >
            Insert Example Records
          </button>

          <div className="flex gap-2">
            <button
              id="cancel-csv-btn"
              onClick={onClose}
              className="rounded-lg border border-slate-700/80 bg-[#161a24] px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#1e2331] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              id="submit-csv-import-btn"
              onClick={handleParseAndImport}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition flex items-center gap-1.5 shadow-xs"
            >
              <Check className="h-4 w-4" />
              Import & Normalize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
