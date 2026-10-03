export interface DataRecord {
  id: string;
  rawName: string;
  rawZip: string;
  rawPhone: string;
  normalizedName: string;
  normalizedZip: string;
  normalizedPhone: string;
  matchKey: string;
  hasModifications: boolean;
  duplicateCount?: number;
  duplicateGroupColor?: string;
}

export interface NormalizationStep {
  label: string;
  operation: string;
  value: string;
  changed: boolean;
  notes?: string;
}

export interface TransformationDetail {
  original: string;
  normalized: string;
  steps: NormalizationStep[];
  modifications: string[];
}

export type PropertySourceType = 'state_api' | 'permitted_feed';

export interface PropertyMatchPair {
  id: string;
  customerId?: string;
  parcelId?: string;
  customerName: string;
  customerAddress: string;
  customerZip: string;
  customerPhone?: string;
  propertyOwnerName: string;
  propertyAddress: string;
  propertyZip: string;
  sourceType?: PropertySourceType;
  sourceName?: string;
  status?: 'pending_review' | 'high_confidence' | 'rejected';
  auditNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export type AppView = 'pipeline' | 'review' | 'high_confidence' | 'fuzzy' | 'batch' | 'tester' | 'codebase';
