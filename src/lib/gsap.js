import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Performance optimization settings
gsap.config({
  force3D: true,
  nullTargetWarn: false,
});

// Animation configuration with comprehensive timing and easing options
export const animationConfig = {
  // Hero section animations
  hero: {
    duration: 1.2,
    stagger: 0.2,
    ease: "power2.out",
    delay: 0.1
  },
  
  // Scroll-triggered animations
  scroll: {
    trigger: "top 80%",
    duration: 0.8,
    ease: "power1.out",
    stagger: 0.15
  },
  
  // Hover and interaction animations
  hover: {
    duration: 0.3,
    scale: 1.05,
    ease: "power2.out"
  },
  
  // Card animations
  card: {
    duration: 0.6,
    ease: "back.out(1.7)",
    stagger: 0.1,
    y: 60,
    scale: 0.9
  },
  
  // Button animations
  button: {
    duration: 0.2,
    ease: "power2.inOut",
    scale: 0.95,
    glowDuration: 0.4
  },
  
  // Timeline animations
  timeline: {
    duration: 1.5,
    ease: "power2.inOut",
    stagger: 0.3,
    drawDuration: 2
  },
  
  // Performance settings
  performance: {
    reducedMotion: false,
    prefersReducedMotion: false,
    maxAnimations: 10,
    throttleScrollEvents: true
  }
};

// Performance optimization utilities
export const performanceUtils = {
  // Check for reduced motion preference
  checkReducedMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Enhanced device detection with screen size categories
  getDeviceType: () => {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (width < 480) return 'mobile-small';
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1440) return 'desktop';
    return 'desktop-large';
  },
  
  // Check if device is mobile/touch device
  isMobileDevice: () => {
    if (typeof window === 'undefined') return false;
    const deviceType = performanceUtils.getDeviceType();
    return deviceType.includes('mobile') || deviceType === 'tablet';
  },
  
  // Check if device is touch-enabled
  isTouchDevice: () => {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  },
  
  // Get screen size category for animation scaling
  getScreenSize: () => {
    if (typeof window === 'undefined') return 'large';
    
    const width = window.innerWidth;
    if (width < 480) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1440) return 'lg';
    return 'xl';
  },
  
  // Check if device has limited performance capabilities
  isLowPerformanceDevice: () => {
    if (typeof window === 'undefined') return false;
    
    // Check for various indicators of low performance
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    const isLowConcurrency = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    
    // Additional checks for mobile devices
    const deviceType = performanceUtils.getDeviceType();
    const isMobileSmall = deviceType === 'mobile-small';
    
    return isSlowConnection || isLowMemory || isLowConcurrency || isMobileSmall;
  },
  
  // Get animation complexity level based on device capabilities
  getAnimationComplexity: () => {
    if (performanceUtils.checkReducedMotion()) return 'none';
    if (performanceUtils.isLowPerformanceDevice()) return 'minimal';
    
    const screenSize = performanceUtils.getScreenSize();
    const isTouchDevice = performanceUtils.isTouchDevice();
    
    if (screenSize === 'xs') return 'minimal';
    if (screenSize === 'sm' && isTouchDevice) return 'reduced';
    if (screenSize === 'md') return 'standard';
    return 'full';
  },
  
  // Set reduced motion globally
  setReducedMotion: (enabled) => {
    animationConfig.performance.reducedMotion = enabled;
    if (enabled) {
      gsap.globalTimeline.timeScale(0.01); // Nearly instant animations
    } else {
      gsap.globalTimeline.timeScale(1);
    }
  },
  
  // Get animation configuration based on device capabilities
  getOptimizedAnimationConfig: () => {
    const complexity = performanceUtils.getAnimationComplexity();
    const screenSize = performanceUtils.getScreenSize();
    const isTouchDevice = performanceUtils.isTouchDevice();
    
    const baseConfig = { ...animationConfig };
    
    // Scale factors based on complexity level
    const complexityScales = {
      none: { duration: 0.01, stagger: 0, ease: 'none' },
      minimal: { duration: 0.3, stagger: 0.05, ease: 'power1.out' },
      reduced: { duration: 0.5, stagger: 0.1, ease: 'power1.out' },
      standard: { duration: 0.8, stagger: 0.15, ease: 'power2.out' },
      full: { duration: 1, stagger: 0.2, ease: 'power2.out' }
    };
    
    // Screen size adjustments
    const screenScales = {
      xs: { duration: 0.6, stagger: 0.8, complexity: 0.5 },
      sm: { duration: 0.7, stagger: 0.9, complexity: 0.7 },
      md: { duration: 0.85, stagger: 0.95, complexity: 0.85 },
      lg: { duration: 1, stagger: 1, complexity: 1 },
      xl: { duration: 1.1, stagger: 1.1, complexity: 1.2 }
    };
    
    const complexityScale = complexityScales[complexity];
    const screenScale = screenScales[screenSize];
    
    // Apply optimizations to each animation type
    Object.keys(baseConfig).forEach(key => {
      if (typeof baseConfig[key] === 'object' && baseConfig[key].duration) {
        baseConfig[key] = {
          ...baseConfig[key],
          duration: baseConfig[key].duration * complexityScale.duration * screenScale.duration,
          stagger: (baseConfig[key].stagger || 0) * complexityScale.stagger * screenScale.stagger,
          ease: complexity === 'none' ? 'none' : complexityScale.ease
        };
      }
    });
    
    // Touch device specific adjustments
    if (isTouchDevice) {
      // Reduce hover-like animations on touch devices
      baseConfig.hover.duration *= 0.5;
      baseConfig.button.duration *= 0.7;
      
      // Increase touch target considerations
      baseConfig.performance.touchOptimized = true;
    }
    
    return baseConfig;
  },
  
  // Optimize animations for current device
  optimizeForDevice: () => {
    const optimizedConfig = performanceUtils.getOptimizedAnimationConfig();
    
    // Update global animation config
    Object.assign(animationConfig, optimizedConfig);
    
    // Set GSAP defaults based on device
    const complexity = performanceUtils.getAnimationComplexity();
    const screenSize = performanceUtils.getScreenSize();
    
    gsap.defaults({
      duration: complexity === 'none' ? 0.01 : 
                complexity === 'minimal' ? 0.3 :
                screenSize === 'xs' ? 0.4 : 0.6,
      ease: complexity === 'none' ? 'none' :
            complexity === 'minimal' ? 'power1.out' : 'power2.out'
    });
    
    return optimizedConfig;
  },
  
  // Cleanup function for component unmount
  cleanup: (timeline) => {
    if (timeline) {
      timeline.kill();
    }
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  },
  
  // Throttle scroll events for better performance
  throttleScrollEvents: () => {
    ScrollTrigger.config({
      limitCallbacks: true,
      syncInterval: performanceUtils.isMobileDevice() ? 200 : 150
    });
  }
};

// Common animation utilities with performance optimizations
export const animations = {
  // Basic fade in from bottom with responsive scaling
  fadeInUp: (element, options = {}) => {
    const complexity = performanceUtils.getAnimationComplexity();
    
    if (complexity === 'none') {
      gsap.set(element, { opacity: 1, y: 0 });
      return gsap.timeline();
    }
    
    const screenSize = performanceUtils.getScreenSize();
    const yDistance = screenSize === 'xs' ? 20 : screenSize === 'sm' ? 30 : 50;
    
    return gsap.fromTo(element, 
      { 
        opacity: 0, 
        y: yDistance,
        force3D: true
      },
      { 
        opacity: 1, 
        y: 0, 
        duration: animationConfig.scroll.duration,
        ease: animationConfig.scroll.ease,
        force3D: true,
        ...options 
      }
    );
  },

  // Staggered fade in for multiple elements
  staggerFadeIn: (elements, options = {}) => {
    if (animationConfig.performance.reducedMotion) {
      gsap.set(elements, { opacity: 1, y: 0 });
      return gsap.timeline();
    }
    
    return gsap.fromTo(elements,
      { 
        opacity: 0, 
        y: 30,
        force3D: true
      },
      { 
        opacity: 1, 
        y: 0, 
        duration: animationConfig.hero.duration,
        stagger: animationConfig.hero.stagger,
        ease: animationConfig.hero.ease,
        force3D: true,
        ...options 
      }
    );
  },

  // Scale animation for hover effects with touch device optimization
  scaleOnHover: (element, options = {}) => {
    const complexity = performanceUtils.getAnimationComplexity();
    const isTouchDevice = performanceUtils.isTouchDevice();
    
    if (complexity === 'none') {
      return gsap.timeline();
    }
    
    // Reduce scale effect on touch devices and small screens
    const screenSize = performanceUtils.getScreenSize();
    let scaleAmount = animationConfig.hover.scale;
    
    if (isTouchDevice) {
      scaleAmount = 1.02; // Subtle scale for touch
    } else if (screenSize === 'xs' || screenSize === 'sm') {
      scaleAmount = 1.03; // Reduced scale for small screens
    }
    
    const tl = gsap.timeline({ paused: true });
    tl.to(element, {
      scale: scaleAmount,
      duration: animationConfig.hover.duration,
      ease: animationConfig.hover.ease,
      force3D: true,
      ...options
    });
    return tl;
  },

  // Card entrance animation with bounce effect and responsive scaling
  cardEntrance: (elements, options = {}) => {
    const complexity = performanceUtils.getAnimationComplexity();
    
    if (complexity === 'none') {
      gsap.set(elements, { opacity: 1, y: 0, scale: 1 });
      return gsap.timeline();
    }
    
    const screenSize = performanceUtils.getScreenSize();
    
    // Adjust animation distance and scale based on screen size
    const yDistance = screenSize === 'xs' ? 30 : screenSize === 'sm' ? 40 : animationConfig.card.y;
    const initialScale = screenSize === 'xs' ? 0.95 : animationConfig.card.scale;
    
    // Simplify easing for smaller screens and touch devices
    const ease = complexity === 'minimal' || screenSize === 'xs' ? 
                 'power1.out' : animationConfig.card.ease;
    
    return gsap.fromTo(elements,
      {
        opacity: 0,
        y: yDistance,
        scale: initialScale,
        force3D: true
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: animationConfig.card.duration,
        ease: ease,
        stagger: animationConfig.card.stagger,
        force3D: true,
        ...options
      }
    );
  },

  // Button press animation
  buttonPress: (element, options = {}) => {
    if (animationConfig.performance.reducedMotion) {
      return gsap.timeline();
    }
    
    const tl = gsap.timeline();
    tl.to(element, {
      scale: animationConfig.button.scale,
      duration: animationConfig.button.duration,
      ease: animationConfig.button.ease,
      force3D: true,
      ...options
    })
    .to(element, {
      scale: 1,
      duration: animationConfig.button.duration,
      ease: animationConfig.button.ease,
      force3D: true
    });
    return tl;
  },

  // Glow effect for buttons
  glowEffect: (element, options = {}) => {
    if (animationConfig.performance.reducedMotion) {
      return gsap.timeline();
    }
    
    return gsap.to(element, {
      boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
      duration: animationConfig.button.glowDuration,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      ...options
    });
  },

  // Timeline drawing animation
  drawTimeline: (element, options = {}) => {
    if (animationConfig.performance.reducedMotion) {
      gsap.set(element, { strokeDashoffset: 0 });
      return gsap.timeline();
    }
    
    const length = element.getTotalLength?.() || 100;
    gsap.set(element, {
      strokeDasharray: length,
      strokeDashoffset: length
    });
    
    return gsap.to(element, {
      strokeDashoffset: 0,
      duration: animationConfig.timeline.drawDuration,
      ease: animationConfig.timeline.ease,
      ...options
    });
  },

  // Text reveal animation
  textReveal: (element, options = {}) => {
    if (animationConfig.performance.reducedMotion) {
      gsap.set(element, { opacity: 1, y: 0 });
      return gsap.timeline();
    }
    
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => 
      `<span style="display: inline-block;">${char === ' ' ? '&nbsp;' : char}</span>`
    ).join('');
    
    const spans = element.querySelectorAll('span');
    
    return gsap.fromTo(spans,
      {
        opacity: 0,
        y: 20,
        rotationX: -90,
        force3D: true
      },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
        stagger: 0.02,
        force3D: true,
        ...options
      }
    );
  },

  // Parallax effect for background elements with performance optimization
  parallax: (element, speed = 0.5, options = {}) => {
    const complexity = performanceUtils.getAnimationComplexity();
    
    if (complexity === 'none' || complexity === 'minimal') {
      return gsap.timeline();
    }
    
    // Reduce parallax intensity on mobile devices for better performance
    const isMobile = performanceUtils.isMobileDevice();
    const adjustedSpeed = isMobile ? speed * 0.3 : speed;
    
    return gsap.to(element, {
      yPercent: -50 * adjustedSpeed,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: isMobile ? 2 : true, // Add scrub delay on mobile for smoother performance
        ...options
      }
    });
  },
  
  // Touch-optimized interaction animation
  touchInteraction: (element, options = {}) => {
    const isTouchDevice = performanceUtils.isTouchDevice();
    const complexity = performanceUtils.getAnimationComplexity();
    
    if (complexity === 'none' || !isTouchDevice) {
      return gsap.timeline();
    }
    
    const tl = gsap.timeline({ paused: true });
    
    // Subtle feedback for touch interactions
    tl.to(element, {
      scale: 0.98,
      duration: 0.1,
      ease: 'power2.out',
      ...options
    })
    .to(element, {
      scale: 1,
      duration: 0.15,
      ease: 'power2.out'
    });
    
    return tl;
  },
  
  // Responsive stagger animation that adapts to screen size
  responsiveStagger: (elements, baseAnimation, options = {}) => {
    const screenSize = performanceUtils.getScreenSize();
    const complexity = performanceUtils.getAnimationComplexity();
    
    if (complexity === 'none') {
      gsap.set(elements, { opacity: 1, y: 0, scale: 1 });
      return gsap.timeline();
    }
    
    // Adjust stagger timing based on screen size and number of elements
    const elementCount = elements.length || 1;
    let staggerDelay = animationConfig.scroll.stagger;
    
    if (screenSize === 'xs') {
      staggerDelay = Math.min(0.05, staggerDelay * 0.5);
    } else if (screenSize === 'sm') {
      staggerDelay = Math.min(0.1, staggerDelay * 0.7);
    }
    
    // Reduce stagger for many elements to avoid long animation sequences
    if (elementCount > 6) {
      staggerDelay *= 0.6;
    }
    
    return baseAnimation(elements, {
      stagger: staggerDelay,
      ...options
    });
  }
};

// Initialize GSAP with performance optimizations
export const initGSAP = () => {
  if (typeof window === 'undefined') return;
  
  // Check for reduced motion preference
  const prefersReducedMotion = performanceUtils.checkReducedMotion();
  animationConfig.performance.prefersReducedMotion = prefersReducedMotion;
  
  if (prefersReducedMotion) {
    performanceUtils.setReducedMotion(true);
  }
  
  // Optimize for current device
  performanceUtils.optimizeForDevice();
  
  // Enable performance optimizations
  performanceUtils.throttleScrollEvents();
  
  // Set up global GSAP defaults with mobile considerations
  const isMobile = performanceUtils.isMobileDevice();
  gsap.defaults({
    duration: isMobile ? 0.4 : 0.6,
    ease: isMobile ? "power1.out" : "power2.out"
  });
  
  // Listen for reduced motion changes
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', (e) => {
    performanceUtils.setReducedMotion(e.matches);
  });
  
  // Listen for viewport size changes to re-optimize
  const resizeHandler = () => {
    performanceUtils.optimizeForDevice();
  };
  
  window.addEventListener('resize', resizeHandler);
  
  // Listen for orientation changes on mobile devices
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeHandler, 100); // Delay to ensure dimensions are updated
  });
};

// Timeline factory for complex animations
export const createTimeline = (options = {}) => {
  return gsap.timeline({
    paused: true,
    ...options
  });
};

// Batch animation utility for performance
export const batchAnimate = (elements, animation, options = {}) => {
  if (!elements || elements.length === 0) return gsap.timeline();
  
  const tl = gsap.timeline();
  const batchSize = options.batchSize || 5;
  
  for (let i = 0; i < elements.length; i += batchSize) {
    const batch = Array.from(elements).slice(i, i + batchSize);
    tl.add(animation(batch, { ...options, delay: i * 0.1 }), i * 0.1);
  }
  
  return tl;
};

// Export GSAP instance
export { gsap };