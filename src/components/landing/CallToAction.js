'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap, animations, animationConfig } from '@/lib/gsap';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/ui/Button';
import AnimatedSection from '@/components/animations/AnimatedSection';

export default function CallToAction() {
  const { theme, isLoaded } = useTheme();
  const router = useRouter();
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const subheadlineRef = useRef(null);
  const buttonsRef = useRef(null);
  const trustIndicatorsRef = useRef(null);
  const backgroundRef = useRef(null);
  const primaryButtonRef = useRef(null);
  const secondaryButtonRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set([headlineRef.current, subheadlineRef.current, buttonsRef.current, trustIndicatorsRef.current], {
        opacity: 0,
        y: 30
      });

      // Create pulsing animation for primary button
      if (primaryButtonRef.current) {
        const pulseTimeline = gsap.timeline({ repeat: -1, yoyo: true });
        pulseTimeline.to(primaryButtonRef.current, {
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)',
          duration: 2,
          ease: 'sine.inOut'
        });
      }

      // Background animation
      if (backgroundRef.current) {
        gsap.to(backgroundRef.current, {
          backgroundPosition: '200% 200%',
          duration: 15,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });
      }

    }, sectionRef);

    return () => ctx.revert();
  }, [isLoaded]);

  const handleGitHubAnalysis = () => {
    // Navigate to GitHub analysis feature
    router.push('/analyze');
  };

  const handleManualSetup = () => {
    // Navigate to manual stack selection feature
    router.push('/estimate');
  };

  if (!isLoaded) {
    return <div className="h-96 flex items-center justify-center">Loading...</div>;
  }

  return (
    <AnimatedSection
      id="cta"
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ 
        background: `var(--color-surface)`,
        color: `var(--color-text)`
      }}
      animation={(elements) => animations.staggerFadeIn(elements, { 
        stagger: 0.2,
        duration: 0.8 
      })}
      aria-labelledby="cta-title"
      role="region"
    >
      {/* Animated Background */}
      <div 
        ref={backgroundRef}
        className="absolute inset-0 opacity-15 sm:opacity-20"
        style={{
          background: `
            radial-gradient(circle at 30% 70%, var(--color-primary) 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, var(--color-secondary) 0%, transparent 50%),
            linear-gradient(135deg, var(--color-accent) 0%, transparent 50%)
          `,
          backgroundSize: '200% 200%',
          filter: 'blur(30px) sm:blur(40px)'
        }}
      />

      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-3 sm:opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, var(--color-text) 1px, transparent 0)
          `,
          backgroundSize: '30px 30px sm:40px 40px'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Main Headline */}
        <h2 
          ref={headlineRef}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2"
          style={{ color: `var(--color-text)` }}
        >
          Ready to{' '}
          <span 
            className="block sm:inline bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
            }}
          >
            Optimize
          </span>{' '}
          Your Cloud?
        </h2>

        {/* Subheadline */}
        <p 
          ref={subheadlineRef}
          className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 lg:mb-12 max-w-2xl lg:max-w-4xl mx-auto leading-relaxed font-light px-2"
          style={{ color: `var(--color-textSecondary)` }}
        >
          Join thousands of developers who have reduced their cloud costs by up to 40% 
          with intelligent architecture recommendations.
        </p>

        {/* Call-to-Action Buttons */}
        <div 
          ref={buttonsRef}
          className="flex gap-4 sm:gap-6 flex-col sm:flex-row items-center justify-center mb-12 sm:mb-16 max-w-lg sm:max-w-none mx-auto"
        >
          <Button 
            ref={primaryButtonRef}
            variant="primary" 
            size="lg"
            className="group relative overflow-hidden w-full sm:w-auto min-w-[240px] sm:min-w-[280px] min-h-[48px] sm:min-h-[56px]"
            onClick={handleGitHubAnalysis}
          >
            <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base">
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Start with GitHub
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
          
          <Button 
            ref={secondaryButtonRef}
            variant="secondary" 
            size="lg"
            className="w-full sm:w-auto min-w-[240px] sm:min-w-[280px] min-h-[48px] sm:min-h-[56px]"
            onClick={handleManualSetup}
          >
            <span className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base">
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manual Setup
            </span>
          </Button>
        </div>

        {/* Trust Indicators and Social Proof */}
        <div 
          ref={trustIndicatorsRef}
          className="space-y-6 sm:space-y-8"
        >
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl sm:max-w-4xl mx-auto">
            <div className="text-center">
              <div 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2"
                style={{ color: `var(--color-primary)` }}
              >
                1000+
              </div>
              <div 
                className="text-xs sm:text-sm lg:text-base opacity-80"
                style={{ color: `var(--color-textSecondary)` }}
              >
                Developers Trust Us
              </div>
            </div>
            <div className="text-center">
              <div 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2"
                style={{ color: `var(--color-secondary)` }}
              >
                40%
              </div>
              <div 
                className="text-xs sm:text-sm lg:text-base opacity-80"
                style={{ color: `var(--color-textSecondary)` }}
              >
                Average Cost Savings
              </div>
            </div>
            <div className="text-center">
              <div 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2"
                style={{ color: `var(--color-accent)` }}
              >
                5min
              </div>
              <div 
                className="text-xs sm:text-sm lg:text-base opacity-80"
                style={{ color: `var(--color-textSecondary)` }}
              >
                Average Analysis Time
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 opacity-70 px-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span style={{ color: `var(--color-textSecondary)` }}>
                Free Analysis
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span style={{ color: `var(--color-textSecondary)` }} className="hidden sm:inline">
                No Credit Card Required
              </span>
              <span style={{ color: `var(--color-textSecondary)` }} className="sm:hidden">
                No Card Required
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span style={{ color: `var(--color-textSecondary)` }}>
                Secure & Private
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span style={{ color: `var(--color-textSecondary)` }}>
                Instant Results
              </span>
            </div>
          </div>

          {/* Social Proof Quote */}
          <div className="max-w-2xl lg:max-w-3xl mx-auto px-4">
            <blockquote 
              className="text-sm sm:text-base lg:text-lg xl:text-xl italic leading-relaxed text-center"
              style={{ color: `var(--color-textSecondary)` }}
            >
              &ldquo;Cloud Opti helped us reduce our AWS costs by 35% in just one week. 
              The recommendations were spot-on and easy to implement.&rdquo;
            </blockquote>
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 sm:gap-3">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base"
                style={{ backgroundColor: `var(--color-primary)` }}
              >
                JS
              </div>
              <div className="text-left">
                <div 
                  className="font-semibold text-sm sm:text-base"
                  style={{ color: `var(--color-text)` }}
                >
                  Jane Smith
                </div>
                <div 
                  className="text-xs sm:text-sm opacity-70"
                  style={{ color: `var(--color-textSecondary)` }}
                >
                  Senior DevOps Engineer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}