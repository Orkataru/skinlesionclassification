'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow, format } from 'date-fns';
import { MoleRecord as MoleRecordType } from '@/lib/store';
import { CLASS_LABELS, CLASS_FULL_NAMES } from '@/lib/api';
import Image from 'next/image';

interface MoleRecordProps {
  record: MoleRecordType;
  onClick?: () => void;
}

// Colors for each class - matching PredictionResult
const CLASS_COLORS: { [key: string]: string } = {
  'MEL': '#D55E00',
  'NV': '#009E73',
  'BCC': '#CC79A7',
  'AKIEC': '#E69F00',
  'BKL': '#56B4E9',
  'DF': '#0072B2',
  'VASC': '#F0E442',
  'SCC': '#999999',
};

export function MoleRecord({ record, onClick }: MoleRecordProps) {
  // Find top prediction
  const topPredictionIndex = record.probabilities
    .slice(0, 8)
    .reduce((maxIdx, prob, idx, arr) => prob > arr[maxIdx] ? idx : maxIdx, 0);
  
  const topLabel = CLASS_LABELS[topPredictionIndex];
  const topFullName = CLASS_FULL_NAMES[topLabel];
  const topColor = CLASS_COLORS[topLabel];
  const topProbability = record.probabilities[topPredictionIndex];
  
  const recordDate = new Date(record.date);
  const dateRelative = formatDistanceToNow(recordDate, { addSuffix: true });
  const dateFormatted = format(recordDate, 'MMM d, yyyy');
  
  return (
    <Card 
      className="w-full hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 relative">
            <Image 
              src={record.image} 
              alt="Mole" 
              className="object-cover"
              fill
              sizes="96px"
              unoptimized
            />
          </div>
          
          <div className="flex flex-col justify-between py-1 flex-1">
            <div>
              <div className="text-sm text-gray-500">
                <time dateTime={record.date} title={format(recordDate, 'PPpp')}>
                  {dateFormatted} ({dateRelative})
                </time>
              </div>
              
              {/* Top prediction badge */}
              <div className="mt-2 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: topColor }}
                />
                <span className="text-sm font-medium" style={{ color: topColor }}>
                  {topLabel}
                </span>
                <span className="text-xs text-gray-500">
                  {topFullName}
                </span>
              </div>
              
              {/* Probability bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full transition-all"
                    style={{ 
                      width: `${topProbability * 100}%`,
                      backgroundColor: topColor
                    }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: topColor }}>
                  {(topProbability * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
