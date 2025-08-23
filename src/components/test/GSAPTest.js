'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

export default function GSAPTest() {
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      // Simple GSAP animation to test integration
      gsap.fromTo(boxRef.current, 
        { 
          opacity: 0, 
          scale: 0.5,
          rotation: -180
        },
        { 
          opacity: 1, 
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "back.out(1.7)"
        }
      );
    }
  }, []);

  return (
    <div className="flex items-center justify-center p-8">
      <div
        ref={boxRef}
        className="w-20 h-20 rounded-lg"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />
    </div>
  );
}