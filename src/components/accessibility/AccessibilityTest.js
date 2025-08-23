'use client';

import { useEffect, useState } from 'react';
import { accessibilityManager, colorUtils } from '@/lib/accessibility';
import { themeConfig } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Component for testing and validating accessibility features
 * Only renders in development mode
 */
export default function AccessibilityTest() {
  const { theme } = useTheme();
  const [validationResults, setValidationResults] = useState(null);
  const [colorValidation, setColorValidation] = useState(null);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Validate page accessibility
    const results = accessibilityManager.validate();
    setValidationResults(results);

    // Validate theme colors
    const colors = themeConfig[theme];
    const colorResults = colorUtils.validateThemeColors(colors);
    setColorValidation(colorResults);

    console.group('🔍 Accessibility Validation Results');
    
    if (results.valid) {
      console.log('✅ Page accessibility validation passed');
    } else {
      console.warn('❌ Page accessibility issues found:');
      results.issues.forEach(issue => console.warn(`  - ${issue}`));
    }

    if (results.warnings.length > 0) {
      console.warn('⚠️ Accessibility warnings:');
      results.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    if (colorResults.valid) {
      console.log('✅ Color contrast validation passed');
    } else {
      console.warn('❌ Color contrast issues found:');
      colorResults.issues.forEach(issue => {
        console.warn(`  - ${issue.combination}: ${issue.ratio} (required: ${issue.required})`);
      });
    }

    console.groupEnd();
  }, [theme]);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 text-sm">
        <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">
          Accessibility Status
        </h3>
        
        {validationResults && (
          <div className="mb-3">
            <div className={`flex items-center gap-2 ${validationResults.valid ? 'text-green-600' : 'text-red-600'}`}>
              <span>{validationResults.valid ? '✅' : '❌'}</span>
              <span>Page Validation</span>
            </div>
            {!validationResults.valid && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {validationResults.issues.length} issues found
              </div>
            )}
          </div>
        )}

        {colorValidation && (
          <div className="mb-3">
            <div className={`flex items-center gap-2 ${colorValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
              <span>{colorValidation.valid ? '✅' : '❌'}</span>
              <span>Color Contrast</span>
            </div>
            {!colorValidation.valid && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {colorValidation.issues.length} contrast issues
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400">
          Dev mode only
        </div>
      </div>
    </div>
  );
}