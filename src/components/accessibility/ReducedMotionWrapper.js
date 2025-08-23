'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useAccessibility';
import { motionUtils } from '@/lib/accessibility';

/**
 * Wrapper component that provides static alternatives for animations
 * when user prefers reduced motion
 */
export default function ReducedMotionWrapper({ 
  children, 
  staticContent = null,
  animationType = 'fadeInUp',
  className = '',
  ...props 
}) {
  const prefersReducedMotion = useReducedMotion();
  const elementRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion && elementRef.current) {
      // Apply static styles immediately
      motionUtils.applyStaticStyles(elementRef.current, animationType);
    }
  }, [prefersReducedMotion, animationType]);

  // If user prefers reduced motion and static content is provided, show that instead
  if (prefersReducedMotion && staticContent) {
    return (
      <div ref={elementRef} className={className} {...props}>
        {staticContent}
      </div>
    );
  }

  // Otherwise, show the animated content
  return (
    <div ref={elementRef} className={className} {...props}>
      {children}
    </div>
  );
}

/**
 * Higher-order component for wrapping components with reduced motion support
 */
export function withReducedMotion(WrappedComponent, options = {}) {
  const {
    animationType = 'fadeInUp',
    staticProps = {},
    displayName = 'WithReducedMotion'
  } = options;

  const ComponentWithReducedMotion = (props) => {
    const prefersReducedMotion = useReducedMotion();
    const elementRef = useRef(null);

    useEffect(() => {
      if (prefersReducedMotion && elementRef.current) {
        motionUtils.applyStaticStyles(elementRef.current, animationType);
      }
    }, [prefersReducedMotion]);

    const enhancedProps = {
      ...props,
      ref: elementRef,
      'data-reduced-motion': prefersReducedMotion,
      ...(prefersReducedMotion ? staticProps : {})
    };

    return <WrappedComponent {...enhancedProps} />;
  };

  ComponentWithReducedMotion.displayName = displayName;
  return ComponentWithReducedMotion;
}

/**
 * Component for providing text alternatives to visual animations
 */
export function AnimationDescription({ 
  children, 
  description, 
  showWhenReduced = true 
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {children}
      {prefersReducedMotion && showWhenReduced && (
        <div className="sr-only" aria-live="polite">
          {description}
        </div>
      )}
    </>
  );
}

/**
 * Hook for conditionally applying animations based on motion preference
 */
export function useConditionalAnimation(animationFunction, dependencies = []) {
  const prefersReducedMotion = useReducedMotion();
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    if (prefersReducedMotion) {
      // Apply static end state
      const element = elementRef.current;
      element.style.opacity = '1';
      element.style.transform = 'none';
      return;
    }

    // Apply animation
    const cleanup = animationFunction(elementRef.current);
    return cleanup;
  }, [prefersReducedMotion, animationFunction, ...dependencies]);

  return elementRef;
}