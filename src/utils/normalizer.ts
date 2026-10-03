import { TransformationDetail } from '../types';

/**
 * Exact translation of:
 * def normalize_name(name):
 *     return (
 *         str(name)
 *         .upper()
 *         .strip()
 *         .replace(".", "")
 *         .replace(",", "")
 *     )
 */
export function normalizeName(name: unknown): string {
  if (name === null || name === undefined) return '';
  return String(name)
    .toUpperCase()
    .trim()
    .replaceAll('.', '')
    .replaceAll(',', '');
}

/**
 * Exact translation of:
 * def normalize_zip(zip_code):
 *     return str(zip_code).strip()[:5]
 */
export function normalizeZip(zipCode: unknown): string {
  if (zipCode === null || zipCode === undefined) return '';
  return String(zipCode).trim().slice(0, 5);
}

/**
 * Exact translation of:
 * def normalize_phone(phone):
 *     digits = "".join(c for c in str(phone) if c.isdigit())
 *     return digits[-10:]
 */
export function normalizePhone(phone: unknown): string {
  if (phone === null || phone === undefined) return '';
  const digits = Array.from(String(phone))
    .filter((c) => c >= '0' && c <= '9')
    .join('');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Generates the unified deduplication match key
 */
export function getMatchKey(name: string, zip: string, phone: string): string {
  return `${normalizeName(name)}|${normalizeZip(zip)}|${normalizePhone(phone)}`;
}

/**
 * Detailed step-by-step analysis for Name normalization
 */
export function analyzeNameNormalization(raw: string): TransformationDetail {
  const original = String(raw ?? '');
  const stepUpper = original.toUpperCase();
  const stepStrip = stepUpper.trim();
  const stepNoPeriod = stepStrip.replaceAll('.', '');
  const finalVal = stepNoPeriod.replaceAll(',', '');

  const modifications: string[] = [];
  if (original !== stepUpper) modifications.push('Converted to uppercase');
  if (stepUpper !== stepStrip) modifications.push('Stripped outer whitespace');
  if (stepStrip.includes('.')) modifications.push('Removed periods (.)');
  if (stepNoPeriod.includes(',')) modifications.push('Removed commas (,)');

  return {
    original,
    normalized: finalVal,
    modifications,
    steps: [
      {
        label: 'Original String',
        operation: 'str(name)',
        value: original,
        changed: false,
      },
      {
        label: 'Uppercase',
        operation: '.upper()',
        value: stepUpper,
        changed: original !== stepUpper,
        notes: original !== stepUpper ? 'Standardized letter casing' : 'Already uppercase',
      },
      {
        label: 'Trim Whitespace',
        operation: '.strip()',
        value: stepStrip,
        changed: stepUpper !== stepStrip,
        notes: stepUpper !== stepStrip ? 'Removed leading/trailing spaces' : 'No outer whitespace',
      },
      {
        label: 'Remove Periods',
        operation: '.replace(".", "")',
        value: stepNoPeriod,
        changed: stepStrip !== stepNoPeriod,
        notes: stepStrip !== stepNoPeriod ? 'Removed abbreviations & honorific dots (Dr., Jr., etc.)' : 'No periods found',
      },
      {
        label: 'Remove Commas',
        operation: '.replace(",", "")',
        value: finalVal,
        changed: stepNoPeriod !== finalVal,
        notes: stepNoPeriod !== finalVal ? 'Removed suffix separators (e.g. Doe, Jr.)' : 'No commas found',
      },
    ],
  };
}

/**
 * Detailed step-by-step analysis for Zip normalization
 */
export function analyzeZipNormalization(raw: string): TransformationDetail {
  const original = String(raw ?? '');
  const stepStrip = original.trim();
  const finalVal = stepStrip.slice(0, 5);

  const modifications: string[] = [];
  if (original !== stepStrip) modifications.push('Stripped outer whitespace');
  if (stepStrip.length > 5) modifications.push(`Truncated ZIP+4 suffix (${stepStrip.slice(5)})`);

  return {
    original,
    normalized: finalVal,
    modifications,
    steps: [
      {
        label: 'Original String',
        operation: 'str(zip_code)',
        value: original,
        changed: false,
      },
      {
        label: 'Trim Whitespace',
        operation: '.strip()',
        value: stepStrip,
        changed: original !== stepStrip,
        notes: original !== stepStrip ? 'Removed surrounding whitespace' : 'No outer whitespace',
      },
      {
        label: '5-Digit Slice',
        operation: '[:5]',
        value: finalVal,
        changed: stepStrip !== finalVal,
        notes: stepStrip.length > 5 ? `Kept standard 5-digit prefix, trimmed ZIP+4 (${stepStrip.slice(5)})` : 'Under or equal to 5 characters',
      },
    ],
  };
}

/**
 * Detailed step-by-step analysis for Phone normalization
 */
export function analyzePhoneNormalization(raw: string): TransformationDetail {
  const original = String(raw ?? '');
  const digitsOnly = Array.from(original)
    .filter((c) => c >= '0' && c <= '9')
    .join('');
  const finalVal = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;

  const modifications: string[] = [];
  if (original !== digitsOnly) modifications.push('Stripped non-numeric characters (dashes, parens, spaces, +)');
  if (digitsOnly.length > 10) modifications.push(`Stripped leading country code / extension prefix (${digitsOnly.slice(0, digitsOnly.length - 10)})`);

  return {
    original,
    normalized: finalVal,
    modifications,
    steps: [
      {
        label: 'Original String',
        operation: 'str(phone)',
        value: original,
        changed: false,
      },
      {
        label: 'Extract Digits Only',
        operation: '"".join(c for c in str(phone) if c.isdigit())',
        value: digitsOnly,
        changed: original !== digitsOnly,
        notes: original !== digitsOnly ? `Filtered out formatting characters (${original.replace(/\d/g, '').trim() || 'symbols'})` : 'Input already numeric only',
      },
      {
        label: 'Last 10 Digits',
        operation: 'digits[-10:]',
        value: finalVal,
        changed: digitsOnly !== finalVal,
        notes: digitsOnly.length > 10
          ? `Preserved 10-digit national number, discarded leading prefix '${digitsOnly.slice(0, digitsOnly.length - 10)}'`
          : digitsOnly.length === 10
            ? 'Exactly 10 digits'
            : `Warning: Only ${digitsOnly.length} digits found (standard US numbers have 10 digits)`,
      },
    ],
  };
}
