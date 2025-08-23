'use client';

import { useEffect, useRef, forwardRef } from 'react';
import { gsap, performanceUtils, animations } from '@/lib/gsap';

const Card = forwardRef(({ 
  children, 
  variant = 'default',
  padding = 'md',
  hoverable = true,
  className = '',
  onClick,
  ...props 
}, ref) => {
  const cardRef = useRef(null);
  const shadowRef = useRef(null);
  
  // Use forwarded ref or internal ref
  const finalRef = ref || cardRef;

  useEffect(() => {
    if (!finalRef.current || !hoverable) return;

    const card = finalRef.current;
    const shadow = shadowRef.current;

    const ctx = gsap.context(() => {
      // Import performance utilities (these are already imported at the top level)
      
      const isTouchDevice = performanceUtils.isTouchDevice();
      const complexity = performanceUtils.getAnimationComplexity();
      const screenSize = performanceUtils.getScreenSize();
      
      if (complexity === 'none') return;

      // Set initial shadow state
      gsap.set(shadow, {
        opacity: 0,
        scale: 0.95
      });

      // Responsive animation values
      const getAnimationValues = () => {
        if (isTouchDevice) {
          return { lift: -4, scale: 0.99, shadowOpacity: 0.1 };
        }
        if (screenSize === 'xs' || screenSize === 'sm') {
          return { lift: -6, scale: 0.98, shadowOpacity: 0.12 };
        }
        return { lift: -8, scale: 0.98, shadowOpacity: 0.15 };
      };

      const values = getAnimationValues();

      // Hover animation timeline (modified for touch devices)
      let hoverTl = null;
      if (!isTouchDevice && complexity !== 'minimal') {
        hoverTl = gsap.timeline({ paused: true });
        
        hoverTl
          .to(card, {
            y: values.lift,
            duration: 0.3,
            ease: 'power2.out'
          })
          .to(shadow, {
            opacity: values.shadowOpacity,
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out'
          }, 0);
      }

      // Focus animation for accessibility
      const focusTl = gsap.timeline({ paused: true });
      
      focusTl.to(card, {
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
        duration: 0.2,
        ease: 'power2.out'
      });

      // Touch-optimized click animation
      const clickAnimation = () => {
        if (isTouchDevice) {
          // Use touch-optimized animation
          const touchTl = animations.touchInteraction(card);
          touchTl.play();
        } else {
          // Standard click animation
          gsap.to(card, {
            scale: values.scale,
            duration: 0.1,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
          });
        }
      };

      // Touch-specific feedback for cards
      const touchStartAnimation = () => {
        if (isTouchDevice && complexity !== 'minimal') {
          gsap.to(card, {
            y: values.lift * 0.5,
            scale: 0.99,
            duration: 0.15,
            ease: 'power2.out'
          });
          
          gsap.to(shadow, {
            opacity: values.shadowOpacity * 0.7,
            scale: 1.02,
            duration: 0.15,
            ease: 'power2.out'
          });
        }
      };

      const touchEndAnimation = () => {
        if (isTouchDevice && complexity !== 'minimal') {
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.2,
            ease: 'power2.out'
          });
          
          gsap.to(shadow, {
            opacity: 0,
            scale: 0.95,
            duration: 0.2,
            ease: 'power2.out'
          });
        }
      };

      // Event listeners based on device type
      const handleMouseEnter = () => hoverTl?.play();
      const handleMouseLeave = () => hoverTl?.reverse();
      const handleFocus = () => focusTl.play();
      const handleBlur = () => focusTl.reverse();
      const handleMouseDown = onClick ? clickAnimation : null;
      const handleTouchStart = onClick ? touchStartAnimation : null;
      const handleTouchEnd = onClick ? touchEndAnimation : null;

      // Add appropriate event listeners
      if (!isTouchDevice && hoverTl) {
        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);
      }
      
      if (onClick) {
        card.addEventListener('focus', handleFocus);
        card.addEventListener('blur', handleBlur);
        card.addEventListener('mousedown', handleMouseDown);
        
        if (isTouchDevice) {
          card.addEventListener('touchstart', handleTouchStart, { passive: true });
          card.addEventListener('touchend', handleTouchEnd, { passive: true });
          card.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        }
      }

      return () => {
        if (!isTouchDevice && hoverTl) {
          card.removeEventListener('mouseenter', handleMouseEnter);
          card.removeEventListener('mouseleave', handleMouseLeave);
        }
        
        if (onClick) {
          card.removeEventListener('focus', handleFocus);
          card.removeEventListener('blur', handleBlur);
          card.removeEventListener('mousedown', handleMouseDown);
          
          if (isTouchDevice) {
            card.removeEventListener('touchstart', handleTouchStart);
            card.removeEventListener('touchend', handleTouchEnd);
            card.removeEventListener('touchcancel', handleTouchEnd);
          }
        }
      };
    }, finalRef);

    return () => ctx.revert();
  }, [hoverable, onClick, finalRef]);

  // Base styles
  const baseStyles = `
    relative rounded-xl transition-all duration-300 border
    ${onClick ? 'cursor-pointer focus:outline-none' : ''}
    ${hoverable ? 'transform-gpu' : ''}
  `;

  // Padding variants with mobile-responsive padding
  const paddingStyles = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10'
  };

  // Variant styles
  const variantStyles = {
    default: '',
    elevated: 'shadow-lg',
    outlined: 'border-2',
    glass: 'backdrop-blur-sm bg-opacity-80'
  };

  const combinedClassName = `
    ${baseStyles}
    ${paddingStyles[padding]}
    ${variantStyles[variant]}
    ${className}
  `.trim();

  // Dynamic styles based on theme
  const getCardStyles = () => {
    const baseStyle = {
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-textSecondary)',
      borderWidth: '1px',
      borderOpacity: 0.2
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: '2px',
          borderOpacity: 0.3
        };
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(var(--color-surface-rgb), 0.8)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(var(--color-textSecondary-rgb), 0.2)'
        };
      default:
        return baseStyle;
    }
  };

  const getShadowStyles = () => ({
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    height: '20px',
    background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: -1
  });

  // Render as button if onClick is provided, otherwise as div
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      ref={finalRef}
      className={combinedClassName}
      style={getCardStyles()}
      onClick={onClick}
      {...props}
    >
      {/* Enhanced shadow for hover effect */}
      {hoverable && (
        <div
          ref={shadowRef}
          style={getShadowStyles()}
        />
      )}
      
      {/* Card content */}
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

// Card sub-components for better composition
export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 
    className={`text-xl font-semibold mb-2 ${className}`}
    style={{ color: 'var(--color-text)' }}
  >
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p 
    className={`text-sm leading-relaxed ${className}`}
    style={{ color: 'var(--color-textSecondary)' }}
  >
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t ${className}`} style={{ borderColor: 'var(--color-textSecondary)', borderOpacity: 0.2 }}>
    {children}
  </div>
);

export default Card;