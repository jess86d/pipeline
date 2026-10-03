import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2 } from 'lucide-react';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose }) => {
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedTs, setCopiedTs] = useState(false);
  const [activeTab, setActiveTab] = useState<'python_fuzzy' | 'python_norm' | 'typescript'>('python_fuzzy');

  if (!isOpen) return null;

  const pythonFuzzyCode = `from rapidfuzz import fuzz

def calculate_property_match(customer, property_record):
    customer_name = customer.get("name", "")
    property_owner_name = property_record.get("owner_name", "")
    customer_address = customer.get("address", "")
    property_address = property_record.get("property_address", "")
    customer_zip = customer.get("zip", "")
    property_zip = property_record.get("zip", "")

    # 1. Fuzzy Name Score (fuzz.token_set_ratio handles reordering & legal entity suffixes)
    name_score = fuzz.token_set_ratio(
        customer_name,
        property_owner_name
    )

    # 2. Fuzzy Address Score (handles abbreviations like Ave vs Avenue, Ste vs Suite)
    address_score = fuzz.token_set_ratio(
        customer_address,
        property_address
    )

    # 3. Location Score (exact 5-digit ZIP = 100, sectional 3-digit = 70, otherwise 0)
    if customer_zip and property_zip:
        czip = "".join(filter(str.isdigit, str(customer_zip)))[:5]
        pzip = "".join(filter(str.isdigit, str(property_zip)))[:5]
        if czip == pzip:
            location_score = 100.0
        elif czip[:3] == pzip[:3]:
            location_score = 70.0
        else:
            location_score = 0.0
    else:
        location_score = 50.0

    # 4. Composite Linkage Score
    score = (
        name_score * 0.45 +
        address_score * 0.35 +
        location_score * 0.20
    )

    return {
        "score": round(score, 2),
        "name_score": name_score,
        "address_score": address_score,
        "location_score": location_score,
        "is_match": score >= 75.0
    }`;

  const pythonNormCode = `def normalize_name(name):
    return (
        str(name)
        .upper()
        .strip()
        .replace(".", "")
        .replace(",", "")
    )

def normalize_zip(zip_code):
    return str(zip_code).strip()[:5]

def normalize_phone(phone):
    digits = "".join(c for c in str(phone) if c.isdigit())
    return digits[-10:]

# Example deduplication key generation:
def get_entity_key(name, zip_code, phone):
    return f"{normalize_name(name)}|{normalize_zip(zip_code)}|{normalize_phone(phone)}"`;

  const tsCode = `import { tokenSetRatio, calculateLocationScore } from './utils/fuzzy';

// 1. Fuzzy Name Matching
const name_score = tokenSetRatio(customer_name, property_owner_name);

// 2. Fuzzy Address Matching
const address_score = tokenSetRatio(customer_address, property_address);

// 3. Location Score
const location_score = calculateLocationScore(customer_zip, property_zip).score;

// 4. Composite Score
const score = (
  name_score * 0.45 +
  address_score * 0.35 +
  location_score * 0.20
);`;

  const getActiveCode = () => {
    if (activeTab === 'python_fuzzy') return pythonFuzzyCode;
    if (activeTab === 'python_norm') return pythonNormCode;
    return tsCode;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2000);
  };

  return (
    <div
      id="code-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="code-modal-container"
        className="w-full max-w-3xl rounded-xl border border-slate-800/90 bg-[#11141c] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#0e1118]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-600 p-2 text-white">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Normalization Source Code</h2>
              <p className="text-xs text-slate-400">Core cleansing logic in Python and TypeScript</p>
            </div>
          </div>
          <button
            id="close-code-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-between px-6 pt-4 border-b border-slate-800 bg-[#11141c] gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              id="tab-python-fuzzy-btn"
              onClick={() => setActiveTab('python_fuzzy')}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                activeTab === 'python_fuzzy'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="h-4 w-4" />
              Python (Fuzzy RapidFuzz)
            </button>
            <button
              id="tab-python-norm-btn"
              onClick={() => setActiveTab('python_norm')}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                activeTab === 'python_norm'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="h-4 w-4" />
              Python (Normalization)
            </button>
            <button
              id="tab-ts-btn"
              onClick={() => setActiveTab('typescript')}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                activeTab === 'typescript'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="h-4 w-4" />
              TypeScript (Engine)
            </button>
          </div>

          <button
            id="copy-active-code-btn"
            onClick={() => copyToClipboard(getActiveCode())}
            className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-[#161a24] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#1e2331] hover:text-white transition mb-2 sm:mb-0"
          >
            {copiedPython ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto bg-[#0a0b0e]">
          <pre className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed overflow-x-auto p-4 rounded-lg bg-[#0d1017] border border-slate-800/80">
            <code>{getActiveCode()}</code>
          </pre>

          {/* Rule Breakdown Explanation */}
          <div className="mt-4 rounded-lg bg-[#131722] border border-slate-800 p-4 text-xs text-slate-300 space-y-2">
            <h4 className="font-semibold text-slate-100 text-sm">
              {activeTab === 'python_fuzzy'
                ? 'Fuzzy Record Linkage & Scoring Breakdown:'
                : 'Deterministic Cleansing Rule Architecture:'}
            </h4>
            {activeTab === 'python_fuzzy' ? (
              <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                <li>
                  <strong className="text-slate-200">name_score (45% weight):</strong> Evaluates customer name against deed holder using <code className="text-emerald-400 font-mono">fuzz.token_set_ratio</code>. By taking the intersection and remainder of token sets, it resists transposed first/last names, missing middle initials, and added legal entities (e.g. &quot;Living Trust&quot;, &quot;LLC&quot;).
                </li>
                <li>
                  <strong className="text-slate-200">address_score (35% weight):</strong> Compares street address lines via token sets, absorbing street type abbreviations (Ave vs Avenue, St vs Street) and unit designations (Ste 300 vs Suite 300).
                </li>
                <li>
                  <strong className="text-slate-200">location_score (20% weight):</strong> Geographic proximity validation; exact 5-digit ZIP matches earn 100%, matching 3-digit regional sectional centers earn 70%, and disparate areas earn 0%.
                </li>
                <li>
                  <strong className="text-slate-200">score composite:</strong> Weighted combination provides a robust 0–100 confidence metric for automated deduplication and human review triage.
                </li>
              </ul>
            ) : (
              <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                <li>
                  <strong className="text-slate-200">normalize_name:</strong> Uppercasing prevents case mismatches, stripping cleans accidental space padding, and removing periods and commas cleans common abbreviations (Dr., Ph.D., Jr., Inc., Corp.).
                </li>
                <li>
                  <strong className="text-slate-200">normalize_zip:</strong> Slicing <code className="text-emerald-400 font-mono">[:5]</code> ensures 9-digit ZIP+4 formats resolve to canonical 5-digit postal code.
                </li>
                <li>
                  <strong className="text-slate-200">normalize_phone:</strong> Extracts numeric characters to drop parentheses and hyphens, then retains the last 10 digits to drop international country code prefixes.
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 bg-[#0e1118] px-6 py-3 flex justify-end">
          <button
            id="close-code-modal-bottom-btn"
            onClick={onClose}
            className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
