/**
 * Accessibility utilities for the landing page
 * Handles reduced motion, color contrast, keyboard navigation, and ARIA support
 */

// Color contrast calculation utilities
export const colorUtils = {
  // Convert hex to RGB
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Calculate relative luminance
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1, color2) => {
    const rgb1 = typeof color1 === 'string' ? colorUtils.hexToRgb(color1) : color1;
    const rgb2 = typeof color2 === 'string' ? colorUtils.hexToRgb(color2) : color2;
    
    if (!rgb1 || !rgb2) return 1;
    
    const lum1 = colorUtils.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = colorUtils.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast ratio meets WCAG standards
  meetsContrastStandard: (color1, color2, level = 'AA', size = 'normal') => {
    const ratio = colorUtils.getContrastRatio(color1, color2);
    
    const standards = {
      'AA': { normal: 4.5, large: 3 },
      'AAA': { normal: 7, large: 4.5 }
    };
    
    return ratio >= standards[level][size];
  },

  // Validate theme colors for accessibility
  validateThemeColors: (themeColors) => {
    const results = {
      valid: true,
      issues: [],
      ratios: {}
    };

    // Test critical color combinations
    const combinations = [
      { fg: 'text', bg: 'background', name: 'Primary text on background' },
      { fg: 'textSecondary', bg: 'background', name: 'Secondary text on background' },
      { fg: 'text', bg: 'surface', name: 'Text on surface' },
      { fg: 'background', bg: 'primary', name: 'Background on primary (buttons)' },
      { fg: 'background', bg: 'secondary', name: 'Background on secondary' },
      { fg: 'background', bg: 'accent', name: 'Background on accent' }
    ];

    combinations.forEach(({ fg, bg, name }) => {
      if (themeColors[fg] && themeColors[bg]) {
        const ratio = colorUtils.getContrastRatio(themeColors[fg], themeColors[bg]);
        results.ratios[name] = ratio;
        
        if (!colorUtils.meetsContrastStandard(themeColors[fg], themeColors[bg])) {
          results.valid = false;
          results.issues.push({
            combination: name,
            ratio: ratio.toFixed(2),
            required: 4.5,
            colors: { foreground: themeColors[fg], background: themeColors[bg] }
          });
        }
      }
    });

    return results;
  }
};

// Reduced motion utilities
export const motionUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Create a media query listener for reduced motion changes
  createReducedMotionListener: (callback) => {
    if (typeof window === 'undefined') return () => {};
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => callback(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    
    // Return cleanup function
    return () => mediaQuery.removeEventListener('change', handler);
  },

  // Get static alternative content for animations
  getStaticAlternative: (animationType) => {
    const alternatives = {
      fadeInUp: { opacity: 1, transform: 'translateY(0)' },
      staggerFadeIn: { opacity: 1, transform: 'translateY(0)' },
      scaleOnHover: { transform: 'scale(1)' },
      cardEntrance: { opacity: 1, transform: 'translateY(0) scale(1)' },
      textReveal: { opacity: 1, transform: 'translateY(0)' },
      parallax: { transform: 'translateY(0)' },
      drawTimeline: { strokeDashoffset: 0 },
      glowEffect: { boxShadow: 'none' },
      buttonPress: { transform: 'scale(1)' },
      touchInteraction: { transform: 'scale(1)' }
    };
    
    return alternatives[animationType] || { opacity: 1, transform: 'none' };
  },

  // Apply static styles for reduced motion users
  applyStaticStyles: (element, animationType) => {
    if (!element) return;
    
    const styles = motionUtils.getStaticAlternative(animationType);
    Object.assign(element.style, styles);
  }
};

// Keyboard navigation utilities
export const keyboardUtils = {
  // Focusable element selectors
  focusableSelectors: [
    'button',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', '),

  // Get all focusable elements within a container
  getFocusableElements: (container = document) => {
    return Array.from(container.querySelectorAll(keyboardUtils.focusableSelectors))
      .filter(el => {
        // Additional checks for visibility and interactivity
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               !el.hasAttribute('disabled') &&
               el.offsetParent !== null;
      });
  },

  // Create keyboard navigation for a set of elements
  createKeyboardNavigation: (elements, options = {}) => {
    const {
      wrap = true,
      orientation = 'both', // 'horizontal', 'vertical', 'both'
      onFocus = null,
      onActivate = null
    } = options;

    let currentIndex = 0;

    const navigate = (direction) => {
      const totalElements = elements.length;
      if (totalElements === 0) return;

      let newIndex = currentIndex;

      switch (direction) {
        case 'next':
          newIndex = wrap ? (currentIndex + 1) % totalElements : Math.min(currentIndex + 1, totalElements - 1);
          break;
        case 'previous':
          newIndex = wrap ? (currentIndex - 1 + totalElements) % totalElements : Math.max(currentIndex - 1, 0);
          break;
        case 'first':
          newIndex = 0;
          break;
        case 'last':
          newIndex = totalElements - 1;
          break;
      }

      if (newIndex !== currentIndex) {
        currentIndex = newIndex;
        elements[currentIndex].focus();
        if (onFocus) onFocus(elements[currentIndex], currentIndex);
      }
    };

    const handleKeyDown = (event) => {
      const { key, ctrlKey, metaKey } = event;
      let handled = false;

      // Arrow key navigation
      if (orientation === 'horizontal' || orientation === 'both') {
        if (key === 'ArrowRight') {
          navigate('next');
          handled = true;
        } else if (key === 'ArrowLeft') {
          navigate('previous');
          handled = true;
        }
      }

      if (orientation === 'vertical' || orientation === 'both') {
        if (key === 'ArrowDown') {
          navigate('next');
          handled = true;
        } else if (key === 'ArrowUp') {
          navigate('previous');
          handled = true;
        }
      }

      // Home/End navigation
      if (key === 'Home' || (ctrlKey && key === 'ArrowUp')) {
        navigate('first');
        handled = true;
      } else if (key === 'End' || (ctrlKey && key === 'ArrowDown')) {
        navigate('last');
        handled = true;
      }

      // Enter/Space activation
      if (key === 'Enter' || key === ' ') {
        if (onActivate) {
          onActivate(elements[currentIndex], currentIndex);
          handled = true;
        }
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Add event listeners to all elements
    elements.forEach((element, index) => {
      element.addEventListener('keydown', handleKeyDown);
      element.addEventListener('focus', () => {
        currentIndex = index;
        if (onFocus) onFocus(element, index);
      });
    });

    // Return cleanup function
    return () => {
      elements.forEach(element => {
        element.removeEventListener('keydown', handleKeyDown);
      });
    };
  },

  // Ensure proper tab order
  ensureTabOrder: (container) => {
    const focusableElements = keyboardUtils.getFocusableElements(container);
    
    focusableElements.forEach((element, index) => {
      // Only set tabindex if not already set
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });
  },

  // Create skip links for better navigation
  createSkipLinks: (sections) => {
    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'skip-links sr-only focus:not-sr-only';
    skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');

    sections.forEach(({ id, label }) => {
      const skipLink = document.createElement('a');
      skipLink.href = `#${id}`;
      skipLink.textContent = `Skip to ${label}`;
      skipLink.className = 'skip-link';
      
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(id);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
      
      skipLinksContainer.appendChild(skipLink);
    });

    return skipLinksContainer;
  }
};

// ARIA utilities
export const ariaUtils = {
  // Announce content to screen readers
  announce: (message, priority = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    
    document.body.appendChild(announcer);
    
    // Delay to ensure screen reader picks up the content
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  // Update ARIA labels dynamically
  updateAriaLabel: (element, label) => {
    if (element) {
      element.setAttribute('aria-label', label);
    }
  },

  // Set ARIA expanded state
  setExpanded: (element, expanded) => {
    if (element) {
      element.setAttribute('aria-expanded', expanded.toString());
    }
  },

  // Set ARIA pressed state for toggle buttons
  setPressed: (element, pressed) => {
    if (element) {
      element.setAttribute('aria-pressed', pressed.toString());
    }
  },

  // Create ARIA describedby relationship
  createDescribedBy: (element, descriptionId, description) => {
    if (!element) return;
    
    let descElement = document.getElementById(descriptionId);
    if (!descElement) {
      descElement = document.createElement('div');
      descElement.id = descriptionId;
      descElement.className = 'sr-only';
      descElement.textContent = description;
      document.body.appendChild(descElement);
    }
    
    element.setAttribute('aria-describedby', descriptionId);
  }
};

// Focus management utilities
export const focusUtils = {
  // Focus trap for modals and overlays
  createFocusTrap: (container) => {
    const focusableElements = keyboardUtils.getFocusableElements(container);
    
    if (focusableElements.length === 0) return () => {};
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      
      // Escape key to close
      if (e.key === 'Escape') {
        const closeButton = container.querySelector('[data-close]');
        if (closeButton) {
          closeButton.click();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement.focus();
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  // Save and restore focus
  createFocusManager: () => {
    let previousFocus = null;
    
    return {
      save: () => {
        previousFocus = document.activeElement;
      },
      restore: () => {
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus();
        }
      }
    };
  },

  // Ensure visible focus indicators
  ensureVisibleFocus: (element) => {
    if (!element) return;
    
    // Add focus-visible class for custom styling
    element.classList.add('focus-visible');
    
    const removeFocus = () => {
      element.classList.remove('focus-visible');
      element.removeEventListener('blur', removeFocus);
    };
    
    element.addEventListener('blur', removeFocus);
  }
};

// Main accessibility manager
export const accessibilityManager = {
  // Initialize all accessibility features
  init: () => {
    // Add reduced motion listener
    const cleanupMotionListener = motionUtils.createReducedMotionListener((prefersReduced) => {
      document.documentElement.classList.toggle('reduce-motion', prefersReduced);
      
      // Announce preference change
      ariaUtils.announce(
        prefersReduced 
          ? 'Animations disabled for reduced motion preference' 
          : 'Animations enabled',
        'polite'
      );
    });

    // Set initial reduced motion class
    if (motionUtils.prefersReducedMotion()) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Ensure proper focus management
    document.addEventListener('focusin', (e) => {
      focusUtils.ensureVisibleFocus(e.target);
    });

    // Add keyboard navigation hints
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Return cleanup function
    return () => {
      cleanupMotionListener();
    };
  },

  // Validate current page accessibility
  validate: () => {
    const results = {
      valid: true,
      issues: [],
      warnings: []
    };

    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        results.issues.push(`Image ${index + 1} missing alt text`);
        results.valid = false;
      }
    });

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        results.warnings.push(`Heading level skipped at heading ${index + 1} (${heading.textContent.slice(0, 30)}...)`);
      }
      previousLevel = level;
    });

    // Check for interactive elements without proper labels
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach((element, index) => {
      const hasLabel = element.getAttribute('aria-label') || 
                      element.getAttribute('aria-labelledby') ||
                      element.textContent.trim() ||
                      (element.tagName === 'INPUT' && element.type === 'submit' && element.value);
      
      if (!hasLabel) {
        results.issues.push(`Interactive element ${index + 1} (${element.tagName}) missing accessible label`);
        results.valid = false;
      }
    });

    return results;
  }
};

export default accessibilityManager;