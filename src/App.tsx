/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DataRecord, AppView, PropertyMatchPair } from './types';
import {
  INITIAL_SAMPLE_RECORDS,
  createRecord,
  computeDuplicateGroups,
} from './data/sampleRecords';
import { samplePropertyPairs } from './data/samplePropertyPairs';
import { Header } from './components/Header';
import { ArchitectureView } from './components/ArchitectureView';
import { ReviewQueueView } from './components/ReviewQueueView';
import { HighConfidenceView } from './components/HighConfidenceView';
import { SingleTester } from './components/SingleTester';
import { BatchTable } from './components/BatchTable';
import { FuzzyMatcher } from './components/FuzzyMatcher';
import { CodeModal } from './components/CodeModal';
import { CsvImportModal } from './components/CsvImportModal';
import { CodebaseRecoveryView } from './components/CodebaseRecoveryView';
import { calculateCompositeMatchScore } from './utils/fuzzy';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('pipeline');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Pool of property match candidate pairs
  const [propertyPairs, setPropertyPairs] = useState<PropertyMatchPair[]>(samplePropertyPairs);

  // Pool of customer records
  const [rawRecords, setRawRecords] = useState<DataRecord[]>(() => {
    return INITIAL_SAMPLE_RECORDS.map((item) =>
      createRecord(item.rawName, item.rawZip, item.rawPhone)
    );
  });

  // Calculate duplicate groups whenever rawRecords change
  const records = useMemo(() => {
    return computeDuplicateGroups(rawRecords);
  }, [rawRecords]);

  // Aggregate statistics for customer normalization
  const stats = useMemo(() => {
    const total = records.length;
    const modifiedCount = records.filter((r) => r.hasModifications).length;
    const duplicateKeys = new Set(
      records.filter((r) => (r.duplicateCount || 1) > 1).map((r) => r.matchKey)
    );
    const duplicateGroupCount = duplicateKeys.size;

    return { total, modifiedCount, duplicateGroupCount };
  }, [records]);

  // Calculate pipeline counts for property pairs
  const { reviewCount, highConfidenceCount } = useMemo(() => {
    let rev = 0;
    let high = 0;

    for (const pair of propertyPairs) {
      if (pair.status === 'rejected') continue;
      if (pair.status === 'high_confidence') {
        high++;
        continue;
      }
      if (pair.status === 'pending_review') {
        rev++;
        continue;
      }

      const res = calculateCompositeMatchScore(
        { name: pair.customerName, address: pair.customerAddress, zip: pair.customerZip },
        { ownerName: pair.propertyOwnerName, address: pair.propertyAddress, zip: pair.propertyZip },
        { nameWeight: 0.45, addressWeight: 0.35, locationWeight: 0.20 }
      );

      if (res.compositeScore >= 75) {
        high++;
      } else if (res.compositeScore >= 50) {
        rev++;
      }
    }

    return { reviewCount: rev, highConfidenceCount: high };
  }, [propertyPairs]);

  const handleResetSampleRecords = () => {
    setRawRecords(
      INITIAL_SAMPLE_RECORDS.map((item) =>
        createRecord(item.rawName, item.rawZip, item.rawPhone)
      )
    );
    setPropertyPairs(samplePropertyPairs);
  };

  const handleUpdatePairStatus = (
    id: string,
    newStatus: 'pending_review' | 'high_confidence' | 'rejected',
    note?: string
  ) => {
    setPropertyPairs((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: newStatus,
              auditNote: note || p.auditNote,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Auditor #412',
            }
          : p
      )
    );
  };

  const handleSimulateIngest = () => {
    // Generate a fresh pair from simulated ingestion
    const id = `pair-${Date.now().toString(36)}`;
    const randomSource = Math.random() > 0.5;
    const newPair: PropertyMatchPair = {
      id,
      customerId: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      parcelId: `APN-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-01`,
      customerName: 'Margaret O’Connor & Sons LLC',
      customerAddress: '9100 Wilshire Blvd, Ste 700E',
      customerZip: '90212',
      customerPhone: '(310) 555-8822',
      propertyOwnerName: 'OCONNOR MARGARET REVOCABLE TRUST',
      propertyAddress: '9100 WILSHIRE BLVD STE 700',
      propertyZip: '90212-3401',
      sourceType: randomSource ? 'state_api' : 'permitted_feed',
      sourceName: randomSource
        ? 'CA State Assessor Real-Time API'
        : 'LA County Permitted Recorder Feed',
      status: 'pending_review',
      notes: 'Simulated stream ingestion: LLC name vs Personal Revocable Trust title.',
    };

    setPropertyPairs((prev) => [newPair, ...prev]);
  };

  const handleAddRecord = (record: DataRecord) => {
    setRawRecords((prev) => [record, ...prev]);
  };

  const handleUpdateRecord = (updated: DataRecord) => {
    setRawRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleDeleteRecord = (id: string) => {
    setRawRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleImportRecords = (newRecs: DataRecord[]) => {
    setRawRecords((prev) => [...newRecs, ...prev]);
    setActiveView('batch');
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-slate-300 flex flex-col selection:bg-emerald-900/60 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        totalRecords={stats.total}
        duplicateGroupCount={stats.duplicateGroupCount}
        modifiedCount={stats.modifiedCount}
        reviewCount={reviewCount}
        highConfidenceCount={highConfidenceCount}
        onReset={handleResetSampleRecords}
        onOpenCode={() => setIsCodeModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'pipeline' ? (
          <ArchitectureView
            pairs={propertyPairs}
            onNavigate={setActiveView}
            onSimulateIngest={handleSimulateIngest}
          />
        ) : activeView === 'review' ? (
          <ReviewQueueView
            pairs={propertyPairs}
            onUpdatePairStatus={handleUpdatePairStatus}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
          />
        ) : activeView === 'high_confidence' ? (
          <HighConfidenceView
            pairs={propertyPairs}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
          />
        ) : activeView === 'fuzzy' ? (
          <FuzzyMatcher onOpenCodeModal={() => setIsCodeModalOpen(true)} />
        ) : activeView === 'tester' ? (
          <SingleTester />
        ) : activeView === 'codebase' ? (
          <CodebaseRecoveryView onNavigateView={setActiveView} />
        ) : (
          <BatchTable
            records={records}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}
      </main>

      {/* Python / TypeScript Code Inspection Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Bulk CSV / Text Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportRecords}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c0e14] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">HINDSIGHT360</span>
            <span>&bull;</span>
            <span>Customer Database &bull; State APIs &bull; Permitted Feeds &bull; RapidFuzz Linkage</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            score = (name_score × 0.45) + (address_score × 0.35) + (location_score × 0.20)
          </div>
        </div>
      </footer>
    </div>
  );
}
