'use client';

import { useResponsiveAnimation, useResponsiveHover } from '@/hooks/useResponsiveAnimation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ResponsiveAnimationTest() {
  const { getAnimationProps: getCardProps, deviceInfo } = useResponsiveAnimation({
    animation: 'cardEntrance',
    trigger: 'immediate',
    autoPlay: true
  });

  const { getAnimationProps: getHoverProps } = useResponsiveHover({
    scaleAmount: undefined // Let it auto-determine based on device
  });

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Responsive Animation Test</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Screen Size: {deviceInfo.screenSize}</p>
          <p>Animation Complexity: {deviceInfo.complexity}</p>
          <p>Touch Device: {deviceInfo.isTouchDevice ? 'Yes' : 'No'}</p>
          <p>Mobile: {deviceInfo.isMobile ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card {...getCardProps()} className="p-6">
          <h3 className="text-lg font-semibold mb-2">Responsive Card</h3>
          <p className="text-gray-600">This card uses responsive entrance animations that adapt to your device capabilities.</p>
        </Card>

        <Card {...getCardProps()} className="p-6">
          <h3 className="text-lg font-semibold mb-2">Touch Optimized</h3>
          <p className="text-gray-600">Hover effects are optimized for touch devices with appropriate feedback.</p>
        </Card>

        <Card {...getCardProps()} className="p-6">
          <h3 className="text-lg font-semibold mb-2">Performance Aware</h3>
          <p className="text-gray-600">Animations scale down on low-performance devices automatically.</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <div {...getHoverProps()}>
          <Button variant="primary" size="lg">
            Hover/Touch Me
          </Button>
        </div>
        
        <div {...getHoverProps()}>
          <Button variant="secondary" size="lg">
            Responsive Button
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Try resizing your browser window or switching between desktop and mobile to see responsive behavior.</p>
        <p>On touch devices, hover effects are replaced with touch feedback.</p>
      </div>
    </div>
  );
}