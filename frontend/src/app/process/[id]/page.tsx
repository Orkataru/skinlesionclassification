'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MoleRecord } from '@/components/MoleRecord';
import { useMoleStore } from '@/lib/store';

function MoleProcessContent() {
  const params = useParams();
  const router = useRouter();
  const { getMole } = useMoleStore();
  
  const moleId = params.id as string;
  const mole = getMole(moleId);
  
  if (!mole) {
    // Handle case where mole is not found
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-xl font-semibold mb-4">Mole not found</h1>
        <p className="text-gray-600 mb-6">The mole you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button onClick={() => router.push('/')}>
          Back to Home
        </Button>
      </div>
    );
  }
  
  const sortedRecords = [...mole.records].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const handleAddRecord = () => {
    router.push(`/add-mole?moleId=${moleId}`);
  };
  
  const handleViewRecord = (recordId: string) => {
    router.push(`/record/${moleId}/${recordId}`);
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mole History</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Records: {mole.records.length}
          </p>
          
          <Button 
            className="w-full" 
            onClick={handleAddRecord}
          >
            Add New Record
          </Button>
        </div>
        
        <div className="space-y-4">
          {sortedRecords.length > 0 ? (
            sortedRecords.map((record) => (
              <MoleRecord
                key={record.id}
                record={record}
                onClick={() => handleViewRecord(record.id)}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No records found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MoleProcessPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]">Loading...</div>}>
      <MoleProcessContent />
    </Suspense>
  );
} 