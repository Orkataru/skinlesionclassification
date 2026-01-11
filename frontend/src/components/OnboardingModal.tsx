'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  MapPin, 
  BarChart3, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    icon: Camera,
    title: 'Capture or Upload',
    description: 'Take a photo of a skin lesion using your device camera, or upload an existing image for analysis.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    icon: MapPin,
    title: 'Track Location',
    description: 'Mark the location of each mole on an interactive body map for easy tracking over time.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50'
  },
  {
    icon: BarChart3,
    title: 'AI Analysis',
    description: 'Our deep learning model analyzes the image and provides probability scores across 8 skin lesion types.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50'
  },
  {
    icon: AlertTriangle,
    title: 'Important Limitations',
    description: 'This is a research tool, not a medical device. Results are not diagnostic and should never replace professional medical evaluation by a qualified dermatologist.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    isWarning: true
  }
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('has-seen-onboarding');
    if (!hasSeenOnboarding) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('has-seen-onboarding', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const IconComponent = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Welcome to MoleTracker
          </DialogTitle>
          <DialogDescription className="text-center">
            Track and monitor your skin health with AI assistance
          </DialogDescription>
        </DialogHeader>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 py-2">
          {ONBOARDING_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep 
                  ? 'bg-blue-500 w-6' 
                  : idx < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="py-6">
          <div className={`mx-auto w-16 h-16 ${step.bgColor} rounded-full flex items-center justify-center mb-4`}>
            <IconComponent className={`h-8 w-8 ${step.color}`} />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">
            {step.title}
          </h3>
          
          <p className={`text-center text-sm ${step.isWarning ? 'text-amber-700' : 'text-gray-600'}`}>
            {step.description}
          </p>

          {step.isWarning && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 text-center">
                By continuing, you acknowledge that you understand these limitations 
                and will seek professional medical advice for any health concerns.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-gray-500"
          >
            Skip
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={handleNext}
              className={isLastStep ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  I Understand
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

