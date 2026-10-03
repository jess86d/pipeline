import { DataRecord } from '../types';
import { normalizeName, normalizeZip, normalizePhone, getMatchKey } from '../utils/normalizer';

export const INITIAL_SAMPLE_RECORDS: Omit<DataRecord, 'id' | 'normalizedName' | 'normalizedZip' | 'normalizedPhone' | 'matchKey' | 'hasModifications'>[] = [
  {
    rawName: 'Dr. Robert J. Downey, Jr.',
    rawZip: '90210-4321',
    rawPhone: '+1 (310) 555-0199',
  },
  {
    rawName: 'robert j downey jr',
    rawZip: ' 90210 ',
    rawPhone: '310.555.0199',
  },
  {
    rawName: 'Robert J. Downey Jr.',
    rawZip: '90210',
    rawPhone: '1-310-555-0199',
  },
  {
    rawName: 'Jane M. Doe, MD',
    rawZip: '10001-0012',
    rawPhone: '+1-212-555-4321',
  },
  {
    rawName: '  jane m doe md  ',
    rawZip: '10001',
    rawPhone: '(212) 555-4321',
  },
  {
    rawName: 'Acme Corp., Inc.',
    rawZip: '94103-1614',
    rawPhone: '1 (415) 555-2671 ext 10',
  },
  {
    rawName: 'ACME CORP INC',
    rawZip: '94103',
    rawPhone: '4155552671',
  },
  {
    rawName: 'Michael Chang, Ph.D.',
    rawZip: '98101-2000',
    rawPhone: '206-555-8900',
  },
  {
    rawName: 'Sarah Connor',
    rawZip: '90001',
    rawPhone: '(213) 555-0144',
  },
  {
    rawName: 'SARAH CONNOR',
    rawZip: ' 90001 ',
    rawPhone: '+1-213-555-0144',
  },
];

export function createRecord(rawName: string, rawZip: string, rawPhone: string, id?: string): DataRecord {
  const normName = normalizeName(rawName);
  const normZip = normalizeZip(rawZip);
  const normPhone = normalizePhone(rawPhone);
  const matchKey = getMatchKey(rawName, rawZip, rawPhone);

  const hasModifications =
    rawName !== normName || rawZip !== normZip || rawPhone !== normPhone;

  return {
    id: id || Math.random().toString(36).substring(2, 9),
    rawName,
    rawZip,
    rawPhone,
    normalizedName: normName,
    normalizedZip: normZip,
    normalizedPhone: normPhone,
    matchKey,
    hasModifications,
  };
}

export function computeDuplicateGroups(records: DataRecord[]): DataRecord[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    counts.set(r.matchKey, (counts.get(r.matchKey) || 0) + 1);
  }

  // Pre-assign distinct soft color palettes to groups with > 1 members
  const colorPalette = [
    'bg-amber-950/60 text-amber-300 border-amber-800/80',
    'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
    'bg-blue-950/60 text-blue-300 border-blue-800/80',
    'bg-purple-950/60 text-purple-300 border-purple-800/80',
    'bg-rose-950/60 text-rose-300 border-rose-800/80',
    'bg-cyan-950/60 text-cyan-300 border-cyan-800/80',
  ];

  const groupColors = new Map<string, string>();
  let colorIdx = 0;

  for (const [key, count] of counts.entries()) {
    if (count > 1 && !groupColors.has(key)) {
      groupColors.set(key, colorPalette[colorIdx % colorPalette.length]);
      colorIdx++;
    }
  }

  return records.map((r) => ({
    ...r,
    duplicateCount: counts.get(r.matchKey) || 1,
    duplicateGroupColor: groupColors.get(r.matchKey),
  }));
}
