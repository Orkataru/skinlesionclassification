'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { CameraView } from '@/components/CameraView';
import { PredictionResult } from '@/components/PredictionResult';
import { getPrediction, compressImage } from '@/lib/api';
import { useMoleStore, type Mole, type MoleRecord } from '@/lib/store';
import { toast } from 'sonner';
import Image from 'next/image';

function AddMoleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addMole, addMoleRecord, getMoleByLocation } = useMoleStore();
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prediction, setPrediction] = useState<{
    prediction: number;
    maxConfidence: number;
    probabilities: number[];
    gradcam?: string;
  } | null>(null);
  
  // Get location parameters from URL
  const x = parseFloat(searchParams.get('x') || '0');
  const y = parseFloat(searchParams.get('y') || '0');
  const moleId = searchParams.get('moleId');
  const returnTo = searchParams.get('returnTo');
  
  // Check if there's already a mole at this location
  const existingMole = moleId || (getMoleByLocation(x, y, 3)?.id);
  
  const handleImageCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setIsProcessing(true);
    
    try {
      const result = await getPrediction(imageData);
      
      setPrediction({
        prediction: result.prediction,
        maxConfidence: result.max_confidence,
        probabilities: result.probabilities,
        gradcam: result.gradcam,
      });
    } catch (error) {
      console.error('Error getting prediction:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAddMole = async () => {
    if (!capturedImage || !prediction) return;
    
    try {
      // Compress the image before storing
      const compressedImage = await compressImage(capturedImage, 0.7, 800);
      
      const date = new Date().toISOString();
      const recordId = uuidv4();
      
      const moleRecord: MoleRecord = {
        id: recordId,
        image: compressedImage,
        date,
        prediction: prediction.prediction,
        maxConfidence: prediction.maxConfidence,
        probabilities: prediction.probabilities,
        gradcam: prediction.gradcam,
      };
      
      if (existingMole) {
        // Add record to existing mole
        addMoleRecord(existingMole, moleRecord);
        toast.success('New record added to existing mole');
        
        // Navigate based on returnTo parameter
        if (returnTo === 'home') {
          router.push('/');
        } else {
          router.push(`/process/${existingMole}`);
        }
      } else {
        // Create new mole
        const newMoleId = uuidv4();
        
        const newMole: Mole = {
          id: newMoleId,
          location: { x, y },
          records: [moleRecord],
        };
        
        addMole(newMole);
        toast.success('New mole added successfully');
        
        // Navigate based on returnTo parameter
        if (returnTo === 'home') {
          router.push('/');
        } else {
          router.push(`/process/${newMoleId}`);
        }
      }
    } catch (error) {
      console.error('Error saving mole:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        toast.error('Storage is full. Some old records may have been removed to make space.');
      } else {
        toast.error('Failed to save mole. Please try again.');
      }
    }
  };
  
  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setPrediction(null);
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-6xl px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {existingMole ? 'Add New Record' : 'Add New Mole'}
          </h1>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      
        
        {capturedImage ? (
          <>
            {/* Responsive layout: stacked on mobile, side by side on desktop */}
            <div className="flex flex-col md:flex-row gap-6 md:items-stretch mb-6">
              {/* Image and controls section */}
              <div className="w-full md:w-1/2">
                <div className="w-full aspect-[4/3] bg-black rounded-lg mb-4 overflow-hidden">
                  <Image 
                    src={capturedImage} 
                    alt="Captured mole" 
                    className="w-full h-full object-cover"
                    width={400}
                    height={300}
                    unoptimized
                  />
                </div>
                
                <div className="flex justify-between gap-4 mb-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleRetakePhoto}
                  >
                    Retake Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
                
                {prediction && !isProcessing && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleAddMole}
                  >
                    {existingMole ? 'Add Record to Mole' : 'Add Mole to Track'}
                  </Button>
                )}
              </div>
              
              {/* Analysis section */}
              <div className="w-full md:w-1/2">
                <div className="h-full">
                    <PredictionResult 
                    prediction={prediction?.prediction ?? 0}
                    maxConfidence={prediction?.maxConfidence ?? 0}
                    probabilities={prediction?.probabilities ?? []}
                    gradcamImage={prediction?.gradcam}
                    isLoading={isProcessing}
                    />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <CameraView onImageCapture={handleImageCapture} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AddMolePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]">Loading...</div>}>
      <AddMoleContent />
    </Suspense>
  );
} 
