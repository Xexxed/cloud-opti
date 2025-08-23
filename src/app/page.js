'use client';

import { useEffect } from 'react';
import { initGSAP } from '@/lib/gsap';
import AccessibilityProvider from '@/components/accessibility/AccessibilityProvider';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/landing/Footer';

export default function Home() {
  useEffect(() => {
    // Initialize GSAP with mobile optimizations
    initGSAP();
  }, []);

  return (
    <AccessibilityProvider>
      <div className="font-sans">
        {/* Main landmark for screen readers */}
        <main role="main">
          <Hero />
          <Features />
          <HowItWorks />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </AccessibilityProvider>
  );
}
