'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Eye, BarChart3, Loader2 } from 'lucide-react';
import { CLASS_LABELS, CLASS_FULL_NAMES, CLASS_DESCRIPTIONS } from '@/lib/api';
import Image from 'next/image';

interface PredictionResultProps {
  prediction: number;
  maxConfidence: number;
  probabilities: number[];
  gradcamImage?: string;
  isLoading?: boolean;
}

// Colors for each class - using a colorblind-friendly palette
const CLASS_COLORS: { [key: string]: string } = {
  'MEL': '#D55E00',    // Vermillion
  'NV': '#009E73',     // Bluish green
  'BCC': '#CC79A7',    // Reddish purple
  'AKIEC': '#E69F00',  // Orange
  'BKL': '#56B4E9',    // Sky blue
  'DF': '#0072B2',     // Blue
  'VASC': '#F0E442',   // Yellow
  'SCC': '#999999',    // Gray
};

export function PredictionResult(props: PredictionResultProps) {
  const { probabilities, maxConfidence, gradcamImage, isLoading = false } = props;
  const [activeTab, setActiveTab] = useState<'distribution' | 'gradcam'>('distribution');
  const [hoveredClass, setHoveredClass] = useState<number | null>(null);
  
  // Sort probabilities for display (highest first)
  const sortedClasses = useMemo(() => {
    if (!probabilities || probabilities.length === 0) return [];
    
    return probabilities
      .slice(0, 8) // Only the 8 actual classes, not "Not confident"
      .map((prob, idx) => ({
        index: idx,
        probability: prob,
        label: CLASS_LABELS[idx],
        fullName: CLASS_FULL_NAMES[CLASS_LABELS[idx]],
        description: CLASS_DESCRIPTIONS[CLASS_LABELS[idx]],
        color: CLASS_COLORS[CLASS_LABELS[idx]]
      }))
      .sort((a, b) => b.probability - a.probability);
  }, [probabilities]);

  // Top prediction
  const topPrediction = sortedClasses[0];
  
  if (isLoading) {
    return (
      <Card className="w-full h-full flex flex-col">
        <CardTitle className="text-center pt-4 pb-2">Analyzing Image...</CardTitle>
        <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Processing your image with AI</p>
            <p className="text-xs text-gray-400">Estimated time: ~2-3 seconds</p>
          </div>
          <div className="w-full max-w-xs mt-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!probabilities || probabilities.length === 0) {
    return (
      <Card className="w-full h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No prediction data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full h-full flex flex-col">
      <CardTitle className="text-center pt-4 pb-2">Analysis Result</CardTitle>
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
          
        {/* Top Prediction Summary */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Most Likely</p>
              <p className="text-xl font-bold" style={{ color: topPrediction?.color }}>
                {topPrediction?.fullName}
              </p>
              <p className="text-sm text-gray-600">({topPrediction?.label})</p>
              </div>
              <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: topPrediction?.color }}>
                {(topPrediction?.probability * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {maxConfidence >= 0.5 ? 'Confident' : 'Uncertain'}
              </p>
                </div>
              </div>
            </div>
            
        {/* Tab Navigation */}
        <div className="flex border-b mb-4">
          <button
            className={`flex-1 py-2 text-center font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'distribution' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('distribution')}
          >
            <BarChart3 className="h-4 w-4" />
            Class Distribution
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'gradcam' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('gradcam')}
          >
            <Eye className="h-4 w-4" />
            Attention Map
          </button>
              </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'distribution' ? (
            <div className="space-y-3">
              {/* Horizontal Stacked Bar Chart */}
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Probability Distribution</p>
                <div className="h-8 rounded-lg overflow-hidden flex shadow-inner bg-gray-100">
                  {sortedClasses.map((cls) => (
                  <div 
                      key={cls.index}
                      className="h-full transition-all duration-300 cursor-pointer relative group"
                    style={{ 
                        width: `${cls.probability * 100}%`,
                        backgroundColor: cls.color,
                        minWidth: cls.probability > 0.01 ? '2px' : '0'
                    }}
                      onMouseEnter={() => setHoveredClass(cls.index)}
                      onMouseLeave={() => setHoveredClass(null)}
                    >
                      {/* Tooltip */}
                      {hoveredClass === cls.index && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                          {cls.label}: {(cls.probability * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
            </div>
          </div>
          
              {/* Class Legend with Bars */}
              <div className="space-y-2">
                {sortedClasses.map((cls, idx) => (
                  <div 
                    key={cls.index} 
                    className={`p-3 rounded-lg transition-all ${
                      idx === 0 ? 'bg-slate-50 border border-slate-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color indicator */}
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cls.color }}
                      />
              
                      {/* Label and bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{cls.label}</span>
                            <span className="text-xs text-gray-500 truncate">{cls.fullName}</span>
                    </div>
                          <span className="font-bold text-sm" style={{ color: cls.color }}>
                            {(cls.probability * 100).toFixed(1)}%
                          </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                              width: `${cls.probability * 100}%`,
                              backgroundColor: cls.color
                          }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Description for top prediction */}
                    {idx === 0 && (
                      <p className="text-xs text-gray-500 mt-2 ml-7">
                        {cls.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              {gradcamImage ? (
                <div className="space-y-4 w-full">
                  <div className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={`data:image/png;base64,${gradcamImage}`}
                      alt="Grad-CAM attention visualization"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">What is this?</p>
                        <p>
                          This heatmap shows which regions of the image the AI focused on 
                          when making its prediction. Warmer colors (red/yellow) indicate 
                          areas of higher importance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Attention map not available for this analysis
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    This feature requires the latest backend version
                  </p>
              </div>
              )}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              These results are generated by an AI model and should not be used as a medical diagnosis. 
              Always consult a qualified dermatologist for professional evaluation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
