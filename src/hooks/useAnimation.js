'use client';

import { useEffect, useRef, useCallback } from 'react';
import { gsap, animations, performanceUtils, createTimeline } from '@/lib/gsap';

/**
 * useAnimation - Custom hook for managing GSAP animations in React components
 */
export const useAnimation = (options = {}) => {
  const timelineRef = useRef(null);
  const elementsRef = useRef(new Map());

  const {
    autoPlay = false,
    paused = true,
    onComplete = null,
    onStart = null,
    onUpdate = null,
    respectReducedMotion = true
  } = options;

  useEffect(() => {
    // Initialize timeline
    timelineRef.current = createTimeline({
      paused,
      onComplete,
      onStart,
      onUpdate
    });

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [paused, onComplete, onStart, onUpdate]);

  // Register element for animation
  const registerElement = useCallback((key, element) => {
    if (element) {
      elementsRef.current.set(key, element);
    }
  }, []);

  // Get registered element
  const getElement = useCallback((key) => {
    return elementsRef.current.get(key);
  }, []);

  // Add animation to timeline
  const addAnimation = useCallback((animationType, elementKey, options = {}) => {
    if (!timelineRef.current) return;

    const element = elementsRef.current.get(elementKey);
    if (!element) {
      console.warn(`Element with key "${elementKey}" not found`);
      return;
    }

    if (respectReducedMotion && performanceUtils.checkReducedMotion()) {
      // Skip animation for reduced motion users
      return;
    }

    const animationFunction = animations[animationType];
    if (!animationFunction) {
      console.warn(`Animation "${animationType}" not found`);
      return;
    }

    const animation = animationFunction(element, options);
    timelineRef.current.add(animation, options.position || ">");

    return animation;
  }, [respectReducedMotion]);

  // Play timeline
  const play = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.play();
    }
  }, []);

  // Pause timeline
  const pause = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.pause();
    }
  }, []);

  // Restart timeline
  const restart = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.restart();
    }
  }, []);

  // Reverse timeline
  const reverse = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.reverse();
    }
  }, []);

  // Seek to specific time
  const seek = useCallback((time) => {
    if (timelineRef.current) {
      timelineRef.current.seek(time);
    }
  }, []);

  // Get timeline progress
  const getProgress = useCallback(() => {
    return timelineRef.current ? timelineRef.current.progress() : 0;
  }, []);

  // Set timeline progress
  const setProgress = useCallback((progress) => {
    if (timelineRef.current) {
      timelineRef.current.progress(progress);
    }
  }, []);

  return {
    timeline: timelineRef.current,
    registerElement,
    getElement,
    addAnimation,
    play,
    pause,
    restart,
    reverse,
    seek,
    getProgress,
    setProgress
  };
};

/**
 * useScrollAnimation - Hook for scroll-triggered animations
 */
export const useScrollAnimation = (elementRef, options = {}) => {
  const scrollTriggerRef = useRef(null);

  const {
    animation = 'fadeInUp',
    trigger = 'top 80%',
    start = 'top 80%',
    end = 'bottom 20%',
    scrub = false,
    once = true,
    stagger = false,
    staggerDelay = 0.1,
    onEnter = null,
    onLeave = null,
    respectReducedMotion = true
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof window === 'undefined') return;

    if (respectReducedMotion && performanceUtils.checkReducedMotion()) {
      // Execute onEnter immediately for reduced motion users
      if (onEnter) onEnter();
      return;
    }

    const setupScrollAnimation = () => {
      if (!window.ScrollTrigger) {
        setTimeout(setupScrollAnimation, 100);
        return;
      }

      const animationFunction = animations[animation];
      if (!animationFunction) {
        console.warn(`Animation "${animation}" not found`);
        return;
      }

      const animationElements = stagger ? element.children : element;
      const animationOptions = {
        stagger: stagger ? staggerDelay : 0,
        scrollTrigger: {
          trigger: element,
          start: start || trigger,
          end,
          scrub,
          toggleActions: once ? "play none none none" : "play none none reverse",
          onEnter,
          onLeave: once ? undefined : onLeave
        }
      };

      scrollTriggerRef.current = animationFunction(animationElements, animationOptions);
    };

    setupScrollAnimation();

    return () => {
      if (scrollTriggerRef.current && scrollTriggerRef.current.scrollTrigger) {
        scrollTriggerRef.current.scrollTrigger.kill();
      }
    };
  }, [
    animation,
    trigger,
    start,
    end,
    scrub,
    once,
    stagger,
    staggerDelay,
    onEnter,
    onLeave,
    respectReducedMotion
  ]);

  return scrollTriggerRef.current;
};

/**
 * useHoverAnimation - Hook for hover animations
 */
export const useHoverAnimation = (elementRef, options = {}) => {
  const hoverTimelineRef = useRef(null);

  const {
    animation = 'scaleOnHover',
    duration = 0.3,
    ease = 'power2.out',
    respectReducedMotion = true
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (respectReducedMotion && performanceUtils.checkReducedMotion()) {
      return;
    }

    const animationFunction = animations[animation];
    if (!animationFunction) {
      console.warn(`Animation "${animation}" not found`);
      return;
    }

    hoverTimelineRef.current = animationFunction(element, {
      duration,
      ease
    });

    const handleMouseEnter = () => {
      if (hoverTimelineRef.current) {
        hoverTimelineRef.current.play();
      }
    };

    const handleMouseLeave = () => {
      if (hoverTimelineRef.current) {
        hoverTimelineRef.current.reverse();
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverTimelineRef.current) {
        hoverTimelineRef.current.kill();
      }
    };
  }, [animation, duration, ease, respectReducedMotion]);

  return hoverTimelineRef.current;
};

export default useAnimation;