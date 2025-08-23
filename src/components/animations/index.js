// Animation components for GSAP integration
export { default as AnimatedSection } from './AnimatedSection';
export { default as ScrollTrigger, ScrollProgress, ParallaxElement } from './ScrollTrigger';

// Re-export animation utilities from lib
export { 
  animations, 
  animationConfig, 
  performanceUtils, 
  initGSAP, 
  createTimeline, 
  batchAnimate 
} from '@/lib/gsap';