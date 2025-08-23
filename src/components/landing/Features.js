'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gsap, animations } from '@/lib/gsap';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import AnimatedSection from '@/components/animations/AnimatedSection';

const Features = () => {
  const router = useRouter();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const iconsRef = useRef([]);

  const features = [
    {
      id: 'github-integration',
      icon: (
        <svg className="w-8 h-8 feature-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      title: 'GitHub Integration',
      description: 'Seamlessly analyze your existing repositories to understand your technology stack and architecture needs. Our intelligent parser detects frameworks, dependencies, and patterns to provide accurate recommendations.'
    },
    {
      id: 'cost-optimization',
      icon: (
        <svg className="w-8 h-8 feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Cost Optimization',
      description: 'Get intelligent recommendations that balance performance and cost. Our engine considers reserved instances, spot pricing, and managed services to minimize your cloud spending while maintaining reliability.'
    },
    {
      id: 'multi-cloud',
      icon: (
        <svg className="w-8 h-8 feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.002 4.002 0 003 15z" />
        </svg>
      ),
      title: 'Multi-Cloud Support',
      description: 'Compare recommendations across AWS, Azure, and Google Cloud Platform. Make informed decisions with side-by-side cost comparisons and service mappings tailored to your specific requirements.'
    }
  ];

  // Enhanced hover animations for cards
  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    const icons = iconsRef.current.filter(Boolean);

    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      cards.forEach((card, index) => {
        if (!card) return;

        const icon = icons[index];
        const iconContainer = card.querySelector('.icon-container');
        
        // Create hover timeline for each card
        const hoverTl = gsap.timeline({ paused: true });
        
        hoverTl
          .to(card, {
            y: -12,
            scale: 1.02,
            duration: 0.4,
            ease: 'power2.out'
          })
          .to(iconContainer, {
            scale: 1.1,
            rotation: 5,
            duration: 0.3,
            ease: 'back.out(1.7)'
          }, 0)
          .to(icon, {
            rotation: 360,
            duration: 0.6,
            ease: 'power2.inOut'
          }, 0.1);

        // Enhanced glow effect
        const glowTl = gsap.timeline({ paused: true });
        glowTl.to(card, {
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

        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup
        return () => {
          card.removeEventListener('mouseenter', handleMouseEnter);
          card.removeEventListener('mouseleave', handleMouseLeave);
        };
      });
    });

    return () => ctx.revert();
  }, []);

  // Custom animation for feature cards with stagger effect
  const customCardAnimation = (elements) => {
    const tl = gsap.timeline();
    
    // Animate cards from bottom with stagger
    tl.fromTo(elements, 
      {
        opacity: 0,
        y: 80,
        scale: 0.8,
        rotationX: -15,
        force3D: true
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
        stagger: 0.2,
        force3D: true
      }
    );

    // Animate icons with delay
    tl.fromTo('.feature-icon', 
      {
        scale: 0,
        rotation: -180,
        force3D: true
      },
      {
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: 'back.out(2)',
        stagger: 0.1,
        force3D: true
      }, 0.3
    );

    return tl;
  };

  return (
    <section 
      ref={sectionRef}
      id="features"
      className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--color-background)' }}
      aria-labelledby="features-title"
      role="region"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <AnimatedSection
          animation="fadeInUp"
          className="text-center mb-12 sm:mb-16"
        >
          <h2 
            id="features-title"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2"
            style={{ color: 'var(--color-text)' }}
          >
            Powerful Features for
            <span 
              className="block mt-1 sm:mt-2"
              style={{ color: 'var(--color-primary)' }}
            >
              Smart Cloud Optimization
            </span>
          </h2>
          <p 
            className="text-base sm:text-lg lg:text-xl max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            Discover how Cloud Opti transforms your development workflow with intelligent 
            analysis, cost-effective recommendations, and seamless multi-cloud support.
          </p>
        </AnimatedSection>

        {/* Features Grid */}
        <AnimatedSection
          customAnimation={customCardAnimation}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12"
          stagger={true}
        >
          {features.map((feature, index) => (
            <div
              key={feature.id}
              ref={el => cardsRef.current[index] = el}
              className="h-full feature-card"
              data-animate
            >
              <Card 
                variant="elevated"
                padding="md"
                hoverable={false} // We'll handle hover animations manually
                className="h-full flex flex-col group transform-gpu min-h-[280px] sm:min-h-[320px]"
              >
                <CardHeader>
                  {/* Icon Container */}
                  <div 
                    ref={el => iconsRef.current[index] = el}
                    className="icon-container w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300 transform-gpu mx-auto sm:mx-0"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8">
                      {feature.icon}
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-center sm:text-left">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-grow">
                  <CardDescription className="text-sm sm:text-base leading-relaxed text-center sm:text-left">
                    {feature.description}
                  </CardDescription>
                </CardContent>

                {/* Subtle animated accent line */}
                <div 
                  className="accent-line absolute bottom-0 left-0 h-1 rounded-b-xl"
                  style={{ 
                    backgroundColor: 'var(--color-accent)',
                    width: '0%'
                  }}
                />
              </Card>
            </div>
          ))}
        </AnimatedSection>

        {/* Bottom CTA Section */}
        <AnimatedSection
          animation="fadeInUp"
          delay={0.6}
          className="text-center mt-12 sm:mt-16"
        >
          <p 
            className="text-base sm:text-lg mb-6 sm:mb-8 px-2"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            Ready to optimize your cloud architecture?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => router.push('/analyze')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 min-h-[48px]"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                focusRingColor: 'var(--color-primary)'
              }}
              aria-label="Start analyzing your GitHub repository"
            >
              Analyze Your Repository
            </button>
            <button
              onClick={() => router.push('/estimate')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border-2 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 min-h-[48px]"
              style={{
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
                focusRingColor: 'var(--color-primary)'
              }}
              aria-label="Explore manual stack selection features"
            >
              Explore Features
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Features;