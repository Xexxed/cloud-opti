'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { gsap } from '@/lib/gsap';

// Sun icon component
const SunIcon = ({ className }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 20 20" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      fillRule="evenodd" 
      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
      clipRule="evenodd" 
    />
  </svg>
);

// Moon icon component
const MoonIcon = ({ className }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 20 20" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" 
    />
  </svg>
);

export default function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme();
  const toggleRef = useRef(null);
  const sliderRef = useRef(null);
  const sunIconRef = useRef(null);
  const moonIconRef = useRef(null);

  useEffect(() => {
    if (!isLoaded || !toggleRef.current) return;

    const ctx = gsap.context(() => {
      // Set initial positions based on current theme
      const isDark = theme === 'dark';
      
      gsap.set(sliderRef.current, {
        x: isDark ? 24 : 0,
        backgroundColor: isDark ? '#ffffff' : '#374151'
      });

      gsap.set(sunIconRef.current, {
        opacity: isDark ? 0 : 1,
        rotation: isDark ? 180 : 0,
        scale: isDark ? 0.5 : 1
      });

      gsap.set(moonIconRef.current, {
        opacity: isDark ? 1 : 0,
        rotation: isDark ? 0 : -180,
        scale: isDark ? 1 : 0.5
      });
    }, toggleRef);

    return () => ctx.revert();
  }, [theme, isLoaded]);

  const handleToggle = () => {
    if (!isLoaded) return;

    const isDark = theme === 'light'; // Will be dark after toggle
    
    // Create GSAP timeline for smooth transitions
    const tl = gsap.timeline();

    // Animate slider position and color
    tl.to(sliderRef.current, {
      x: isDark ? 24 : 0,
      backgroundColor: isDark ? '#ffffff' : '#374151',
      duration: 0.3,
      ease: 'power2.out'
    });

    // Animate sun icon
    tl.to(sunIconRef.current, {
      opacity: isDark ? 0 : 1,
      rotation: isDark ? 180 : 0,
      scale: isDark ? 0.5 : 1,
      duration: 0.3,
      ease: 'power2.out'
    }, 0);

    // Animate moon icon
    tl.to(moonIconRef.current, {
      opacity: isDark ? 1 : 0,
      rotation: isDark ? 0 : -180,
      scale: isDark ? 1 : 0.5,
      duration: 0.3,
      ease: 'power2.out'
    }, 0);

    // Add subtle bounce effect
    tl.to(toggleRef.current, {
      scale: 1.05,
      duration: 0.1,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1
    }, 0);

    toggleTheme();
  };

  if (!isLoaded) {
    return (
      <div className="w-14 h-7 bg-gray-300 rounded-full animate-pulse"></div>
    );
  }

  return (
    <button
      ref={toggleRef}
      onClick={handleToggle}
      className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 border-2"
      style={{ 
        backgroundColor: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-surface)',
        borderColor: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-textSecondary)',
        focusRingColor: 'var(--color-primary)'
      }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-checked={theme === 'dark'}
      role="switch"
      aria-describedby="theme-toggle-description"
    >
      {/* Slider circle */}
      <div
        ref={sliderRef}
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
      >
        {/* Sun icon */}
        <SunIcon 
          ref={sunIconRef}
          className="absolute w-4 h-4 text-yellow-500"
        />
        
        {/* Moon icon */}
        <MoonIcon 
          ref={moonIconRef}
          className="absolute w-4 h-4 text-blue-200"
        />
      </div>
      
      {/* Hidden description for screen readers */}
      <span id="theme-toggle-description" className="sr-only">
        Toggle between light and dark theme. Current theme: {theme} mode.
      </span>
    </button>
  );
}