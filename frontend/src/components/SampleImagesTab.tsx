'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PredictionResult } from '@/components/PredictionResult';
import { getPredictionFromBlob, normalizeImageBlob } from '@/lib/api';
import {
  SAMPLE_CATEGORY_ORDER,
  SAMPLE_IMAGES_BY_CATEGORY,
  type SampleImage,
} from '@/lib/sampleImages';

type PredictionState = {
  prediction: number;
  maxConfidence: number;
  probabilities: number[];
  gradcam?: string;
};

export function SampleImagesTab() {
  const [selected, setSelected] = useState<SampleImage | null>(null);
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeRequestId = useRef(0);

  const clearSelection = () => {
    // Invalidate in-flight requests
    activeRequestId.current += 1;
    setSelected(null);
    setPrediction(null);
    setIsProcessing(false);
  };

  const analyzeSample = async (img: SampleImage) => {
    const requestId = (activeRequestId.current += 1);

    setSelected(img);
    setPrediction(null);
    setIsProcessing(true);

    try {
      const imageResp = await fetch(img.src);
      if (!imageResp.ok) {
        throw new Error(`Failed to load sample image (${imageResp.status})`);
      }

      const blob = await imageResp.blob();
      // The backend resizes to 456×456 for inference anyway. Normalizing here prevents
      // very large images (e.g. ~6600×4400) from causing huge Grad-CAM outputs / OOM.
      const normalized = await normalizeImageBlob(blob, { maxSide: 1024, quality: 0.9 });
      const result = await getPredictionFromBlob(normalized, `${img.id}.jpg`);

      if (activeRequestId.current !== requestId) return;

      setPrediction({
        prediction: result.prediction,
        maxConfidence: result.max_confidence,
        probabilities: result.probabilities,
        gradcam: result.gradcam,
      });
    } catch (error) {
      if (activeRequestId.current !== requestId) return;
      console.error('Error analyzing sample image:', error);
      toast.error('Failed to analyze the sample image. Please try again.');
    } finally {
      if (activeRequestId.current !== requestId) return;
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:items-start">
      {/* Gallery */}
      <div className="w-full md:w-1/2">
        <div className="space-y-6">
          {SAMPLE_CATEGORY_ORDER.map((category) => {
            const images = SAMPLE_IMAGES_BY_CATEGORY[category] ?? [];
            if (images.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800">{images[0]?.categoryTitle}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {images.map((img) => {
                    const isSelected = selected?.id === img.id;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        className="text-left group"
                        onClick={() => analyzeSample(img)}
                        aria-label={`Analyze sample image ${img.id}`}
                      >
                        <div
                          className={`relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100 border transition-all ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-200'
                              : 'border-gray-200 group-hover:border-gray-300'
                          }`}
                        >
                          <Image
                            src={img.src}
                            alt={img.id}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px"
                            className="object-cover"
                            unoptimized
                          />
                          {isSelected && isProcessing && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="text-white text-xs font-medium">Analyzing…</div>
                            </div>
                          )}
                        </div>
                        <div className="mt-1">
                          <div className="text-xs font-mono text-gray-700">{img.id}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Panel */}
      <div className="w-full md:w-1/2 md:sticky md:top-0">
        <div className="space-y-6">
          <Card className="-mt-1">
            <CardHeader>
              <CardTitle>Selected sample</CardTitle>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={!selected}
                >
                  Clear
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected ? (
                <>
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black">
                    <Image
                      src={selected.src}
                      alt={`Selected sample ${selected.id}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-500">ID:</span>{' '}
                      <span className="font-mono">{selected.id}</span>
                    </div>
                    <div className="text-xs text-gray-500">{selected.categoryTitle}</div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Select a sample image on the left to analyze it.
                </p>
              )}
            </CardContent>
          </Card>

          {selected ? (
            <PredictionResult
              prediction={prediction?.prediction ?? 0}
              maxConfidence={prediction?.maxConfidence ?? 0}
              probabilities={prediction?.probabilities ?? []}
              gradcamImage={prediction?.gradcam}
              isLoading={isProcessing}
            />
          ) : (
            <Card className="w-full min-h-[200px] flex flex-col items-center justify-center">
              <CardContent>
                <p className="text-gray-500 text-sm">Prediction will appear here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

