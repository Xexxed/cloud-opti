'use client';

import { useTheme as useThemeContext } from '@/contexts/ThemeContext';

// Re-export the useTheme hook for convenience
export const useTheme = useThemeContext;