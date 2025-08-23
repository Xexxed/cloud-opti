'use client';

import { useEffect, useRef, forwardRef } from 'react';
import { gsap, performanceUtils, animations } from '@/lib/gsap';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props 
}, ref) => {
  const buttonRef = useRef(null);
  const glowRef = useRef(null);
  
  // Use forwarded ref or internal ref
  const finalRef = ref || buttonRef;

  useEffect(() => {
    if (!finalRef.current || disabled) return;

    const button = finalRef.current;
    const glow = glowRef.current;

    const ctx = gsap.context(() => {
      // Import performance utilities (these are already imported at the top level)
      
      const isTouchDevice = performanceUtils.isTouchDevice();
      const complexity = performanceUtils.getAnimationComplexity();
      const screenSize = performanceUtils.getScreenSize();
      
      if (complexity === 'none') return;

      // Set initial glow state
      gsap.set(glow, {
        opacity: 0,
        scale: 0.8
      });

      // Responsive scale values
      const getScaleValues = () => {
        if (isTouchDevice) {
          return { hover: 1.02, click: 0.98 };
        }
        if (screenSize === 'xs' || screenSize === 'sm') {
          return { hover: 1.03, click: 0.97 };
        }
        return { hover: 1.05, click: 0.95 };
      };

      const scales = getScaleValues();

      // Hover animation timeline (disabled on touch devices)
      let hoverTl = null;
      if (!isTouchDevice && complexity !== 'minimal') {
        hoverTl = gsap.timeline({ paused: true });
        
        hoverTl
          .to(button, {
            scale: scales.hover,
            duration: 0.3,
            ease: 'power2.out'
          })
          .to(glow, {
            opacity: variant === 'primary' ? 0.3 : 0.2,
            scale: 1.2,
            duration: 0.3,
            ease: 'power2.out'
          }, 0);
      }

      // Focus animation timeline
      const focusTl = gsap.timeline({ paused: true });
      
      focusTl.to(button, {
        boxShadow: variant === 'primary' 
          ? '0 0 0 3px rgba(37, 99, 235, 0.3)' 
          : '0 0 0 3px rgba(124, 58, 237, 0.3)',
        duration: 0.2,
        ease: 'power2.out'
      });

      // Touch-optimized click animation
      const clickAnimation = () => {
        if (isTouchDevice) {
          // Use touch-optimized animation
          const touchTl = animations.touchInteraction(button);
          touchTl.play();
        } else {
          // Standard click animation
          gsap.to(button, {
            scale: scales.click,
            duration: 0.1,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
          });
        }
      };

      // Touch-specific feedback
      const touchStartAnimation = () => {
        if (isTouchDevice && complexity !== 'minimal') {
          gsap.to(button, {
            scale: 0.98,
            duration: 0.1,
            ease: 'power2.out'
          });
        }
      };

      const touchEndAnimation = () => {
        if (isTouchDevice && complexity !== 'minimal') {
          gsap.to(button, {
            scale: 1,
            duration: 0.15,
            ease: 'power2.out'
          });
        }
      };

      // Event listeners based on device type
      const handleMouseEnter = () => hoverTl?.play();
      const handleMouseLeave = () => hoverTl?.reverse();
      const handleFocus = () => focusTl.play();
      const handleBlur = () => focusTl.reverse();
      const handleMouseDown = clickAnimation;
      const handleTouchStart = touchStartAnimation;
      const handleTouchEnd = touchEndAnimation;
      
      // Keyboard activation
      const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickAnimation();
          if (onClick) {
            onClick(e);
          }
        }
      };

      // Add appropriate event listeners
      if (!isTouchDevice && hoverTl) {
        button.addEventListener('mouseenter', handleMouseEnter);
        button.addEventListener('mouseleave', handleMouseLeave);
      }
      
      button.addEventListener('focus', handleFocus);
      button.addEventListener('blur', handleBlur);
      button.addEventListener('mousedown', handleMouseDown);
      button.addEventListener('keydown', handleKeyDown);
      
      if (isTouchDevice) {
        button.addEventListener('touchstart', handleTouchStart, { passive: true });
        button.addEventListener('touchend', handleTouchEnd, { passive: true });
        button.addEventListener('touchcancel', handleTouchEnd, { passive: true });
      }

      return () => {
        if (!isTouchDevice && hoverTl) {
          button.removeEventListener('mouseenter', handleMouseEnter);
          button.removeEventListener('mouseleave', handleMouseLeave);
        }
        
        button.removeEventListener('focus', handleFocus);
        button.removeEventListener('blur', handleBlur);
        button.removeEventListener('mousedown', handleMouseDown);
        button.removeEventListener('keydown', handleKeyDown);
        
        if (isTouchDevice) {
          button.removeEventListener('touchstart', handleTouchStart);
          button.removeEventListener('touchend', handleTouchEnd);
          button.removeEventListener('touchcancel', handleTouchEnd);
        }
      };
    }, finalRef);

    return () => ctx.revert();
  }, [variant, disabled, finalRef]);

  // Base styles
  const baseStyles = `
    relative overflow-hidden font-medium transition-all duration-300 
    focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
    disabled:transform-none
  `;

  // Size variants with mobile-optimized touch targets
  const sizeStyles = {
    sm: 'px-3 py-2 sm:px-4 sm:py-2 text-sm rounded-md min-h-[40px]',
    md: 'px-4 py-3 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg min-h-[44px] sm:min-h-[48px]',
    lg: 'px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl min-h-[48px] sm:min-h-[52px]',
    xl: 'px-8 py-4 sm:px-10 sm:py-5 text-lg sm:text-xl rounded-xl sm:rounded-2xl min-h-[52px] sm:min-h-[56px]'
  };

  // Variant styles using CSS custom properties for theme support
  const variantStyles = {
    primary: `
      text-white border-2 border-transparent
    `,
    secondary: `
      border-2 bg-transparent
    `,
    outline: `
      border-2 bg-transparent hover:bg-opacity-10
    `
  };

  const combinedClassName = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `.trim();

  // Dynamic styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
          borderColor: 'var(--color-primary)'
        };
      case 'secondary':
        return {
          color: 'var(--color-primary)',
          borderColor: 'var(--color-primary)',
          backgroundColor: 'transparent'
        };
      case 'outline':
        return {
          color: 'var(--color-text)',
          borderColor: 'var(--color-textSecondary)',
          backgroundColor: 'transparent'
        };
      default:
        return {};
    }
  };

  const getGlowStyles = () => {
    const baseGlow = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      height: '100%',
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: -1
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseGlow,
          backgroundColor: 'var(--color-primary)',
          filter: 'blur(8px)'
        };
      case 'secondary':
        return {
          ...baseGlow,
          backgroundColor: 'var(--color-secondary)',
          filter: 'blur(6px)'
        };
      default:
        return {
          ...baseGlow,
          backgroundColor: 'var(--color-accent)',
          filter: 'blur(4px)'
        };
    }
  };

  return (
    <button
      ref={finalRef}
      className={combinedClassName}
      style={getButtonStyles()}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {/* Glow effect */}
      <div
        ref={glowRef}
        style={getGlowStyles()}
      />
      
      {/* Button content */}
      <span className="relative z-10">
        {children}
      </span>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;