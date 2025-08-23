'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { keyboardUtils } from '@/lib/accessibility';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const accessibility = useAccessibility();
  const [skipLinks, setSkipLinks] = useState([]);

  // Initialize skip links
  useEffect(() => {
    const sections = [
      { id: 'hero', label: 'main content' },
      { id: 'features', label: 'features section' },
      { id: 'how-it-works', label: 'how it works section' },
      { id: 'cta', label: 'call to action' },
      { id: 'footer', label: 'footer' }
    ];

    setSkipLinks(sections);

    // Create and insert skip links
    const skipLinksElement = keyboardUtils.createSkipLinks(sections);
    document.body.insertBefore(skipLinksElement, document.body.firstChild);

    return () => {
      // Cleanup skip links on unmount
      const existingSkipLinks = document.querySelector('.skip-links');
      if (existingSkipLinks) {
        existingSkipLinks.remove();
      }
    };
  }, []);

  // Announce page load
  useEffect(() => {
    accessibility.announce('Cloud Opti landing page loaded', 'polite');
  }, [accessibility]);

  const value = {
    ...accessibility,
    skipLinks
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
}

export default AccessibilityProvider;