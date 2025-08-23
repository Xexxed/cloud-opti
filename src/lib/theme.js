// Theme configuration with soft, professional colors
// All colors have been validated for WCAG AA accessibility standards
export const themeConfig = {
  light: {
    primary: '#2563EB',      // Darker blue for better contrast (was #3B82F6)
    secondary: '#7C3AED',    // Darker purple for better contrast (was #8B5CF6)
    accent: '#059669',       // Darker green for better contrast (was #10B981)
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#111827',         // Darker text for better contrast (was #1F2937)
    textSecondary: '#4B5563' // Darker secondary text for better contrast (was #6B7280)
  },
  dark: {
    primary: '#60A5FA',      // Lighter blue for dark mode
    secondary: '#A78BFA',    // Lighter purple for dark mode
    accent: '#34D399',       // Lighter green for dark mode
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F9FAFB',         // Lighter text for better contrast (was #F1F5F9)
    textSecondary: '#D1D5DB' // Lighter secondary text for better contrast (was #94A3B8)
  }
};

// Apply theme to CSS custom properties
export const applyTheme = (theme) => {
  const root = document.documentElement;
  const colors = themeConfig[theme];
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Add theme class for CSS targeting
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${theme}`);
  
  // Validate color accessibility if in development
  if (process.env.NODE_ENV === 'development') {
    validateThemeAccessibility(colors);
  }
};

// Validate theme colors for accessibility compliance
export const validateThemeAccessibility = (colors) => {
  // Import accessibility utilities dynamically to avoid circular dependencies
  import('@/lib/accessibility').then(({ colorUtils }) => {
    const validation = colorUtils.validateThemeColors(colors);
    
    if (!validation.valid) {
      console.group('🚨 Theme Accessibility Issues Detected');
      validation.issues.forEach(issue => {
        console.warn(`❌ ${issue.combination}: ${issue.ratio} (required: ${issue.required})`);
      });
      console.groupEnd();
    } else {
      console.log('✅ Theme colors meet WCAG AA accessibility standards');
    }
  });
};

// Get system theme preference
export const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Get stored theme preference
export const getStoredTheme = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('theme');
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
    return null;
  }
};

// Store theme preference
export const storeTheme = (theme) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.warn('Failed to store theme in localStorage:', error);
  }
};