'use client';

import { useEffect, useRef } from 'react';
import { gsap, performanceUtils } from '@/lib/gsap';

/**
 * ScrollTrigger - Advanced scroll-based animation component
 * Provides more granular control over scroll-triggered animations
 */
const ScrollTrigger = ({
  children,
  start = "top 80%",
  end = "bottom 20%",
  scrub = false,
  pin = false,
  snap = false,
  toggleActions = "play none none reverse",
  onEnter = null,
  onLeave = null,
  onEnterBack = null,
  onLeaveBack = null,
  onUpdate = null,
  markers = false,
  refreshPriority = 0,
  className = '',
  ...props
}) => {
  const triggerRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  useEffect(() => {
    const element = triggerRef.current;
    if (!element || typeof window === 'undefined') return;

    // Check for reduced motion preference
    if (performanceUtils.checkReducedMotion()) {
      // Execute onEnter callback immediately for reduced motion users
      if (onEnter) onEnter();
      return;
    }

    // Wait for ScrollTrigger to be available
    const setupScrollTrigger = () => {
      if (!window.ScrollTrigger) {
        setTimeout(setupScrollTrigger, 100);
        return;
      }

      const config = {
        trigger: element,
        start,
        end,
        toggleActions,
        refreshPriority,
        markers: markers && process.env.NODE_ENV === 'development',
      };

      // Add scrub if specified
      if (scrub !== false) {
        config.scrub = scrub === true ? 1 : scrub;
      }

      // Add pin if specified
      if (pin) {
        config.pin = pin === true ? element : pin;
      }

      // Add snap if specified
      if (snap) {
        config.snap = snap;
      }

      // Add callbacks
      if (onEnter) config.onEnter = onEnter;
      if (onLeave) config.onLeave = onLeave;
      if (onEnterBack) config.onEnterBack = onEnterBack;
      if (onLeaveBack) config.onLeaveBack = onLeaveBack;
      if (onUpdate) config.onUpdate = onUpdate;

      scrollTriggerRef.current = window.ScrollTrigger.create(config);
    };

    setupScrollTrigger();

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, [
    start,
    end,
    scrub,
    pin,
    snap,
    toggleActions,
    onEnter,
    onLeave,
    onEnterBack,
    onLeaveBack,
    onUpdate,
    markers,
    refreshPriority
  ]);

  return (
    <div
      ref={triggerRef}
      className={`scroll-trigger ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ScrollProgress - Component for creating scroll progress indicators
 */
export const ScrollProgress = ({
  target = null,
  start = "top bottom",
  end = "bottom top",
  className = "scroll-progress",
  style = {},
  ...props
}) => {
  const progressRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  useEffect(() => {
    const element = progressRef.current;
    if (!element || typeof window === 'undefined') return;

    if (performanceUtils.checkReducedMotion()) {
      gsap.set(element, { scaleX: 1 });
      return;
    }

    const setupScrollProgress = () => {
      if (!window.ScrollTrigger) {
        setTimeout(setupScrollProgress, 100);
        return;
      }

      gsap.set(element, { scaleX: 0, transformOrigin: "left center" });

      scrollTriggerRef.current = window.ScrollTrigger.create({
        trigger: target || element,
        start,
        end,
        scrub: 1,
        onUpdate: (self) => {
          gsap.to(element, {
            scaleX: self.progress,
            duration: 0.1,
            ease: "none"
          });
        }
      });
    };

    setupScrollProgress();

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, [target, start, end]);

  return (
    <div
      ref={progressRef}
      className={className}
      style={{
        width: '100%',
        height: '4px',
        backgroundColor: 'currentColor',
        ...style
      }}
      {...props}
    />
  );
};

/**
 * ParallaxElement - Component for creating parallax effects
 */
export const ParallaxElement = ({
  children,
  speed = 0.5,
  direction = 'vertical',
  className = '',
  ...props
}) => {
  const parallaxRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  useEffect(() => {
    const element = parallaxRef.current;
    if (!element || typeof window === 'undefined') return;

    if (performanceUtils.checkReducedMotion()) {
      return;
    }

    const setupParallax = () => {
      if (!window.ScrollTrigger) {
        setTimeout(setupParallax, 100);
        return;
      }

      const movement = direction === 'horizontal' ? 'xPercent' : 'yPercent';
      const value = -50 * speed;

      scrollTriggerRef.current = gsap.to(element, {
        [movement]: value,
        ease: "none",
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    };

    setupParallax();

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, [speed, direction]);

  return (
    <div
      ref={parallaxRef}
      className={`parallax-element ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ScrollTrigger;