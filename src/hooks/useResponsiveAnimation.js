'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap, performanceUtils, animations } from '@/lib/gsap';

/**
 * useResponsiveAnimation - Hook for managing animations that adapt to screen size and device capabilities
 */
export const useResponsiveAnimation = (options = {}) => {
  const elementRef = useRef(null);
  const timelineRef = useRef(null);
  const [deviceInfo, setDeviceInfo] = useState({
    screenSize: 'lg',
    complexity: 'full',
    isTouchDevice: false,
    isMobile: false
  });

  const {
    animation = 'fadeInUp',
    trigger = 'hover',
    autoPlay = false,
    respectReducedMotion = true,
    customAnimation = null
  } = options;

  // Update device info on mount and resize
  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo({
        screenSize: performanceUtils.getScreenSize(),
        complexity: performanceUtils.getAnimationComplexity(),
        isTouchDevice: performanceUtils.isTouchDevice(),
        isMobile: performanceUtils.isMobileDevice()
      });
    };

    updateDeviceInfo();

    const handleResize = () => {
      updateDeviceInfo();
    };

    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Initialize animation based on device capabilities
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (respectReducedMotion && deviceInfo.complexity === 'none') {
      return;
    }

    const ctx = gsap.context(() => {
      if (customAnimation && typeof customAnimation === 'function') {
        timelineRef.current = customAnimation(element, deviceInfo);
      } else {
        const animationFunction = animations[animation] || animations.fadeInUp;
        timelineRef.current = animationFunction(element, {
          paused: trigger !== 'immediate' && !autoPlay
        });
      }

      if (autoPlay && timelineRef.current) {
        timelineRef.current.play();
      }
    }, elementRef);

    return () => ctx.revert();
  }, [animation, trigger, autoPlay, respectReducedMotion, customAnimation, deviceInfo]);

  // Play animation
  const play = useCallback(() => {
    if (timelineRef.current && deviceInfo.complexity !== 'none') {
      timelineRef.current.play();
    }
  }, [deviceInfo.complexity]);

  // Pause animation
  const pause = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.pause();
    }
  }, []);

  // Reverse animation
  const reverse = useCallback(() => {
    if (timelineRef.current && deviceInfo.complexity !== 'none') {
      timelineRef.current.reverse();
    }
  }, [deviceInfo.complexity]);

  // Restart animation
  const restart = useCallback(() => {
    if (timelineRef.current && deviceInfo.complexity !== 'none') {
      timelineRef.current.restart();
    }
  }, [deviceInfo.complexity]);

  // Get optimized hover handlers for touch vs non-touch devices
  const getHoverHandlers = useCallback(() => {
    if (deviceInfo.isTouchDevice || deviceInfo.complexity === 'none') {
      return {
        onMouseEnter: undefined,
        onMouseLeave: undefined,
        onTouchStart: trigger === 'hover' ? play : undefined,
        onTouchEnd: trigger === 'hover' ? reverse : undefined
      };
    }

    return {
      onMouseEnter: trigger === 'hover' ? play : undefined,
      onMouseLeave: trigger === 'hover' ? reverse : undefined,
      onTouchStart: undefined,
      onTouchEnd: undefined
    };
  }, [deviceInfo.isTouchDevice, deviceInfo.complexity, trigger, play, reverse]);

  // Get optimized click handlers
  const getClickHandlers = useCallback(() => {
    if (deviceInfo.complexity === 'none') {
      return {};
    }

    const clickHandler = trigger === 'click' ? play : undefined;

    if (deviceInfo.isTouchDevice) {
      return {
        onTouchStart: clickHandler,
        onClick: undefined
      };
    }

    return {
      onClick: clickHandler,
      onTouchStart: undefined
    };
  }, [deviceInfo.isTouchDevice, deviceInfo.complexity, trigger, play]);

  // Get responsive animation properties
  const getAnimationProps = useCallback(() => {
    const hoverHandlers = getHoverHandlers();
    const clickHandlers = getClickHandlers();

    return {
      ref: elementRef,
      ...hoverHandlers,
      ...clickHandlers,
      'data-animation-complexity': deviceInfo.complexity,
      'data-screen-size': deviceInfo.screenSize,
      'data-touch-device': deviceInfo.isTouchDevice
    };
  }, [getHoverHandlers, getClickHandlers, deviceInfo]);

  return {
    elementRef,
    timeline: timelineRef.current,
    deviceInfo,
    play,
    pause,
    reverse,
    restart,
    getAnimationProps
  };
};

/**
 * useResponsiveHover - Specialized hook for hover animations that adapt to touch devices
 */
export const useResponsiveHover = (options = {}) => {
  const {
    scaleAmount,
    duration = 0.3,
    ease = 'power2.out',
    ...restOptions
  } = options;

  return useResponsiveAnimation({
    ...restOptions,
    trigger: 'hover',
    customAnimation: (element, deviceInfo) => {
      if (deviceInfo.complexity === 'none') {
        return gsap.timeline();
      }

      // Determine scale amount based on device
      let scale = scaleAmount;
      if (!scale) {
        if (deviceInfo.isTouchDevice) {
          scale = 1.02;
        } else if (deviceInfo.screenSize === 'xs' || deviceInfo.screenSize === 'sm') {
          scale = 1.03;
        } else {
          scale = 1.05;
        }
      }

      const tl = gsap.timeline({ paused: true });
      
      tl.to(element, {
        scale: scale,
        duration: duration,
        ease: ease,
        force3D: true
      });

      return tl;
    }
  });
};

/**
 * useResponsiveStagger - Hook for staggered animations that adapt to screen size
 */
export const useResponsiveStagger = (options = {}) => {
  const {
    staggerDelay = 0.1,
    maxElements = 10,
    ...restOptions
  } = options;

  return useResponsiveAnimation({
    ...restOptions,
    customAnimation: (element, deviceInfo) => {
      if (deviceInfo.complexity === 'none') {
        gsap.set(element.children, { opacity: 1, y: 0, scale: 1 });
        return gsap.timeline();
      }

      const children = Array.from(element.children).slice(0, maxElements);
      
      // Calculate responsive stagger delay
      let responsiveDelay = staggerDelay;
      
      if (deviceInfo.screenSize === 'xs') {
        responsiveDelay = Math.min(0.05, staggerDelay * 0.5);
      } else if (deviceInfo.screenSize === 'sm') {
        responsiveDelay = Math.min(0.1, staggerDelay * 0.7);
      }
      
      // Reduce stagger for many elements
      if (children.length > 6) {
        responsiveDelay *= 0.6;
      }

      return animations.responsiveStagger(children, animations.fadeInUp, {
        stagger: responsiveDelay
      });
    }
  });
};

export default useResponsiveAnimation;