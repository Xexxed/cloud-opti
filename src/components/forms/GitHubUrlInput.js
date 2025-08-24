'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { validateGitHubUrl } from '@/lib/github/urlValidation';
import { GitHubService } from '@/lib/github/GitHubService';

/**
 * GitHubUrlInput Component
 * 
 * A specialized input component for GitHub repository URLs with:
 * - Real-time URL format validation
 * - Repository accessibility checking
 * - Comprehensive accessibility features
 * - Loading states and error handling
 * - ARIA labels and announcements
 */
export default function GitHubUrlInput({
  value = '',
  onChange,
  onValidation,
  placeholder = 'Enter GitHub repository URL (e.g., https://github.com/owner/repo)',
  disabled = false,
  autoFocus = false,
  className = '',
  id = 'github-url-input',
  'aria-label': ariaLabel = 'GitHub repository URL',
  'aria-describedby': ariaDescribedBy,
  ...props
}) {
  // State management
  const [inputValue, setInputValue] = useState(value);
  const [validationState, setValidationState] = useState({
    isValidating: false,
    isValid: null,
    isAccessible: null,
    error: null,
    repository: null
  });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Refs for accessibility
  const inputRef = useRef(null);
  const errorRef = useRef(null);
  const statusRef = useRef(null);
  const validationTimeoutRef = useRef(null);
  
  // GitHub service instance
  const githubService = useRef(new GitHubService());

  // Debounced validation function
  const validateUrl = useCallback(async (url) => {
    if (!url.trim()) {
      setValidationState({
        isValidating: false,
        isValid: null,
        isAccessible: null,
        error: null,
        repository: null
      });
      return;
    }

    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      // First, validate URL format
      const formatValidation = validateGitHubUrl(url);
      
      if (!formatValidation.isValid) {
        const newState = {
          isValidating: false,
          isValid: false,
          isAccessible: null,
          error: formatValidation.error,
          repository: null
        };
        setValidationState(newState);
        onValidation?.(newState);
        return;
      }

      // Then check repository accessibility
      const accessibilityCheck = await githubService.current.validateRepository(url);
      
      const newState = {
        isValidating: false,
        isValid: formatValidation.isValid,
        isAccessible: accessibilityCheck.isAccessible,
        error: accessibilityCheck.error,
        repository: accessibilityCheck.repository
      };
      
      setValidationState(newState);
      onValidation?.(newState);
      
    } catch (error) {
      const newState = {
        isValidating: false,
        isValid: false,
        isAccessible: false,
        error: `Validation failed: ${error.message}`,
        repository: null
      };
      setValidationState(newState);
      onValidation?.(newState);
    }
  }, [onValidation]);

  // Handle input changes with debouncing
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasUserInteracted(true);
    onChange?.(newValue);

    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Debounce validation by 500ms
    validationTimeoutRef.current = setTimeout(() => {
      validateUrl(newValue);
    }, 500);
  }, [onChange, validateUrl]);

  // Handle blur event for immediate validation
  const handleBlur = useCallback(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    if (inputValue.trim()) {
      validateUrl(inputValue);
    }
  }, [inputValue, validateUrl]);

  // Handle focus for accessibility
  const handleFocus = useCallback(() => {
    setHasUserInteracted(true);
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Determine validation status for styling and accessibility
  const getValidationStatus = () => {
    if (!hasUserInteracted || !inputValue.trim()) {
      return 'neutral';
    }
    if (validationState.isValidating) {
      return 'validating';
    }
    if (validationState.isValid === false) {
      return 'invalid';
    }
    if (validationState.isValid && validationState.isAccessible === false) {
      return 'inaccessible';
    }
    if (validationState.isValid && validationState.isAccessible === true) {
      return 'valid';
    }
    return 'neutral';
  };

  const validationStatus = getValidationStatus();

  // Generate status message for screen readers
  const getStatusMessage = () => {
    if (!hasUserInteracted || !inputValue.trim()) {
      return '';
    }
    if (validationState.isValidating) {
      return 'Validating repository URL...';
    }
    if (validationState.error) {
      return `Error: ${validationState.error}`;
    }
    if (validationState.isValid && validationState.isAccessible === true) {
      const repoName = validationState.repository?.fullName || 'repository';
      return `Valid repository: ${repoName}`;
    }
    return '';
  };

  // Generate CSS classes based on validation state
  const getInputClasses = () => {
    const baseClasses = [
      'w-full',
      'px-4',
      'py-3',
      'text-base',
      'border-2',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed'
    ];

    const statusClasses = {
      neutral: [
        'border-gray-300',
        'focus:border-blue-500',
        'focus:ring-blue-500'
      ],
      validating: [
        'border-yellow-300',
        'focus:border-yellow-500',
        'focus:ring-yellow-500'
      ],
      invalid: [
        'border-red-300',
        'focus:border-red-500',
        'focus:ring-red-500'
      ],
      inaccessible: [
        'border-orange-300',
        'focus:border-orange-500',
        'focus:ring-orange-500'
      ],
      valid: [
        'border-green-300',
        'focus:border-green-500',
        'focus:ring-green-500'
      ]
    };

    return [...baseClasses, ...statusClasses[validationStatus], className].join(' ');
  };

  // Generate unique IDs for accessibility
  const errorId = `${id}-error`;
  const statusId = `${id}-status`;
  const describedBy = [ariaDescribedBy, errorId, statusId].filter(Boolean).join(' ');

  return (
    <div className="relative">
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="url"
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputClasses()}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={validationStatus === 'invalid' || validationStatus === 'inaccessible'}
          autoComplete="url"
          spellCheck="false"
          {...props}
        />
        
        {/* Loading indicator */}
        {validationState.isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div 
              className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full"
              aria-hidden="true"
            />
          </div>
        )}
        
        {/* Validation status icon */}
        {!validationState.isValidating && hasUserInteracted && inputValue.trim() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validationStatus === 'valid' && (
              <svg 
                className="h-5 w-5 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {(validationStatus === 'invalid' || validationStatus === 'inaccessible') && (
              <svg 
                className={`h-5 w-5 ${validationStatus === 'invalid' ? 'text-red-500' : 'text-orange-500'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {validationState.error && hasUserInteracted && (
        <div
          ref={errorRef}
          id={errorId}
          className={`mt-2 text-sm ${
            validationStatus === 'invalid' ? 'text-red-600' : 'text-orange-600'
          }`}
          role="alert"
          aria-live="polite"
        >
          {validationState.error}
        </div>
      )}

      {/* Success message with repository info */}
      {validationState.isValid && validationState.isAccessible && validationState.repository && hasUserInteracted && (
        <div className="mt-2 text-sm text-green-600">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              Repository found: <strong>{validationState.repository.fullName}</strong>
            </span>
          </div>
          {validationState.repository.language && (
            <div className="mt-1 text-xs text-gray-600">
              Primary language: {validationState.repository.language}
            </div>
          )}
        </div>
      )}

      {/* Screen reader status announcements */}
      <div
        ref={statusRef}
        id={statusId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {getStatusMessage()}
      </div>
    </div>
  );
}