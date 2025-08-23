'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, animations, performanceUtils, animationConfig } from '@/lib/gsap';

/**
 * AnimatedSection - A wrapper component that provides scroll-triggered animations
 * using GSAP ScrollTrigger with intersection observer fallback
 */
const AnimatedSection = ({
  children,
  animation = 'fadeInUp',
  trigger = 'top 80%',
  stagger = false,
  staggerDelay = 0.1,
  customAnimation = null,
  threshold = 0.1,
  rootMargin = '0px 0px -10% 0px',
  once = true,
  className = '',
  ...props
}) => {
  const sectionRef = useRef(null);
  const timelineRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    // Check animation complexity and device capabilities
    const complexity = performanceUtils.getAnimationComplexity();
    
    if (complexity === 'none') {
      // Skip animations for users who prefer reduced motion
      setIsVisible(true);
      return;
    }

    // Use ScrollTrigger if available, otherwise fall back to Intersection Observer
    if (typeof window !== 'undefined' && window.ScrollTrigger) {
      setupScrollTrigger(element);
    } else {
      setupIntersectionObserver(element);
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [animation, trigger, stagger, staggerDelay, customAnimation, once]);

  const setupScrollTrigger = (element) => {
    const animationElements = getAnimationElements(element);
    const complexity = performanceUtils.getAnimationComplexity();
    const screenSize = performanceUtils.getScreenSize();
    
    // Adjust trigger point based on screen size
    const adjustedTrigger = screenSize === 'xs' ? 'top 90%' : 
                           screenSize === 'sm' ? 'top 85%' : trigger;
    
    if (customAnimation && typeof customAnimation === 'function') {
      // Use custom animation function
      timelineRef.current = customAnimation(animationElements, {
        scrollTrigger: {
          trigger: element,
          start: adjustedTrigger,
          toggleActions: once ? "play none none none" : "play none none reverse",
          onEnter: () => setIsVisible(true),
          onLeave: once ? undefined : () => setIsVisible(false),
          onEnterBack: once ? undefined : () => setIsVisible(true),
          onLeaveBack: once ? undefined : () => setIsVisible(false),
        }
      });
    } else {
      // Use predefined animation with responsive stagger
      const animationFunction = animations[animation] || animations.fadeInUp;
      
      // Calculate responsive stagger delay
      let responsiveStaggerDelay = staggerDelay;
      if (stagger) {
        const elementCount = animationElements.length || 1;
        
        if (screenSize === 'xs') {
          responsiveStaggerDelay = Math.min(0.05, staggerDelay * 0.5);
        } else if (screenSize === 'sm') {
          responsiveStaggerDelay = Math.min(0.1, staggerDelay * 0.7);
        }
        
        // Reduce stagger for many elements
        if (elementCount > 6) {
          responsiveStaggerDelay *= 0.6;
        }
      }
      
      timelineRef.current = animationFunction(animationElements, {
        stagger: stagger ? responsiveStaggerDelay : 0,
        scrollTrigger: {
          trigger: element,
          start: adjustedTrigger,
          toggleActions: once ? "play none none none" : "play none none reverse",
          onEnter: () => {
            setIsVisible(true);
            if (once) setHasAnimated(true);
          },
          onLeave: once ? undefined : () => setIsVisible(false),
          onEnterBack: once ? undefined : () => setIsVisible(true),
          onLeaveBack: once ? undefined : () => setIsVisible(false),
        }
      });
    }
  };

  const setupIntersectionObserver = (element) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!once || !hasAnimated)) {
            setIsVisible(true);
            triggerAnimation(element);
            
            if (once) {
              setHasAnimated(true);
              observer.unobserve(element);
            }
          } else if (!once && !entry.isIntersecting) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  };

  const triggerAnimation = (element) => {
    const animationElements = getAnimationElements(element);
    const screenSize = performanceUtils.getScreenSize();
    
    if (customAnimation && typeof customAnimation === 'function') {
      timelineRef.current = customAnimation(animationElements);
    } else {
      const animationFunction = animations[animation] || animations.fadeInUp;
      
      // Calculate responsive stagger delay for intersection observer fallback
      let responsiveStaggerDelay = staggerDelay;
      if (stagger) {
        const elementCount = animationElements.length || 1;
        
        if (screenSize === 'xs') {
          responsiveStaggerDelay = Math.min(0.05, staggerDelay * 0.5);
        } else if (screenSize === 'sm') {
          responsiveStaggerDelay = Math.min(0.1, staggerDelay * 0.7);
        }
        
        // Reduce stagger for many elements
        if (elementCount > 6) {
          responsiveStaggerDelay *= 0.6;
        }
      }
      
      timelineRef.current = animationFunction(animationElements, {
        stagger: stagger ? responsiveStaggerDelay : 0
      });
    }
  };

  const getAnimationElements = (element) => {
    if (stagger) {
      // For staggered animations, target direct children or elements with data-animate
      const staggerElements = element.querySelectorAll('[data-animate]');
      return staggerElements.length > 0 ? staggerElements : element.children;
    }
    return element;
  };

  return (
    <div
      ref={sectionRef}
      className={`animated-section ${className}`}
      data-visible={isVisible}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;