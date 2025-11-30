import React from 'react';
import { HumanBodyViewer } from '@/components/HumanBodyViewer';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-6xl px-2">
        <h1 className="text-2xl font-bold text-center mb-2">Track Your Moles</h1>
        <p className="text-gray-600 text-center mb-4">
          Click on a location on the body model to add or view a mole.
        </p>
        
        <HumanBodyViewer />
      </div>
    </div>
  );
}
