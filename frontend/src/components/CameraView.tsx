'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Camera, Image as ImageIcon, Upload } from 'lucide-react';
import { SimpleCamera } from '@/components/SimpleCamera';

interface CameraViewProps {
  onImageCapture: (imageData: string) => void;
}

export function CameraView({ onImageCapture }: CameraViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [showCameraTab, setShowCameraTab] = useState(true);

  useEffect(() => {
    // Check if running on HTTPS (required for camera access)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setSecurityWarning('Camera may not work: This site needs to run on HTTPS for camera access.');
      console.warn('Camera access requires HTTPS unless on localhost');
    }
    
    // For production builds, start with file upload tab if not on localhost
    if (process.env.NODE_ENV === 'production' && window.location.hostname !== 'localhost') {
      setShowCameraTab(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageCapture(result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const renderFileUploadTab = () => {
    return (
      <div className="flex flex-col items-center justify-center h-60 w-full p-4 text-center">
        <div className="mb-6">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Upload an Image</h3>
          <p className="text-sm text-gray-500 mt-1">Select an image from your device</p>
        </div>
        
        <div className="flex flex-col gap-2 w-full">
          <Button 
            onClick={triggerFileUpload} 
            size="lg"
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full bg-gray-50">
      <CardContent className="p-4">
        {securityWarning && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">{securityWarning}</p>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex border-b mb-4">
          <button
            className={`flex-1 py-2 text-center font-medium text-sm ${showCameraTab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setShowCameraTab(true)}
          >
            <Camera className="h-4 w-4 inline-block mr-1" />
            Camera
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium text-sm ${!showCameraTab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setShowCameraTab(false)}
          >
            <ImageIcon className="h-4 w-4 inline-block mr-1" />
            Upload
          </button>
        </div>

        {!showCameraTab ? (
          renderFileUploadTab()
        ) : (
          <div className="pt-2">
            <SimpleCamera onCapture={onImageCapture} />
            {/* No additional options needed */}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 