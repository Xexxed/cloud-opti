'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  motionUtils, 
  colorUtils, 
  keyboardUtils, 
  ariaUtils, 
  focusUtils,
  accessibilityManager 
} from '@/lib/accessibility';

/**
 * Hook for managing accessibility features
 */
export const useAccessibility = (options = {}) => {
  const {
    enableReducedMotion = true,
    enableKeyboardNavigation = true,
    enableColorValidation = true,
    enableFocusManagement = true
  } = options;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const [colorValidation, setColorValidation] = useState(null);

  // Initialize accessibility features
  useEffect(() => {
    const cleanup = accessibilityManager.init();
    
    // Set initial reduced motion state
    setPrefersReducedMotion(motionUtils.prefersReducedMotion());
    
    return cleanup;
  }, []);

  // Monitor reduced motion preference changes
  useEffect(() => {
    if (!enableReducedMotion) return;

    const cleanup = motionUtils.createReducedMotionListener((prefersReduced) => {
      setPrefersReducedMotion(prefersReduced);
    });

    return cleanup;
  }, [enableReducedMotion]);

  // Monitor keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enableKeyboardNavigation]);

  // Validate colors when theme changes
  const validateThemeColors = useCallback((themeColors) => {
    if (!enableColorValidation) return null;
    
    const validation = colorUtils.validateThemeColors(themeColors);
    setColorValidation(validation);
    
    if (!validation.valid) {
      console.warn('Theme color accessibility issues detected:', validation.issues);
    }
    
    return validation;
  }, [enableColorValidation]);

  // Apply static styles for reduced motion
  const applyStaticStyles = useCallback((element, animationType) => {
    if (prefersReducedMotion) {
      motionUtils.applyStaticStyles(element, animationType);
      return true;
    }
    return false;
  }, [prefersReducedMotion]);

  // Create keyboard navigation for elements
  const createKeyboardNav = useCallback((elements, navOptions = {}) => {
    if (!enableKeyboardNavigation || !elements.length) return () => {};
    
    return keyboardUtils.createKeyboardNavigation(elements, navOptions);
  }, [enableKeyboardNavigation]);

  // Announce to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    ariaUtils.announce(message, priority);
  }, []);

  // Create focus trap
  const createFocusTrap = useCallback((container) => {
    if (!enableFocusManagement || !container) return () => {};
    
    return focusUtils.createFocusTrap(container);
  }, [enableFocusManagement]);

  // Focus manager for saving/restoring focus
  const focusManager = useCallback(() => {
    if (!enableFocusManagement) return { save: () => {}, restore: () => {} };
    
    return focusUtils.createFocusManager();
  }, [enableFocusManagement]);

  return {
    // State
    prefersReducedMotion,
    keyboardNavigation,
    colorValidation,
    
    // Methods
    validateThemeColors,
    applyStaticStyles,
    createKeyboardNav,
    announce,
    createFocusTrap,
    focusManager,
    
    // Utilities
    motionUtils,
    colorUtils,
    keyboardUtils,
    ariaUtils,
    focusUtils
  };
};

/**
 * Hook for reduced motion support
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Set initial state
    setPrefersReducedMotion(motionUtils.prefersReducedMotion());

    // Listen for changes
    const cleanup = motionUtils.createReducedMotionListener(setPrefersReducedMotion);
    
    return cleanup;
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (elements, options = {}) => {
  useEffect(() => {
    if (!elements || elements.length === 0) return;

    const cleanup = keyboardUtils.createKeyboardNavigation(elements, options);
    
    return cleanup;
  }, [elements, options]);
};

/**
 * Hook for focus management
 */
export const useFocusManagement = (containerRef, options = {}) => {
  const { trapFocus = false, restoreFocus = true } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    let focusTrapCleanup = () => {};
    let focusManager = null;

    if (restoreFocus) {
      focusManager = focusUtils.createFocusManager();
      focusManager.save();
    }

    if (trapFocus) {
      focusTrapCleanup = focusUtils.createFocusTrap(containerRef.current);
    }

    return () => {
      focusTrapCleanup();
      if (focusManager && restoreFocus) {
        focusManager.restore();
      }
    };
  }, [containerRef, trapFocus, restoreFocus]);
};

/**
 * Hook for ARIA announcements
 */
export const useAnnouncements = () => {
  const announce = useCallback((message, priority = 'polite') => {
    ariaUtils.announce(message, priority);
  }, []);

  const announceNavigation = useCallback((section) => {
    announce(`Navigated to ${section}`, 'polite');
  }, [announce]);

  const announceAction = useCallback((action) => {
    announce(`${action} completed`, 'assertive');
  }, [announce]);

  return {
    announce,
    announceNavigation,
    announceAction
  };
};

export default useAccessibility;