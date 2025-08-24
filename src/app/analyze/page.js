'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GitHubUrlInput from '@/components/forms/GitHubUrlInput';
import AnalysisProgress, { useAnalysisProgress } from '@/components/forms/AnalysisProgress';
import TechnologyEditor from '@/components/forms/TechnologyEditor';
import ArchitectureCards from '@/components/forms/ArchitectureCards';
import { GitHubService } from '@/lib/github/GitHubService';
import { ArchitectureRecommendationService } from '@/lib/cloud/ArchitectureRecommendationService';
import { ariaUtils } from '@/lib/accessibility';

// Analysis steps configuration
const ANALYSIS_STEPS = [
  { name: 'Fetching Repository', description: 'Downloading repository contents', duration: 3 },
  { name: 'Analyzing Code Structure', description: 'Examining file structure and patterns', duration: 5 },
  { name: 'Detecting Technologies', description: 'Identifying frameworks and dependencies', duration: 4 },
  { name: 'Parsing Dependencies', description: 'Reading package files and configurations', duration: 3 },
  { name: 'Finalizing Analysis', description: 'Compiling technology stack results', duration: 2 }
];

/**
 * Multi-step analyze page with complete GitHub repository analysis workflow
 * Implements state management, step navigation, and accessibility features
 */
export default function AnalyzePage() {
  // Step management
  const [currentStep, setCurrentStep] = useState('input'); // 'input' | 'analyzing' | 'review' | 'results'
  const [canNavigateBack, setCanNavigateBack] = useState(false);
  
  // Repository state
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [repositoryData, setRepositoryData] = useState(null);
  const [validationState, setValidationState] = useState(null);
  
  // Technology state
  const [detectedTechnologies, setDetectedTechnologies] = useState([]);
  const [confirmedTechnologies, setConfirmedTechnologies] = useState([]);
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  
  // Error handling
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Services
  const githubService = useRef(new GitHubService());
  const recommendationService = useRef(new ArchitectureRecommendationService());
  
  // Progress management
  const progressState = useAnalysisProgress(ANALYSIS_STEPS);
  
  // Accessibility refs
  const stepHeaderRef = useRef(null);
  const errorBoundaryRef = useRef(null);
  
  // Router for navigation
  const router = useRouter();

  // Focus management for accessibility
  const manageFocus = useCallback((step) => {
    // Announce step change to screen readers
    const stepMessages = {
      input: 'Step 1: Enter GitHub repository URL',
      analyzing: 'Step 2: Analyzing repository',
      review: 'Step 3: Review detected technologies',
      results: 'Step 4: View architecture recommendations'
    };
    
    ariaUtils.announce(stepMessages[step], 'polite');
    
    // Focus the step header
    setTimeout(() => {
      if (stepHeaderRef.current) {
        stepHeaderRef.current.focus();
      }
    }, 100);
  }, []);

  // Handle URL input validation
  const handleUrlValidation = useCallback((validation) => {
    setValidationState(validation);
    setError(null);
  }, []);

  // Handle repository analysis
  const handleAnalyzeRepository = useCallback(async () => {
    if (!validationState?.isValid || !validationState?.isAccessible) {
      setError('Please enter a valid and accessible GitHub repository URL');
      return;
    }

    try {
      setCurrentStep('analyzing');
      setError(null);
      progressState.reset();
      manageFocus('analyzing');

      // Start analysis with progress tracking
      progressState.updateProgress(10, 'Fetching Repository');
      
      const analysisResult = await githubService.current.analyzeRepository(
        repositoryUrl,
        (progress, stage) => {
          progressState.updateProgress(progress, stage);
        }
      );

      setRepositoryData(analysisResult.repository);
      setDetectedTechnologies(analysisResult.technologies);
      
      progressState.updateProgress(100, 'Analysis Complete');
      
      // Move to review step after a brief delay
      setTimeout(() => {
        setCurrentStep('review');
        manageFocus('review');
      }, 1000);

    } catch (error) {
      console.error('Analysis failed:', error);
      progressState.handleError(error.message);
      setError(`Analysis failed: ${error.message}`);
    }
  }, [repositoryUrl, validationState, progressState, manageFocus]);

  // Handle technology confirmation
  const handleTechnologyConfirmation = useCallback(async (technologies) => {
    try {
      setIsGeneratingRecommendations(true);
      setConfirmedTechnologies(technologies);
      setError(null);

      // Generate architecture recommendations
      const recommendations = await recommendationService.current.generateRecommendations(
        technologies,
        {
          repository: repositoryData,
          preferences: {
            costOptimization: true,
            managedServices: true,
            scalability: 'medium'
          }
        }
      );

      setRecommendations(recommendations);
      setCurrentStep('results');
      manageFocus('results');

    } catch (error) {
      console.error('Recommendation generation failed:', error);
      setError(`Failed to generate recommendations: ${error.message}`);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  }, [repositoryData, manageFocus]);

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    progressState.reset();
    
    if (currentStep === 'analyzing') {
      handleAnalyzeRepository();
    } else if (currentStep === 'results') {
      handleTechnologyConfirmation(confirmedTechnologies);
    }
  }, [currentStep, handleAnalyzeRepository, handleTechnologyConfirmation, confirmedTechnologies, progressState]);

  // Handle step navigation
  const handleStepNavigation = useCallback((targetStep) => {
    if (targetStep === 'input' && currentStep !== 'input') {
      setCurrentStep('input');
      setError(null);
      progressState.reset();
      manageFocus('input');
    }
  }, [currentStep, progressState, manageFocus]);

  // Handle recommendation selection
  const handleRecommendationSelect = useCallback((recommendation) => {
    setSelectedRecommendation(recommendation);
  }, []);

  // Handle navigation to results page
  const handleNavigateToResults = useCallback(() => {
    if (selectedRecommendation) {
      // Store analysis results in session storage for the results page
      const analysisResults = {
        repository: repositoryData,
        technologies: confirmedTechnologies,
        recommendation: selectedRecommendation,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('cloudOptiAnalysisResults', JSON.stringify(analysisResults));
      router.push('/results');
    }
  }, [selectedRecommendation, repositoryData, confirmedTechnologies, router]);

  // Update navigation state based on current step
  useEffect(() => {
    setCanNavigateBack(currentStep !== 'input');
  }, [currentStep]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (event) => {
      console.error('Unhandled error:', event.error);
      setError('An unexpected error occurred. Please try again.');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with step navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 
                ref={stepHeaderRef}
                className="text-xl font-semibold text-gray-900 dark:text-white"
                tabIndex="-1"
              >
                Repository Analysis
              </h1>
              
              {/* Step indicator */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span className={currentStep === 'input' ? 'text-blue-600 font-medium' : ''}>
                  1. Input
                </span>
                <span>→</span>
                <span className={currentStep === 'analyzing' ? 'text-blue-600 font-medium' : ''}>
                  2. Analysis
                </span>
                <span>→</span>
                <span className={currentStep === 'review' ? 'text-blue-600 font-medium' : ''}>
                  3. Review
                </span>
                <span>→</span>
                <span className={currentStep === 'results' ? 'text-blue-600 font-medium' : ''}>
                  4. Results
                </span>
              </div>
            </div>
            
            {/* Navigation actions */}
            <div className="flex items-center space-x-3">
              {canNavigateBack && (
                <button
                  onClick={() => handleStepNavigation('input')}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="Start over"
                >
                  ← Start Over
                </button>
              )}
              
              <button
                onClick={() => router.push('/')}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error boundary */}
        {error && (
          <div 
            ref={errorBoundaryRef}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                  Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
                {(currentStep === 'analyzing' || currentStep === 'results') && (
                  <button
                    onClick={handleRetry}
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Repository URL Input */}
        {currentStep === 'input' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Analyze Your Repository
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your GitHub repository URL to get cloud architecture recommendations
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <GitHubUrlInput
                value={repositoryUrl}
                onChange={setRepositoryUrl}
                onValidation={handleUrlValidation}
                autoFocus
                className="text-lg"
              />
              
              <div className="mt-6 text-center">
                <button
                  onClick={handleAnalyzeRepository}
                  disabled={!validationState?.isValid || !validationState?.isAccessible}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Analyze Repository
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analysis Progress */}
        {currentStep === 'analyzing' && (
          <div className="max-w-2xl mx-auto">
            <AnalysisProgress
              progress={progressState.progress}
              currentStage={progressState.currentStage}
              stages={progressState.stages}
              error={progressState.error}
              onRetry={handleRetry}
              estimatedTimeRemaining={progressState.estimatedTimeRemaining}
              isComplete={progressState.isComplete}
            />
          </div>
        )}

        {/* Step 3: Technology Review */}
        {currentStep === 'review' && (
          <TechnologyEditor
            detectedTechnologies={detectedTechnologies}
            onModify={setDetectedTechnologies}
            onConfirm={handleTechnologyConfirmation}
            isLoading={isGeneratingRecommendations}
          />
        )}

        {/* Step 4: Architecture Recommendations */}
        {currentStep === 'results' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Architecture Recommendations
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Based on your technology stack, here are optimized cloud architectures
              </p>
            </div>
            
            <ArchitectureCards
              recommendations={recommendations}
              onSelect={handleRecommendationSelect}
              selectedRecommendation={selectedRecommendation}
            />
            
            {selectedRecommendation && (
              <div className="text-center">
                <button
                  onClick={handleNavigateToResults}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  View Detailed Results
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}