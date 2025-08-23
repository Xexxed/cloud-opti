'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gsap, performanceUtils } from '@/lib/gsap';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import AnimatedSection from '@/components/animations/AnimatedSection';

const HowItWorks = () => {
  const router = useRouter();
  const sectionRef = useRef(null);
  const timelineRef = useRef(null);
  const stepsRef = useRef([]);
  const progressLineRef = useRef(null);
  const connectingLinesRef = useRef([]);

  // Enhanced hover animations for step cards
  useEffect(() => {
    const stepCards = stepsRef.current.filter(Boolean);
    
    if (stepCards.length === 0) return;

    const ctx = gsap.context(() => {
      stepCards.forEach((card, index) => {
        if (!card) return;

        const cardElement = card.querySelector('.step-card');
        const icon = card.querySelector('.step-icon');
        const badge = card.querySelector('.step-badge');
        
        if (!cardElement) return;

        // Create hover timeline for each card
        const hoverTl = gsap.timeline({ paused: true });
        
        hoverTl
          .to(cardElement, {
            y: -8,
            scale: 1.02,
            duration: 0.4,
            ease: 'power2.out'
          })
          .to(icon, {
            scale: 1.1,
            rotation: 5,
            duration: 0.3,
            ease: 'back.out(1.7)'
          }, 0)
          .to(badge, {
            scale: 1.1,
            duration: 0.3,
            ease: 'back.out(1.7)'
          }, 0);

        // Enhanced glow effect
        const glowTl = gsap.timeline({ paused: true });
        glowTl.to(cardElement, {
          boxShadow: '0 20px 40px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)',
          duration: 0.3,
          ease: 'power2.out'
        });

        // Event listeners
        const handleMouseEnter = () => {
          hoverTl.play();
          glowTl.play();
        };
        
        const handleMouseLeave = () => {
          hoverTl.reverse();
          glowTl.reverse();
        };

        cardElement.addEventListener('mouseenter', handleMouseEnter);
        cardElement.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup
        return () => {
          cardElement.removeEventListener('mouseenter', handleMouseEnter);
          cardElement.removeEventListener('mouseleave', handleMouseLeave);
        };
      });
    });

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      id: 'input',
      number: '01',
      title: 'Input Your Project',
      description: 'Connect your GitHub repository or manually select your technology stack. Our system analyzes your codebase to understand your architecture needs.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      features: ['GitHub Integration', 'Stack Detection', 'Dependency Analysis']
    },
    {
      id: 'analysis',
      number: '02', 
      title: 'Intelligent Analysis',
      description: 'Our AI engine processes your project requirements, analyzes patterns, and evaluates optimal cloud service combinations across multiple providers.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      features: ['AI-Powered Analysis', 'Multi-Cloud Comparison', 'Cost Optimization']
    },
    {
      id: 'recommendations',
      number: '03',
      title: 'Get Recommendations',
      description: 'Receive detailed architecture recommendations with cost estimates, deployment templates, and visual diagrams ready for implementation.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      features: ['Architecture Diagrams', 'Cost Estimates', 'Terraform Templates']
    }
  ];

  // Enhanced scroll-triggered timeline animation
  const customTimelineAnimation = (elements) => {
    // Check for reduced motion preference
    if (performanceUtils.checkReducedMotion()) {
      gsap.set(elements, { opacity: 1, y: 0, scale: 1 });
      gsap.set(timelineRef.current, { opacity: 1 });
      gsap.set(progressLineRef.current, { scaleX: 1 });
      gsap.set(connectingLinesRef.current, { scaleX: 1 });
      return gsap.timeline();
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: timelineRef.current,
        start: "top 85%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
        onEnter: () => {
          // Additional logic when animation starts
        },
        onUpdate: (self) => {
          // Update progress line based on scroll progress during scroll
          if (progressLineRef.current && self.progress > 0.1) {
            gsap.to(progressLineRef.current, {
              scaleX: Math.min(self.progress * 1.2, 1),
              duration: 0.1,
              ease: "none"
            });
          }
        }
      }
    });
    
    // Set initial states
    gsap.set(elements, {
      opacity: 0,
      y: 80,
      scale: 0.8,
      rotationX: -15
    });

    gsap.set(connectingLinesRef.current, {
      scaleX: 0,
      transformOrigin: 'left center'
    });

    gsap.set(progressLineRef.current, {
      scaleX: 0,
      transformOrigin: 'left center'
    });

    gsap.set(timelineRef.current, {
      opacity: 0
    });

    // Animate timeline container first
    tl.to(timelineRef.current, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    });

    // Sequential step card reveal animations
    elements.forEach((element, index) => {
      tl.to(element, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
        force3D: true
      }, 0.3 + index * 0.4); // Staggered timing for sequential reveal

      // Animate step number badge with bounce
      const badge = element.querySelector('.step-badge');
      if (badge) {
        tl.fromTo(badge, {
          scale: 0,
          rotation: -180
        }, {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: 'back.out(2)',
          force3D: true
        }, 0.5 + index * 0.4);
      }

      // Animate step icon with rotation
      const icon = element.querySelector('.step-icon');
      if (icon) {
        tl.fromTo(icon, {
          scale: 0,
          rotation: -90
        }, {
          scale: 1,
          rotation: 0,
          duration: 0.5,
          ease: 'back.out(1.7)',
          force3D: true
        }, 0.7 + index * 0.4);
      }

      // Animate connecting line after step appears
      if (index < connectingLinesRef.current.length) {
        tl.to(connectingLinesRef.current[index], {
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.out'
        }, 1.0 + index * 0.4);
      }

      // Add subtle pulse animation to badge after it appears
      tl.to(badge, {
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: 1
      }, 1.5 + index * 0.4);

      // Animate feature items with stagger
      const featureItems = element.querySelectorAll('.feature-item');
      if (featureItems.length > 0) {
        tl.to(featureItems, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.1
        }, 1.2 + index * 0.4);

        // Animate feature dots with scale
        const featureDots = element.querySelectorAll('.feature-dot');
        tl.fromTo(featureDots, {
          scale: 0
        }, {
          scale: 1,
          duration: 0.3,
          ease: 'back.out(2)',
          stagger: 0.1
        }, 1.3 + index * 0.4);
      }
    });

    return tl;
  };

  return (
    <section 
      id="how-it-works"
      ref={sectionRef}
      className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--color-background)' }}
      aria-labelledby="how-it-works-title"
      role="region"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <AnimatedSection
          animation="fadeInUp"
          className="text-center mb-12 sm:mb-16"
        >
          <h2 
            id="how-it-works-title"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2"
            style={{ color: 'var(--color-text)' }}
          >
            How It Works
          </h2>
          <p 
            className="text-base sm:text-lg lg:text-xl max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            Transform your cloud architecture in three simple steps. From analysis to implementation, 
            we guide you through the entire optimization process.
          </p>
        </AnimatedSection>

        {/* Timeline Container */}
        <AnimatedSection
          customAnimation={customTimelineAnimation}
          className="relative"
        >
          <div 
            ref={timelineRef}
            className="relative opacity-0"
          >
            {/* Progress Line Background */}
            <div className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2 hidden lg:block">
              <div 
                className="w-full h-full rounded-full opacity-20"
                style={{ backgroundColor: 'var(--color-textSecondary)' }}
              />
              {/* Animated Progress Line */}
              <div 
                ref={progressLineRef}
                className="absolute top-0 left-0 h-full rounded-full shadow-lg"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                  width: '100%',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
              />
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 relative z-10">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  ref={el => stepsRef.current[index] = el}
                  className="relative"
                  data-animate
                >
                  {/* Connecting Line (Desktop) */}
                  {index < steps.length - 1 && (
                    <div 
                      ref={el => connectingLinesRef.current[index] = el}
                      className="absolute top-1/2 left-full w-12 h-0.5 transform -translate-y-1/2 translate-x-6 hidden lg:block z-0"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    />
                  )}

                  {/* Step Card */}
                  <Card 
                    variant="elevated"
                    padding="md"
                    hoverable={false}
                    className="step-card h-full flex flex-col text-center relative z-10 transform-gpu min-h-[320px] sm:min-h-[360px]"
                  >
                    {/* Step Number Badge */}
                    <div 
                      className="step-badge absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {step.number}
                    </div>

                    <CardHeader className="pt-6 sm:pt-8">
                      {/* Icon Container */}
                      <div 
                        className="step-icon w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6 transition-all duration-300"
                        style={{ 
                          backgroundColor: 'var(--color-accent)',
                          color: 'white'
                        }}
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8">
                          {step.icon}
                        </div>
                      </div>
                      
                      <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">
                        {step.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-grow">
                      <CardDescription className="text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                        {step.description}
                      </CardDescription>

                      {/* Features List */}
                      <div className="space-y-2">
                        {step.features.map((feature, featureIndex) => (
                          <div 
                            key={featureIndex}
                            className="feature-item flex items-center justify-center text-xs sm:text-sm opacity-0"
                            style={{ color: 'var(--color-textSecondary)' }}
                            data-feature-index={featureIndex}
                          >
                            <div 
                              className="feature-dot w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-2 sm:mr-3 flex-shrink-0"
                              style={{ backgroundColor: 'var(--color-primary)' }}
                            />
                            <span className="text-center">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>

                    {/* Arrow Indicator (Mobile) */}
                    {index < steps.length - 1 && (
                      <div className="flex justify-center mt-4 sm:mt-6 lg:hidden">
                        <div 
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Bottom CTA */}
        <AnimatedSection
          animation="fadeInUp"
          delay={0.8}
          className="text-center mt-12 sm:mt-16"
        >
          <div 
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            style={{ 
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-primary)',
              border: `1px solid var(--color-primary)`
            }}
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-2 sm:mr-3 animate-pulse" style={{ backgroundColor: 'var(--color-accent)' }} />
            Ready in minutes, not hours
          </div>
          
          <h3 
            className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 px-2"
            style={{ color: 'var(--color-text)' }}
          >
            Start Optimizing Your Cloud Architecture Today
          </h3>
          
          <button
            onClick={() => router.push('/analyze')}
            className="w-full max-w-xs sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg min-h-[48px]"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              focusRingColor: 'var(--color-primary)'
            }}
            aria-label="Start analyzing your GitHub repository"
          >
            Get Started Now
          </button>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default HowItWorks;