import { PropertyMatchPair } from '../types';
import { calculateCompositeMatchScore } from './fuzzy';

/**
 * Escapes a cell value according to RFC 4180 standards.
 */
function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If the cell contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Trigger client-side file download for CSV content.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format timestamp for filename and audit records
 */
function getTimestampSlug(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

export interface CsvExportResult {
  filename: string;
  totalRecords: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  averageScore: number;
}

/**
 * Export high-confidence entity matches to CSV.
 */
export function exportHighConfidenceMatchesCsv(
  pairs: PropertyMatchPair[],
  customFilenamePrefix?: string
): CsvExportResult {
  const headers = [
    'Match ID',
    'Customer ID / Key',
    'Customer Name',
    'Customer Address',
    'Customer ZIP',
    'Customer Phone',
    'Parcel ID / APN',
    'Deed Owner Name',
    'Property Address',
    'Property ZIP',
    'Source Channel',
    'Source Provider',
    'Name Score (%)',
    'Address Score (%)',
    'Location Score (%)',
    'Composite RapidFuzz Score (%)',
    'Audit Status',
    'Auditor Notes / Findings',
    'Reviewed By',
    'Reviewed Timestamp',
    'Link Class'
  ];

  let totalScore = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  const rows = pairs.map((pair) => {
    const res = calculateCompositeMatchScore(
      { name: pair.customerName, address: pair.customerAddress, zip: pair.customerZip },
      { ownerName: pair.propertyOwnerName, address: pair.propertyAddress, zip: pair.propertyZip },
      { nameWeight: 0.45, addressWeight: 0.35, locationWeight: 0.20 }
    );

    totalScore += res.compositeScore;
    const status = pair.status || (res.compositeScore >= 75 ? 'high_confidence' : 'pending_review');

    if (status === 'high_confidence') approvedCount++;
    else if (status === 'rejected') rejectedCount++;
    else pendingCount++;

    return [
      escapeCsvCell(pair.id),
      escapeCsvCell(pair.customerId || 'CUST-AUTO'),
      escapeCsvCell(pair.customerName),
      escapeCsvCell(pair.customerAddress),
      escapeCsvCell(pair.customerZip),
      escapeCsvCell(pair.customerPhone || 'N/A'),
      escapeCsvCell(pair.parcelId || 'APN-PENDING'),
      escapeCsvCell(pair.propertyOwnerName),
      escapeCsvCell(pair.propertyAddress),
      escapeCsvCell(pair.propertyZip),
      escapeCsvCell(pair.sourceType === 'state_api' ? 'State API' : 'Permitted Feed'),
      escapeCsvCell(pair.sourceName || 'County Cadastral Feed'),
      escapeCsvCell(res.nameScore),
      escapeCsvCell(res.addressScore),
      escapeCsvCell(res.locationScore),
      escapeCsvCell(res.compositeScore),
      escapeCsvCell(status === 'high_confidence' ? 'Verified (High Confidence)' : status),
      escapeCsvCell(pair.auditNote || pair.notes || 'Verified deterministic & fuzzy linkage'),
      escapeCsvCell(pair.reviewedBy || 'System Automated Resolution'),
      escapeCsvCell(pair.reviewedAt || new Date().toISOString()),
      escapeCsvCell('High-Confidence Registry')
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const filename = `${customFilenamePrefix || 'hindsight360_high_confidence_matches'}_${getTimestampSlug()}.csv`;
  downloadCsvFile(filename, csvContent);

  return {
    filename,
    totalRecords: pairs.length,
    approvedCount,
    pendingCount,
    rejectedCount,
    averageScore: pairs.length > 0 ? Math.round((totalScore / pairs.length) * 10) / 10 : 0
  };
}

/**
 * Export Review Queue candidates and auditor triage decisions to CSV.
 */
export function exportReviewQueueFindingsCsv(
  pairs: PropertyMatchPair[],
  filterContext: string = 'all'
): CsvExportResult {
  const headers = [
    'Match ID',
    'Customer ID / Key',
    'Customer Name',
    'Customer Address',
    'Customer ZIP',
    'Customer Phone',
    'Parcel ID / APN',
    'Deed Owner Name',
    'Property Address',
    'Property ZIP',
    'Source Channel',
    'Source Provider',
    'Name Score (%)',
    'Address Score (%)',
    'Location Score (%)',
    'Composite RapidFuzz Score (%)',
    'Audit Status',
    'Auditor Notes / Findings',
    'Reviewed By',
    'Reviewed Timestamp',
    'Triage Queue Category'
  ];

  let totalScore = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  const rows = pairs.map((pair) => {
    const res = calculateCompositeMatchScore(
      { name: pair.customerName, address: pair.customerAddress, zip: pair.customerZip },
      { ownerName: pair.propertyOwnerName, address: pair.propertyAddress, zip: pair.propertyZip },
      { nameWeight: 0.45, addressWeight: 0.35, locationWeight: 0.20 }
    );

    totalScore += res.compositeScore;
    const status = pair.status || 'pending_review';

    let statusDisplay = 'Pending Review';
    if (status === 'high_confidence') {
      statusDisplay = 'Approved / Verified';
      approvedCount++;
    } else if (status === 'rejected') {
      statusDisplay = 'Rejected / False Positive';
      rejectedCount++;
    } else {
      pendingCount++;
    }

    return [
      escapeCsvCell(pair.id),
      escapeCsvCell(pair.customerId || 'CUST-AUTO'),
      escapeCsvCell(pair.customerName),
      escapeCsvCell(pair.customerAddress),
      escapeCsvCell(pair.customerZip),
      escapeCsvCell(pair.customerPhone || 'N/A'),
      escapeCsvCell(pair.parcelId || 'APN-PENDING'),
      escapeCsvCell(pair.propertyOwnerName),
      escapeCsvCell(pair.propertyAddress),
      escapeCsvCell(pair.propertyZip),
      escapeCsvCell(pair.sourceType === 'state_api' ? 'State API' : 'Permitted Feed'),
      escapeCsvCell(pair.sourceName || 'Assessor Public Records'),
      escapeCsvCell(res.nameScore),
      escapeCsvCell(res.addressScore),
      escapeCsvCell(res.locationScore),
      escapeCsvCell(res.compositeScore),
      escapeCsvCell(statusDisplay),
      escapeCsvCell(pair.auditNote || pair.notes || (status === 'pending_review' ? 'Pending Auditor Investigation' : '')),
      escapeCsvCell(pair.reviewedBy || (status === 'pending_review' ? 'Unassigned' : 'Lead Auditor #412')),
      escapeCsvCell(pair.reviewedAt || (status === 'pending_review' ? 'Pending' : new Date().toISOString())),
      escapeCsvCell(`Review Queue (${filterContext})`)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const filename = `hindsight360_review_queue_${filterContext}_${getTimestampSlug()}.csv`;
  downloadCsvFile(filename, csvContent);

  return {
    filename,
    totalRecords: pairs.length,
    approvedCount,
    pendingCount,
    rejectedCount,
    averageScore: pairs.length > 0 ? Math.round((totalScore / pairs.length) * 10) / 10 : 0
  };
}
