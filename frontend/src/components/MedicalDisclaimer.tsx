'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function MedicalDisclaimer() {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check if user has previously minimized the disclaimer
    const minimized = localStorage.getItem('disclaimer-minimized');
    if (minimized === 'true') {
      setIsMinimized(true);
    }
  }, []);

  const handleMinimize = () => {
    setIsMinimized(true);
    localStorage.setItem('disclaimer-minimized', 'true');
  };

  const handleExpand = () => {
    setIsMinimized(false);
    localStorage.removeItem('disclaimer-minimized');
  };

  if (isMinimized) {
    return (
      <button
        onClick={handleExpand}
        className="fixed bottom-4 left-4 z-50 bg-amber-500 text-white p-2 rounded-full shadow-lg hover:bg-amber-600 transition-colors"
        title="Show medical disclaimer"
      >
        <AlertTriangle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-amber-100 p-1.5 rounded-full flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Research Tool Only:</span>{' '}
            <span className="hidden sm:inline">
              This application is not a medical device and is not approved for clinical diagnosis. 
              Results should not replace professional medical evaluation.
            </span>
            <span className="sm:hidden">
              Not for medical diagnosis. Consult a dermatologist.
            </span>
          </p>
        </div>
        <button
          onClick={handleMinimize}
          className="text-amber-600 hover:text-amber-800 p-1 rounded transition-colors flex-shrink-0"
          title="Minimize disclaimer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

