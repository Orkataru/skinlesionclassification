'use client';

import React, { useState, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import { useMoleStore, type Mole } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { MoleRecord } from '@/components/MoleRecord';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

// Use a single body image
const BODY_IMAGE = '/body.png';

// Mole size configuration
const MOLE_CONFIG = {
  normal: {
    size: 0.6, // in rem
    color: 'bg-green-500',
  },
  selected: {
    size: 0.6, // in rem - same size as normal
    color: 'bg-blue-600',
  }
};

export function HumanBodyViewer() {
  const router = useRouter();
  const { moles, getMoleByLocation } = useMoleStore();
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedMole, setSelectedMole] = useState<Mole | null>(null);
  const [currentMoleIndex, setCurrentMoleIndex] = useState(0);
  
  const handleBodyClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Check if there's a mole near this point
    const existingMole = getMoleByLocation(x, y, 3); // 3% threshold
    
    if (existingMole) {
      setSelectedMole(existingMole);
      // Find the index of this mole in the moles array
      const moleIndex = moles.findIndex(m => m.id === existingMole.id);
      if (moleIndex !== -1) {
        setCurrentMoleIndex(moleIndex);
      }
    } else {
      setSelectedMole(null);
    }
    
    setSelectedPoint({ x, y });
  }, [getMoleByLocation, moles]);
  
  const navigateToAddMole = useCallback(() => {
    if (selectedPoint) {
      router.push(`/add-mole?x=${selectedPoint.x}&y=${selectedPoint.y}&returnTo=home`);
    }
  }, [router, selectedPoint]);
  
  const handleViewRecord = useCallback((moleId: string, recordId: string) => {
    router.push(`/record/${moleId}/${recordId}`);
  }, [router]);
  
  const handleAddRecord = useCallback((moleId: string) => {
    router.push(`/add-mole?moleId=${moleId}&returnTo=home`);
  }, [router]);
  
  const navigateToPrevMole = useCallback(() => {
    if (moles.length > 0) {
      const newIndex = currentMoleIndex > 0 ? currentMoleIndex - 1 : moles.length - 1;
      setCurrentMoleIndex(newIndex);
      setSelectedMole(moles[newIndex]);
      setSelectedPoint(moles[newIndex].location);
    }
  }, [moles, currentMoleIndex]);
  
  const navigateToNextMole = useCallback(() => {
    if (moles.length > 0) {
      const newIndex = currentMoleIndex < moles.length - 1 ? currentMoleIndex + 1 : 0;
      setCurrentMoleIndex(newIndex);
      setSelectedMole(moles[newIndex]);
      setSelectedPoint(moles[newIndex].location);
    }
  }, [moles, currentMoleIndex]);
  
  const clearSelection = useCallback(() => {
    setSelectedPoint(null);
    setSelectedMole(null);
  }, []);
  
  // Get current mole for left panel
  const currentMole = moles.length > 0 ? moles[currentMoleIndex] : null;
  
  // Sort records for current mole
  const sortedRecords = currentMole ? [...currentMole.records].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }) : [];
  
  const renderLeftPanel = () => {
    if (moles.length === 0) {
      // No moles exist
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <h3 className="text-lg font-semibold mb-4">No Moles Added Yet</h3>
          <p className="text-gray-600 mb-6">
            Add a mole by clicking a point on the body
          </p>
          {selectedPoint && !selectedMole && (
            <div className="w-full bg-white rounded-lg shadow-lg p-4 border">
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">New Point Selected</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Would you like to add a mole at this location?
                </p>
                <Button 
                  variant="default"
                  onClick={navigateToAddMole}
                >
                  Add a New Mole
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // If a point is selected but it's not an existing mole, show only the add mole box
    if (selectedPoint && !selectedMole) {
      return (
        <div className="flex flex-col h-full">
          {/* Header with back button */}
          <div className="flex items-center justify-between p-4 border-b">
            <Button
              variant="outline"
              onClick={clearSelection}
            >
              Turn to Mole List
            </Button>
          </div>
          
          {/* Add mole content */}
          <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
            <div className="w-full bg-white rounded-lg shadow-lg p-4 border">
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">New Point Selected</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Would you like to add a mole at this location?
                </p>
                <Button 
                  variant="default"
                  onClick={navigateToAddMole}
                >
                  Add a New Mole
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Moles exist - show navigation and current mole details
    return (
      <div className="flex flex-col h-full">
        {/* Navigation Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="outline"
            size="icon"
            onClick={navigateToPrevMole}
            disabled={moles.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="font-semibold">Mole {currentMoleIndex + 1} of {moles.length}</h3>
            <p className="text-sm text-gray-500">
              {currentMole?.records.length || 0} records
            </p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={navigateToNextMole}
            disabled={moles.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Mole Details - Desktop only */}
        <div className="hidden md:flex md:flex-col md:flex-1 p-4 overflow-y-auto">
          {currentMole && (
            <>
              <div className="mb-4">
                <Button 
                  className="w-full" 
                  onClick={() => handleAddRecord(currentMole.id)}
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
                      onClick={() => handleViewRecord(currentMole.id, record.id)}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No records found</p>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Mobile - Show Last Record */}
        <div className="md:hidden p-4 flex flex-col gap-4">
          {currentMole && (
            <>
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => handleAddRecord(currentMole.id)}
                >
                  Add New Record
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/process/${currentMole.id}`)}
                >
                  View All Records
                </Button>
              </div>
              
              {sortedRecords.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Record:</h4>
                  <MoleRecord
                    record={sortedRecords[0]}
                    onClick={() => handleViewRecord(currentMole.id, sortedRecords[0].id)}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No records found for this mole</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)]">
      {/* Left Panel - Mole navigation or add prompt */}
      <div className="w-full md:w-1/3 border rounded-lg overflow-hidden bg-white">
        {renderLeftPanel()}
      </div>
      
      {/* Right Panel - Human Body Viewer */}
      <div className="w-full md:w-2/3 border rounded-lg overflow-hidden bg-white relative">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          limitToBounds={true}
          centerOnInit={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <Button size="icon" variant="outline" onClick={() => zoomIn()}>+</Button>
                <Button size="icon" variant="outline" onClick={() => zoomOut()}>-</Button>
                <Button size="icon" variant="outline" onClick={() => resetTransform()}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
                    <path d="M12 8v4l2 2"/>
                  </svg>
                </Button>
              </div>
              
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <div className="relative" onClick={handleBodyClick} style={{ width: '100%', height: '100%' }}>
                  <Image 
                    src={BODY_IMAGE}
                    alt="Human body"
                    className="mx-auto object-contain h-full w-auto"
                    width={400}
                    height={600}
                    priority
                    unoptimized
                    onError={(e) => {
                      console.error('Failed to load body image');
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMWYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM3NTc1NzUiPkh1bWFuIEJvZHkgT3V0bGluZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  
                  {/* Display existing moles */}
                  {moles.map((mole) => (
                    <div
                      key={mole.id}
                      className={`absolute rounded-full ${
                        selectedMole?.id === mole.id ? MOLE_CONFIG.selected.color : MOLE_CONFIG.normal.color
                      } transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                        selectedMole?.id === mole.id 
                          ? 'border-2 border-white shadow-[0_0_0_3px_rgba(59,130,246,0.5),0_0_20px_rgba(59,130,246,0.4)]' 
                          : ''
                      }`}
                      style={{
                        left: `${mole.location.x}%`,
                        top: `${mole.location.y}%`,
                        width: `${selectedMole?.id === mole.id ? MOLE_CONFIG.selected.size : MOLE_CONFIG.normal.size}rem`,
                        height: `${selectedMole?.id === mole.id ? MOLE_CONFIG.selected.size : MOLE_CONFIG.normal.size}rem`,
                      }}
                    />
                  ))}
                  
                  {/* Display selected point for new mole */}
                  {selectedPoint && !selectedMole && (
                    <div
                      className={`absolute rounded-full ${MOLE_CONFIG.selected.color} transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-[0_0_0_3px_rgba(59,130,246,0.5),0_0_20px_rgba(59,130,246,0.4)] z-10`}
                      style={{
                        left: `${selectedPoint.x}%`,
                        top: `${selectedPoint.y}%`,
                        width: `${MOLE_CONFIG.selected.size}rem`,
                        height: `${MOLE_CONFIG.selected.size}rem`,
                      }}
                    />
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
} 