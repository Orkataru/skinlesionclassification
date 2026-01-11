'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PredictionResult } from '@/components/PredictionResult';
import { useMoleStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

function RecordContent() {
  const params = useParams();
  const router = useRouter();
  const { getMole } = useMoleStore();
  const [isMobile, setIsMobile] = useState(false);
  
  const moleId = params.moleId as string;
  const recordId = params.recordId as string;
  
  const mole = getMole(moleId);
  const record = mole?.records.find(r => r.id === recordId);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleBackToHistory = () => {
    if (isMobile) {
      // On mobile, navigate to the process page (dedicated history page)
      router.push(`/process/${moleId}`);
    } else {
      // On desktop, navigate to homepage (which has embedded history)
      router.push('/');
    }
  };
  
  if (!mole || !record) {
    // Handle case where record is not found
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-xl font-semibold mb-4">Record not found</h1>
        <p className="text-gray-600 mb-6">The record you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button onClick={() => router.push('/')}>
          Back to Home
        </Button>
      </div>
    );
  }
  
  const dateFormatted = formatDistanceToNow(new Date(record.date), { addSuffix: true });
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-6xl px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mole Record</h1>
          <Button variant="outline" onClick={handleBackToHistory}>
            Back to History
          </Button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">Date: {dateFormatted}</p>
        </div>
        
        {/* Responsive layout: stacked on mobile, side by side on desktop */}
        <div className="flex flex-col md:flex-row gap-6 md:items-stretch">
          {/* Image section */}
          <div className="w-full md:w-1/2">
            <div className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <Image 
                src={record.image} 
                alt="Mole" 
                className="w-full h-full object-cover"
                width={400}
                height={300}
                unoptimized
              />
            </div>
          </div>
          
          {/* Prediction section */}
          <div className="w-full md:w-1/2">
            <div className="h-full">
              <PredictionResult
                prediction={record.prediction}
                maxConfidence={record.maxConfidence}
                probabilities={record.probabilities}
                gradcamImage={record.gradcam}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]">Loading...</div>}>
      <RecordContent />
    </Suspense>
  );
} 
