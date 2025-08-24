'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useAccessibility';
import { ariaUtils } from '@/lib/accessibility';
import ReducedMotionWrapper from '@/components/accessibility/ReducedMotionWrapper';

/**
 * AnalysisProgress component with animated progress bar and stage tracking
 * Provides real-time feedback during repository analysis with accessibility support
 */
export default function AnalysisProgress({
  progress = 0,
  currentStage = '',
  stages = [],
  error = null,
  onRetry = null,
  estimatedTimeRemaining = null,
  isComplete = false,
  className = ''
}) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [previousStage, setPreviousStage] = useState('');
  const progressBarRef = useRef(null);
  const stageAnnouncementRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Animate progress bar smoothly
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayProgress(progress);
      return;
    }

    const startProgress = displayProgress;
    const targetProgress = progress;
    const duration = 500; // 500ms animation
    const startTime = Date.now();

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progressRatio, 3);
      const currentProgress = startProgress + (targetProgress - startProgress) * easeOutCubic;
      
      setDisplayProgress(currentProgress);
      
      if (progressRatio < 1) {
        requestAnimationFrame(animateProgress);
      }
    };

    requestAnimationFrame(animateProgress);
  }, [progress, prefersReducedMotion]);

  // Announce stage changes to screen readers
  useEffect(() => {
    if (currentStage && currentStage !== previousStage) {
      const message = error 
        ? `Analysis error: ${error}`
        : isComplete 
          ? 'Analysis complete'
          : `Analysis stage: ${currentStage}`;
      
      ariaUtils.announce(message, 'polite');
      setPreviousStage(currentStage);
    }
  }, [currentStage, previousStage, error, isComplete]);

  // Calculate progress percentage
  const progressPercentage = Math.round(displayProgress);
  const progressWidth = `${Math.min(Math.max(displayProgress, 0), 100)}%`;

  // Format estimated time remaining
  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds remaining`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    } else {
      const hours = Math.round(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    }
  };

  // Get current stage index for visual indicators
  const currentStageIndex = stages.findIndex(stage => stage.name === currentStage);
  const completedStages = stages.slice(0, currentStageIndex);
  const upcomingStages = stages.slice(currentStageIndex + 1);

  return (
    <div className={`analysis-progress ${className}`} role="region" aria-label="Analysis Progress">
      {/* Progress Bar Container */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {error ? 'Analysis Error' : isComplete ? 'Analysis Complete' : 'Analyzing Repository'}
          </h3>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {progressPercentage}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div 
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Analysis progress: ${progressPercentage}% complete`}
        >
          <ReducedMotionWrapper
            animationType="progressBar"
            className="h-full transition-all duration-500 ease-out"
          >
            <div
              ref={progressBarRef}
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                error 
                  ? 'bg-red-500' 
                  : isComplete 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
              }`}
              style={{ width: progressWidth }}
            />
          </ReducedMotionWrapper>
        </div>
      </div>

      {/* Current Stage Display */}
      {currentStage && !error && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              isComplete ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
            }`} />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {currentStage}
            </span>
          </div>
          
          {/* Estimated Time Remaining */}
          {estimatedTimeRemaining && !isComplete && (
            <p className="text-xs text-gray-600 dark:text-gray-400 ml-5">
              {formatTimeRemaining(estimatedTimeRemaining)}
            </p>
          )}
        </div>
      )}

      {/* Stage List */}
      {stages.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Analysis Stages
          </h4>
          
          <div className="space-y-2" role="list">
            {stages.map((stage, index) => {
              const isCurrentStage = stage.name === currentStage;
              const isCompleted = completedStages.some(s => s.name === stage.name);
              const isUpcoming = upcomingStages.some(s => s.name === stage.name);
              
              return (
                <div
                  key={stage.name}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    isCurrentStage 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                      : isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                  role="listitem"
                  aria-current={isCurrentStage ? 'step' : undefined}
                >
                  {/* Stage Status Icon */}
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500' 
                      : isCurrentStage 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {isCompleted && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {isCurrentStage && !prefersReducedMotion && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  {/* Stage Information */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      isCurrentStage 
                        ? 'text-blue-900 dark:text-blue-100' 
                        : isCompleted
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stage.name}
                    </p>
                    {stage.description && (
                      <p className={`text-xs mt-1 ${
                        isCurrentStage 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : isCompleted
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        {stage.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Stage Duration */}
                  {stage.duration && (
                    <span className={`text-xs ${
                      isCurrentStage 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      ~{stage.duration}s
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                Analysis Failed
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
          
          {/* Retry Button */}
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:text-red-100 dark:bg-red-800 dark:hover:bg-red-700 transition-colors"
                aria-label="Retry analysis"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {isComplete && !error && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                Analysis Complete
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Repository analysis finished successfully. Review the detected technologies below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Announcements */}
      <div 
        ref={stageAnnouncementRef}
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      />
    </div>
  );
}

/**
 * Hook for managing analysis progress state
 */
export function useAnalysisProgress(initialStages = []) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [stages, setStages] = useState(initialStages);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [startTime] = useState(Date.now());

  // Calculate estimated time remaining based on progress
  useEffect(() => {
    if (progress > 0 && progress < 100 && !isComplete) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = progress / elapsed;
      const remaining = (100 - progress) / rate;
      setEstimatedTimeRemaining(remaining);
    } else {
      setEstimatedTimeRemaining(null);
    }
  }, [progress, isComplete, startTime]);

  const updateProgress = (newProgress, stageName = '') => {
    setProgress(Math.min(Math.max(newProgress, 0), 100));
    if (stageName) {
      setCurrentStage(stageName);
    }
    if (newProgress >= 100) {
      setIsComplete(true);
    }
  };

  const setStageComplete = (stageName) => {
    setStages(prevStages => 
      prevStages.map(stage => 
        stage.name === stageName 
          ? { ...stage, completed: true }
          : stage
      )
    );
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsComplete(false);
  };

  const reset = () => {
    setProgress(0);
    setCurrentStage('');
    setError(null);
    setIsComplete(false);
    setEstimatedTimeRemaining(null);
    setStages(initialStages);
  };

  return {
    progress,
    currentStage,
    stages,
    error,
    isComplete,
    estimatedTimeRemaining,
    updateProgress,
    setCurrentStage,
    setStageComplete,
    handleError,
    reset
  };
}