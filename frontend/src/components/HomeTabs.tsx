'use client';

import React, { useState } from 'react';
import { HumanBodyViewer } from '@/components/HumanBodyViewer';
import { SampleImagesTab } from '@/components/SampleImagesTab';
import { Images, MapPinned } from 'lucide-react';

type HomeTab = 'track' | 'samples';

export function HomeTabs() {
  const [activeTab, setActiveTab] = useState<HomeTab>('track');

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-6xl px-2">
        {/* Tab Navigation */}
        <div className="flex border-b mb-4">
          <button
            type="button"
            className={`flex-1 py-2 text-center font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'track'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('track')}
          >
            <MapPinned className="h-4 w-4" />
            Track Your Moles
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-center font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'samples'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('samples')}
          >
            <Images className="h-4 w-4" />
            Try out sample images
          </button>
        </div>

        {activeTab === 'track' ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">Track Your Moles</h1>
            <p className="text-gray-600 text-center mb-4">
              Click on a location on the body model to add or view a mole.
            </p>
            <HumanBodyViewer />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">Try out sample images</h1>
            <p className="text-gray-600 text-center mb-4">
              Click any ISIC image to send it to the backend for analysis. Sample images are{' '}
              <span className="font-medium">not</span> saved to your tracking history.
            </p>
            <SampleImagesTab />
          </>
        )}
      </div>
    </div>
  );
}

