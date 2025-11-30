import { useEffect, useState, useRef, useCallback } from 'react';

export function useCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestCameraPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API not supported in this browser');
      setHasPermission(false);
      setIsLoading(false);
      return;
    }

    // Mobile Safari and some Android browsers require user interaction
    // before media can play. We'll set this flag to allow our UI to handle it.
    const isMobileBrowser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log('Detected mobile browser:', isMobileBrowser);

    try {
      // Try getting all video devices first to see what's available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Available video devices:', videoDevices.length);
        videoDevices.forEach((device, i) => {
          console.log(`Camera ${i+1}: ${device.label || 'unnamed camera'}`);
        });
      } catch (enumError) {
        console.warn('Could not enumerate devices:', enumError);
      }

      // Try a simpler approach - request camera with basic options first
      try {
        console.log('Attempting to access camera with basic constraints');
        
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: 'user', // Try selfie mode first as it's more likely to work
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        
        console.log('Using constraints:', JSON.stringify(constraints));
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const videoTracks = stream.getVideoTracks();
        console.log(`Got ${videoTracks.length} video tracks`);
        videoTracks.forEach((track, i) => {
          console.log(`Track ${i+1}:`, track.label, track.getSettings());
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // For iOS compatibility, we need to manually call play()
          try {
            await videoRef.current.play();
            console.log('Video.play() succeeded immediately');
          } catch (playError) {
            console.warn('Autoplay failed, will require user interaction', playError);
            // We'll handle this in the UI by having the user tap to activate
          }
        }
        
        setHasPermission(true);
        console.log('Camera access successful with basic constraints');
      } catch (basicError) {
        console.error('Failed with basic constraints, trying with specific device access', basicError);
        
        // Get list of available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('Available devices:', devices);
        
        // Find video input devices
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Available video devices:', videoDevices);
        
        if (videoDevices.length === 0) {
          throw new Error('No video devices found');
        }
        
        // Try to use the last camera (usually the back camera on mobile)
        const preferredCamera = videoDevices[videoDevices.length - 1].deviceId;
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: preferredCamera
          }
        });
        
        const videoTracks = stream.getVideoTracks();
        console.log(`Got ${videoTracks.length} video tracks from specific device`);
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // For iOS compatibility, we need to manually call play()
          try {
            await videoRef.current.play();
            console.log('Video.play() succeeded immediately');
          } catch (playError) {
            console.warn('Autoplay failed, will require user interaction', playError);
            // We'll handle this in the UI by having the user tap to activate
          }
        }
        
        setHasPermission(true);
        console.log('Camera access successful with specific device ID');
      }
    } catch (err) {
      console.error('All camera access attempts failed:', err);
      
      // More descriptive error messages
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
          setError('Camera is already in use by another application or tab.');
        } else if (err.name === 'SecurityError') {
          setError('Camera access is blocked due to security restrictions.');
        } else if (err.name === 'OverconstrainedError') {
          setError('Could not find a camera matching the requested constraints.');
        } else {
          setError(`Camera error: ${err.name}`);
        }
      } else {
        setError('Could not access camera. Please allow camera access and try again.');
      }
      
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    hasPermission,
    isLoading,
    error,
    requestCameraPermission,
    stopCamera
  };
} 