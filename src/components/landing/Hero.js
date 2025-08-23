'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap, animations, animationConfig, performanceUtils } from '@/lib/gsap';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';

export default function Hero() {
  const { theme, isLoaded } = useTheme();
  const router = useRouter();
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonsRef = useRef(null);
  const backgroundRef = useRef(null);
  const floatingElementsRef = useRef([]);

  // Add floating elements to refs array
  const addToFloatingRefs = (el) => {
    if (el && !floatingElementsRef.current.includes(el)) {
      floatingElementsRef.current.push(el);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    const ctx = gsap.context(() => {
      // Import performance utilities (these are already imported at the top level)
      
      const complexity = performanceUtils.getAnimationComplexity();
      const screenSize = performanceUtils.getScreenSize();
      const isMobile = performanceUtils.isMobileDevice();
      
      if (complexity === 'none') {
        // Set final states immediately for reduced motion
        gsap.set([titleRef.current, subtitleRef.current, buttonsRef.current], {
          opacity: 1,
          y: 0,
          scale: 1
        });
        gsap.set(floatingElementsRef.current, {
          opacity: 0.3,
          scale: 1,
          rotation: 0
        });
        return;
      }

      // Responsive animation values
      const getAnimationValues = () => {
        const baseY = screenSize === 'xs' ? 30 : screenSize === 'sm' ? 40 : 50;
        const baseScale = screenSize === 'xs' ? 0.95 : 0.9;
        
        return {
          yDistance: baseY,
          initialScale: baseScale,
          staggerDelay: screenSize === 'xs' ? 0.1 : screenSize === 'sm' ? 0.15 : 0.2
        };
      };

      const values = getAnimationValues();

      // Set initial states for main content
      gsap.set([titleRef.current, subtitleRef.current, buttonsRef.current], {
        opacity: 0,
        y: values.yDistance,
        scale: values.initialScale
      });

      // Set initial states for floating elements (reduced on mobile)
      gsap.set(floatingElementsRef.current, {
        opacity: 0,
        scale: 0,
        rotation: 0
      });

      // Create main timeline for hero entrance
      const mainTimeline = gsap.timeline({ delay: complexity === 'minimal' ? 0.1 : 0.2 });

      // Animate main content with staggered entrance
      mainTimeline
        .to(titleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: animationConfig.hero.duration,
          ease: animationConfig.hero.ease
        })
        .to(subtitleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: animationConfig.hero.duration * 0.8,
          ease: animationConfig.hero.ease
        }, "-=0.6")
        .to(buttonsRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: animationConfig.hero.duration * 0.7,
          ease: animationConfig.hero.ease
        }, "-=0.4");

      // Animate floating elements with reduced complexity on mobile
      if (floatingElementsRef.current.length > 0 && complexity !== 'minimal') {
        const floatingOpacity = isMobile ? 0.3 : 0.6;
        const rotationAmount = isMobile ? 180 : 360;
        
        mainTimeline.to(floatingElementsRef.current, {
          opacity: floatingOpacity,
          scale: 1,
          rotation: rotationAmount,
          duration: complexity === 'reduced' ? 1 : 1.5,
          ease: complexity === 'reduced' ? "power2.out" : "back.out(1.7)",
          stagger: values.staggerDelay
        }, "-=1");

        // Add continuous floating animation (reduced on mobile)
        if (complexity === 'full' || (complexity === 'standard' && !isMobile)) {
          floatingElementsRef.current.forEach((element, index) => {
            const floatDistance = isMobile ? 10 : 20;
            const rotationSpeed = isMobile ? 90 : 180;
            
            gsap.to(element, {
              y: `+=${floatDistance}`,
              rotation: `+=${rotationSpeed}`,
              duration: 3 + index * 0.5,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              delay: index * 0.3
            });

            // Add parallax effect (reduced on mobile)
            animations.parallax(element, isMobile ? 0.1 + index * 0.05 : 0.3 + index * 0.1);
          });
        }
      }

      // Add subtle background animation (disabled on low-performance devices)
      if (backgroundRef.current && complexity !== 'minimal' && complexity !== 'reduced') {
        gsap.to(backgroundRef.current, {
          backgroundPosition: "100% 100%",
          duration: isMobile ? 30 : 20,
          ease: "none",
          repeat: -1,
          yoyo: true
        });
      }

    }, heroRef);

    return () => ctx.revert();
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <section 
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ 
        background: `var(--color-background)`,
        color: `var(--color-text)`
      }}
      aria-labelledby="hero-title"
      role="banner"
    >
      {/* Animated Background */}
      <div 
        ref={backgroundRef}
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, var(--color-primary) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, var(--color-secondary) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, var(--color-accent) 0%, transparent 50%)
          `,
          backgroundSize: '100% 100%',
          filter: 'blur(60px)'
        }}
      />

      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cloud-like shapes - responsive sizes */}
        <div 
          ref={addToFloatingRefs}
          className="absolute top-16 sm:top-20 left-4 sm:left-20 w-20 sm:w-32 h-20 sm:h-32 rounded-full opacity-15 sm:opacity-20"
          style={{ 
            background: `linear-gradient(45deg, var(--color-primary), var(--color-secondary))`,
            filter: 'blur(15px) sm:blur(20px)'
          }}
        />
        <div 
          ref={addToFloatingRefs}
          className="absolute top-32 sm:top-40 right-4 sm:right-32 w-16 sm:w-24 h-16 sm:h-24 rounded-full opacity-10 sm:opacity-15"
          style={{ 
            background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`,
            filter: 'blur(12px) sm:blur(15px)'
          }}
        />
        <div 
          ref={addToFloatingRefs}
          className="absolute bottom-24 sm:bottom-32 left-1/4 w-24 sm:w-40 h-24 sm:h-40 rounded-full opacity-8 sm:opacity-10"
          style={{ 
            background: `linear-gradient(225deg, var(--color-accent), var(--color-primary))`,
            filter: 'blur(18px) sm:blur(25px)'
          }}
        />
        <div 
          ref={addToFloatingRefs}
          className="absolute bottom-16 sm:bottom-20 right-4 sm:right-20 w-20 sm:w-28 h-20 sm:h-28 rounded-full opacity-20 sm:opacity-25"
          style={{ 
            background: `linear-gradient(315deg, var(--color-primary), var(--color-accent))`,
            filter: 'blur(14px) sm:blur(18px)'
          }}
        />

        {/* Geometric shapes - hidden on very small screens */}
        <div 
          ref={addToFloatingRefs}
          className="hidden sm:block absolute top-1/3 left-10 w-12 sm:w-16 h-12 sm:h-16 opacity-15 sm:opacity-20 transform rotate-45"
          style={{ 
            background: `var(--color-secondary)`,
            filter: 'blur(6px) sm:blur(8px)',
            borderRadius: '20%'
          }}
        />
        <div 
          ref={addToFloatingRefs}
          className="hidden sm:block absolute top-2/3 right-16 w-10 sm:w-12 h-10 sm:h-12 opacity-12 sm:opacity-15"
          style={{ 
            background: `var(--color-accent)`,
            filter: 'blur(5px) sm:blur(6px)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }}
        />
      </div>

      {/* Header with theme toggle */}
      <header className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </header>

      {/* Main Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Main Headline */}
        <h1 
          id="hero-title"
          ref={titleRef}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
          style={{ color: `var(--color-text)` }}
        >
          Optimize Your{' '}
          <span 
            className="block sm:inline bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
            }}
          >
            Cloud Architecture
          </span>
        </h1>
        
        {/* Subtitle */}
        <p 
          ref={subtitleRef}
          className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 lg:mb-12 max-w-2xl lg:max-w-4xl leading-relaxed font-light px-2"
          style={{ color: `var(--color-textSecondary)` }}
        >
          Intelligent cloud architecture optimization with cost analysis and recommendations. 
          <span className="hidden sm:inline"> Transform your infrastructure with data-driven insights and save up to 40% on cloud costs.</span>
        </p>

        {/* Call-to-Action Buttons */}
        <div 
          ref={buttonsRef}
          className="flex gap-4 sm:gap-6 flex-col sm:flex-row items-center w-full sm:w-auto"
        >
          <Button 
            variant="primary" 
            size="lg"
            className="group relative overflow-hidden w-full sm:w-auto min-w-[240px] sm:min-w-[280px] min-h-[48px] sm:min-h-[56px]"
            onClick={() => {
              // Navigate to GitHub analysis
              router.push('/analyze');
            }}
            aria-label="Start analyzing your GitHub repository for cloud optimization"
          >
            <span className="relative z-10 text-sm sm:text-base">Analyze Your Repository</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
          
          <Button 
            variant="secondary" 
            size="lg"
            className="w-full sm:w-auto min-w-[240px] sm:min-w-[280px] min-h-[48px] sm:min-h-[56px]"
            onClick={() => {
              // Scroll to features section
              document.getElementById('features')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
            aria-label="Learn more about Cloud Opti features"
          >
            <span className="text-sm sm:text-base">Explore Features</span>
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 sm:mt-16 flex flex-col items-center space-y-3 sm:space-y-4">
          <div 
            className="text-xs sm:text-sm font-medium opacity-70 text-center"
            style={{ color: `var(--color-textSecondary)` }}
          >
            Trusted by developers worldwide
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm opacity-60">
            <span className="flex items-center gap-1">
              <span>🚀</span>
              <span className="hidden xs:inline">Fast Analysis</span>
              <span className="xs:hidden">Fast</span>
            </span>
            <span className="flex items-center gap-1">
              <span>💰</span>
              <span className="hidden xs:inline">Cost Savings</span>
              <span className="xs:hidden">Savings</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🔒</span>
              <span>Secure</span>
            </span>
            <span className="flex items-center gap-1">
              <span>📊</span>
              <span className="hidden xs:inline">Data-Driven</span>
              <span className="xs:hidden">Smart</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div 
          className="w-6 h-10 border-2 rounded-full flex justify-center"
          style={{ borderColor: `var(--color-textSecondary)` }}
        >
          <div 
            className="w-1 h-3 rounded-full mt-2"
            style={{ backgroundColor: `var(--color-textSecondary)` }}
          />
        </div>
      </div>
    </section>
  );
}