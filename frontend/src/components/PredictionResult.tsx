'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CLASS_LABELS } from '@/lib/api';

interface PredictionResultProps {
  prediction: number;
  maxConfidence: number;
  probabilities: number[];
  isLoading?: boolean;
}

// Full names mapping for each class
const CLASS_FULL_NAMES: { [key: string]: string } = {
  'MEL': 'Melanoma',
  'NV': 'Melanocytic nevus',
  'BCC': 'Basal cell carcinoma',
  'AKIEC': 'Actinic keratosis',
  'BKL': 'Benign keratosis',
  'DF': 'Dermatofibroma',
  'VASC': 'Vascular lesion',
  'SCC': 'Squamous cell carcinoma'
};

export function PredictionResult(props: PredictionResultProps) {
  const { probabilities, isLoading = false } = props;
  const [showDetails, setShowDetails] = useState(false);
  
  if (isLoading) {
    return (
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle className="text-center">Analyzing Image...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="animate-pulse flex flex-col items-center w-full">
            <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate Cancer Risk and Benign Risk
  // Cancer: MEL(0) + BCC(2) + SCC(7) + AKIEC(3)
  // Benign: NV(1) + BKL(4) + DF(5) + VASC(6)
  const cancerIndices = [0, 2, 7, 3]; // MEL, BCC, SCC, AKIEC
  const benignIndices = [1, 4, 5, 6]; // NV, BKL, DF, VASC
  
  const cancerRisk = cancerIndices.reduce((sum, index) => {
    return sum + (probabilities[index] || 0);
  }, 0);
  
  const benignRisk = benignIndices.reduce((sum, index) => {
    return sum + (probabilities[index] || 0);
  }, 0);
  
  // Determine which risk is higher
  const higherRisk = cancerRisk > benignRisk ? 'cancer' : 'benign';
  
  return (
    <Card className="w-full h-full flex flex-col gap-5">
      <CardTitle className="text-center mb-0">Analysis Result</CardTitle>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex flex-col items-center flex-1 gap-4">
          
          {/* Main Risk Categories */}
          <div className="w-full space-y-4 mb-4 flex-shrink-0">
            {/* Cancer Risk */}
            <div className="flex items-center justify-between p-4 rounded-lg border-2" 
                 style={{ 
                   borderColor: higherRisk === 'cancer' ? '#ef4444' : '#e5e7eb',
                   backgroundColor: higherRisk === 'cancer' ? '#fef2f2' : '#f9fafb'
                 }}>
              <div className="flex flex-col">
                <span className="font-semibold text-lg">Cancer Risk</span>
                <span className="text-sm text-gray-600">Malignant conditions</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                  {(cancerRisk * 100).toFixed(1)}%
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${cancerRisk * 100}%`,
                      backgroundColor: '#ef4444'
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Benign Risk */}
            <div className="flex items-center justify-between p-4 rounded-lg border-2"
                 style={{ 
                   borderColor: higherRisk === 'benign' ? '#22c55e' : '#e5e7eb',
                   backgroundColor: higherRisk === 'benign' ? '#f0fdf4' : '#f9fafb'
                 }}>
              <div className="flex flex-col">
                <span className="font-semibold text-lg">Benign Risk</span>
                <span className="text-sm text-gray-600">Non-cancerous conditions</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                  {(benignRisk * 100).toFixed(1)}%
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${benignRisk * 100}%`,
                      backgroundColor: '#22c55e'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Medical Advice */}
          <div className="mb-3 p-4 bg-gray-50 rounded-lg flex-shrink-0">
            <p className="text-sm text-gray-700 text-center">
              {higherRisk === 'cancer' ? (
                <span className="font-medium text-red-700">
                  Higher cancer risk detected. Please consult a dermatologist for professional evaluation.
                </span>
              ) : (
                <span className="font-medium text-green-700">
                  Lower cancer risk indicated, however, it is recommended to consult a dermatologist for professional evaluation.
                </span>
              )}
            </p>
          </div>
          
          {/* Toggle Details Button */}
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 mb-1 flex-shrink-0"
          >
            See Details
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {/* Spacer to push content up and fill height when details are hidden */}
          {!showDetails && <div className="flex-1"></div>}
          
          {/* Detailed Class Predictions */}
          {showDetails && (
            <div className="w-full flex flex-col space-y-3 flex-shrink-0 gap-2">
              <h4 className="text-sm font-medium mt-3 text-center">Individual Class Predictions</h4>
              
              {/* Info note about calculation (now after the title) */}
              <div className="mb-1 pt-1 px-3 pb-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 text-center">
                  <strong>Note:</strong> Cancer Risk is calculated by summing up all malignant conditions (MEL, BCC, SCC, AKIEC). 
                  Benign Risk is calculated by summing up all non-cancerous conditions (NV, BKL, DF, VASC).
                </p>
              </div>
              
              {probabilities.slice(0, -1).map((prob, idx) => {
                const shortName = CLASS_LABELS[idx];
                const fullName = CLASS_FULL_NAMES[shortName];
                const isCancer = ['MEL', 'BCC', 'SCC', 'AKIEC'].includes(shortName);
                
                return (
                  <div key={idx} className="flex items-center text-sm">
                    <div className="w-20 font-medium flex items-center gap-2">
                      {shortName}
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ 
                          backgroundColor: isCancer ? '#ef4444' : '#22c55e' 
                        }}
                        title={isCancer ? 'Cancer' : 'Benign'}
                      ></div>
                    </div>
                    <div className="flex-1 mx-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs text-gray-600">{fullName}</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${prob * 100}%`,
                            backgroundColor: isCancer ? '#ef4444' : '#22c55e'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-right font-medium">{(prob * 100).toFixed(1)}%</div>
                  </div>
                );
              })}

              {/* Color Legend */}
              <div className="mt-2 pt-3 border-t border-gray-200">
                <h5 className="text-xs font-medium text-gray-700 mb-2 text-center">Legend:</h5>
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Cancerous</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Benign</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 