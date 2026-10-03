import React, { useState, useMemo } from 'react';
import { DataRecord } from '../types';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
  AlertTriangle,
  Copy,
  FileSpreadsheet,
} from 'lucide-react';
import { createRecord } from '../data/sampleRecords';

interface BatchTableProps {
  records: DataRecord[];
  onAddRecord: (record: DataRecord) => void;
  onUpdateRecord: (record: DataRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenImport: () => void;
}

export const BatchTable: React.FC<BatchTableProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onOpenImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'duplicates' | 'modified'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editZip, setEditZip] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // New record inline state
  const [showAddRow, setShowAddRow] = useState(false);
  const [newName, setNewName] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Filter tab
      if (filterType === 'duplicates' && (rec.duplicateCount || 1) <= 1) {
        return false;
      }
      if (filterType === 'modified' && !rec.hasModifications) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName =
          rec.rawName.toLowerCase().includes(query) ||
          rec.normalizedName.toLowerCase().includes(query);
        const matchesZip =
          rec.rawZip.toLowerCase().includes(query) ||
          rec.normalizedZip.toLowerCase().includes(query);
        const matchesPhone =
          rec.rawPhone.toLowerCase().includes(query) ||
          rec.normalizedPhone.toLowerCase().includes(query);
        const matchesKey = rec.matchKey.toLowerCase().includes(query);
        return matchesName || matchesZip || matchesPhone || matchesKey;
      }

      return true;
    });
  }, [records, filterType, searchQuery]);

  const handleStartEdit = (rec: DataRecord) => {
    setEditingId(rec.id);
    setEditName(rec.rawName);
    setEditZip(rec.rawZip);
    setEditPhone(rec.rawPhone);
  };

  const handleSaveEdit = (id: string) => {
    const updated = createRecord(editName, editZip, editPhone, id);
    onUpdateRecord(updated);
    setEditingId(null);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() && !newZip.trim() && !newPhone.trim()) return;
    const rec = createRecord(newName, newZip, newPhone);
    onAddRecord(rec);
    setNewName('');
    setNewZip('');
    setNewPhone('');
    setShowAddRow(false);
  };

  const exportAsCsv = () => {
    const headers = [
      'Raw Name',
      'Normalized Name',
      'Raw Zip',
      'Normalized Zip',
      'Raw Phone',
      'Normalized Phone',
      'Match Key',
      'Is Duplicate',
    ];
    const rows = records.map((r) => [
      `"${r.rawName.replace(/"/g, '""')}"`,
      `"${r.normalizedName.replace(/"/g, '""')}"`,
      `"${r.rawZip.replace(/"/g, '""')}"`,
      `"${r.normalizedZip.replace(/"/g, '""')}"`,
      `"${r.rawPhone.replace(/"/g, '""')}"`,
      `"${r.normalizedPhone.replace(/"/g, '""')}"`,
      `"${r.matchKey.replace(/"/g, '""')}"`,
      (r.duplicateCount || 1) > 1 ? 'YES' : 'NO',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `normalized_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `normalized_records_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#11141c] shadow-sm overflow-hidden">
      {/* Table Controls Topbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="batch-search-input"
              type="text"
              placeholder="Search by name, zip, phone, or match key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-[#161a25] pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="add-record-btn"
              onClick={() => setShowAddRow(!showAddRow)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-500 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Record</span>
            </button>

            <button
              id="import-csv-modal-btn"
              onClick={onOpenImport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#161a24] px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-[#1e2331] hover:border-slate-700 transition"
            >
              <Upload className="h-4 w-4 text-slate-400" />
              <span>Import CSV</span>
            </button>

            <div className="flex rounded-lg border border-slate-800 bg-[#161a24] overflow-hidden">
              <button
                id="export-csv-btn"
                onClick={exportAsCsv}
                className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-[#1e2331] hover:text-white border-r border-slate-800 transition"
                title="Export as CSV"
              >
                <Download className="h-4 w-4 text-slate-400" />
                <span>CSV</span>
              </button>
              <button
                id="export-json-btn"
                onClick={exportAsJson}
                className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-[#1e2331] hover:text-white transition"
                title="Export as JSON"
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Filter View:
          </span>
          <button
            id="filter-all-btn"
            onClick={() => setFilterType('all')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterType === 'all'
                ? 'bg-slate-200 text-slate-900 font-semibold'
                : 'bg-[#161a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Records ({records.length})
          </button>
          <button
            id="filter-duplicates-btn"
            onClick={() => setFilterType('duplicates')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition flex items-center gap-1.5 ${
              filterType === 'duplicates'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-amber-950/40 text-amber-300 border border-amber-800/70 hover:bg-amber-900/30'
            }`}
          >
            <Layers className="h-3 w-3" />
            Duplicate Clusters ({records.filter((r) => (r.duplicateCount || 1) > 1).length})
          </button>
          <button
            id="filter-modified-btn"
            onClick={() => setFilterType('modified')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition flex items-center gap-1.5 ${
              filterType === 'modified'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/70 hover:bg-emerald-900/30'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            Sanitized / Modified ({records.filter((r) => r.hasModifications).length})
          </button>
        </div>
      </div>

      {/* Inline Add Record Form */}
      {showAddRow && (
        <form
          onSubmit={handleCreateNew}
          className="bg-[#131923] border-b border-emerald-900/70 p-4 transition"
        >
          <div className="text-xs font-bold text-emerald-300 mb-2 flex items-center justify-between">
            <span>Add New Raw Record to Deduplication Pool:</span>
            <button
              type="button"
              onClick={() => setShowAddRow(false)}
              className="text-emerald-400 hover:text-emerald-300 text-xs transition"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Name (e.g. Dr. John Doe, Jr.)
              </label>
              <input
                id="new-record-name-input"
                type="text"
                placeholder="Raw Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                ZIP Code (e.g. 90210-4321)
              </label>
              <input
                id="new-record-zip-input"
                type="text"
                placeholder="Raw ZIP Code"
                value={newZip}
                onChange={(e) => setNewZip(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Phone Number (e.g. +1 (310) 555-0199)
              </label>
              <div className="flex gap-2">
                <input
                  id="new-record-phone-input"
                  type="text"
                  placeholder="Raw Phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-[#0e1219] px-3 py-1.5 text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
                <button
                  id="confirm-add-record-btn"
                  type="submit"
                  className="shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Main Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0e1118] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-12">#</th>
              <th className="py-3 px-4 min-w-[180px]">Name (Raw → Clean)</th>
              <th className="py-3 px-4 min-w-[120px]">ZIP (Raw → 5 Digits)</th>
              <th className="py-3 px-4 min-w-[150px]">Phone (Raw → 10 Digits)</th>
              <th className="py-3 px-4 min-w-[200px]">Entity Match Key</th>
              <th className="py-3 px-4 w-28 text-center">Cluster Status</th>
              <th className="py-3 px-4 w-20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No records match your criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec, index) => {
                const isEditing = editingId === rec.id;
                const isDuplicate = (rec.duplicateCount || 1) > 1;

                if (isEditing) {
                  return (
                    <tr key={rec.id} className="bg-[#151c27]">
                      <td className="py-3 px-4 text-slate-500 font-mono">{index + 1}</td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded border border-slate-700 bg-[#0d1017] p-1 font-mono text-xs text-slate-100"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editZip}
                          onChange={(e) => setEditZip(e.target.value)}
                          className="w-full rounded border border-slate-700 bg-[#0d1017] p-1 font-mono text-xs text-slate-100"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full rounded border border-slate-700 bg-[#0d1017] p-1 font-mono text-xs text-slate-100"
                        />
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic font-mono text-[11px]">
                        Recalculated on save
                      </td>
                      <td className="py-3 px-4 text-center">-</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSaveEdit(rec.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-800/30 transition text-slate-200 ${
                      isDuplicate ? 'bg-amber-950/15' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-slate-500 font-mono">{index + 1}</td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-100 font-medium">
                        "{rec.normalizedName}"
                      </div>
                      {rec.rawName !== rec.normalizedName && (
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                          from: {rec.rawName}
                        </div>
                      )}
                    </td>

                    {/* Zip */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-100">
                        {rec.normalizedZip}
                      </div>
                      {rec.rawZip !== rec.normalizedZip && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          from: {rec.rawZip}
                        </div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-100">
                        {rec.normalizedPhone}
                      </div>
                      {rec.rawPhone !== rec.normalizedPhone && (
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                          from: {rec.rawPhone}
                        </div>
                      )}
                    </td>

                    {/* Match Key */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] font-mono font-bold text-emerald-300 bg-[#0d1017] px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[220px]">
                          {rec.matchKey}
                        </code>
                        <button
                          onClick={() => copyKey(rec.matchKey, rec.id)}
                          className="text-slate-400 hover:text-slate-200 transition"
                          title="Copy match key"
                        >
                          {copiedKeyId === rec.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Cluster Status */}
                    <td className="py-3 px-4 text-center">
                      {isDuplicate ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            rec.duplicateGroupColor ||
                            'bg-amber-950/60 text-amber-300 border-amber-800/80'
                          }`}
                        >
                          <Layers className="h-3 w-3" />
                          Duplicate ({rec.duplicateCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/80">
                          Unique
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`edit-record-${rec.id}`}
                          onClick={() => handleStartEdit(rec)}
                          className="text-slate-400 hover:text-slate-200 transition"
                          title="Edit raw values"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`delete-record-${rec.id}`}
                          onClick={() => onDeleteRecord(rec.id)}
                          className="text-slate-400 hover:text-rose-400 transition"
                          title="Delete record"
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

      {/* Table Footer */}
      <div className="border-t border-slate-800/80 bg-[#0e1118] px-4 py-3 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          Showing <strong>{filteredRecords.length}</strong> of{' '}
          <strong>{records.length}</strong> records
        </div>
        <div className="text-[11px] text-slate-500">
          Match Key format: <code>normalize_name|normalize_zip|normalize_phone</code>
        </div>
      </div>
    </div>
  );
};
