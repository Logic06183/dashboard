/**
 * TutorialOverlay.js
 * Interactive tutorial/tooltip system to guide users through the app
 * Shows step-by-step popups explaining features
 */

import React, { useState, useEffect } from 'react';

const TutorialOverlay = ({ steps, onComplete, tutorialKey, autoStart = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Check if user has seen this tutorial today
  useEffect(() => {
    const lastShown = localStorage.getItem(`tutorial_last_shown_${tutorialKey}`);
    const today = new Date().toDateString();

    // Check if tutorial was already shown today
    const shownToday = lastShown === today;
    setHasCompleted(shownToday);

    // Auto-start if enabled and not shown today
    if (autoStart && !shownToday) {
      setIsActive(true);
      localStorage.setItem(`tutorial_last_shown_${tutorialKey}`, today);
    }
  }, [tutorialKey, autoStart]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const handleComplete = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`tutorial_last_shown_${tutorialKey}`, today);
    setHasCompleted(true);
    setIsActive(false);
    setCurrentStep(0);
    if (onComplete) onComplete();
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  if (!isActive) {
    // Show a small button to restart tutorial if they've seen it before
    if (hasCompleted) {
      return (
        <button
          onClick={handleRestart}
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
          title="Restart Tutorial"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      );
    }
    return null;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleSkip} />

      {/* Tutorial Popup */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl max-w-md"
        style={{
          top: step.position?.top || '50%',
          left: step.position?.left || '50%',
          transform: step.position ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Counter */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Skip Tutorial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Icon */}
          {step.icon && (
            <div className="text-4xl mb-4 text-center">
              {step.icon}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Image/GIF (optional) */}
          {step.image && (
            <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
              <img src={step.image} alt={step.title} className="w-full" />
            </div>
          )}

          {/* Tips (optional) */}
          {step.tips && step.tips.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-blue-800 mb-2">💡 Tips:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                {step.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorialOverlay;
