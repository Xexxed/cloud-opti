'use client';

import { useEffect, useState } from 'react';
import { performanceUtils } from '@/lib/gsap';

export default function AnimationPerformanceTest() {
  const [deviceMetrics, setDeviceMetrics] = useState({});
  const [performanceData, setPerformanceData] = useState({});

  useEffect(() => {
    const updateMetrics = () => {
      const metrics = {
        screenSize: performanceUtils.getScreenSize(),
        deviceType: performanceUtils.getDeviceType(),
        animationComplexity: performanceUtils.getAnimationComplexity(),
        isMobile: performanceUtils.isMobileDevice(),
        isTouchDevice: performanceUtils.isTouchDevice(),
        isLowPerformance: performanceUtils.isLowPerformanceDevice(),
        prefersReducedMotion: performanceUtils.checkReducedMotion()
      };

      const performance = {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null
      };

      setDeviceMetrics(metrics);
      setPerformanceData(performance);
    };

    updateMetrics();

    const handleResize = () => updateMetrics();
    const handleOrientationChange = () => setTimeout(updateMetrics, 100);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'none': return 'text-red-600';
      case 'minimal': return 'text-orange-600';
      case 'reduced': return 'text-yellow-600';
      case 'standard': return 'text-blue-600';
      case 'full': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getComplexityDescription = (complexity) => {
    switch (complexity) {
      case 'none': return 'No animations (reduced motion preference)';
      case 'minimal': return 'Very basic animations only';
      case 'reduced': return 'Simplified animations for performance';
      case 'standard': return 'Standard animation complexity';
      case 'full': return 'Full animation complexity with all effects';
      default: return 'Unknown complexity level';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Animation Performance Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Metrics */}
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Device Detection</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Screen Size:</span>
              <span className="font-medium">{deviceMetrics.screenSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Device Type:</span>
              <span className="font-medium">{deviceMetrics.deviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Animation Complexity:</span>
              <span className={`font-medium ${getComplexityColor(deviceMetrics.animationComplexity)}`}>
                {deviceMetrics.animationComplexity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mobile Device:</span>
              <span className="font-medium">{deviceMetrics.isMobile ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Touch Device:</span>
              <span className="font-medium">{deviceMetrics.isTouchDevice ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Low Performance:</span>
              <span className="font-medium">{deviceMetrics.isLowPerformance ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reduced Motion:</span>
              <span className="font-medium">{deviceMetrics.prefersReducedMotion ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Performance Data */}
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Window Size:</span>
              <span className="font-medium">{performanceData.windowWidth} × {performanceData.windowHeight}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Device Pixel Ratio:</span>
              <span className="font-medium">{performanceData.devicePixelRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CPU Cores:</span>
              <span className="font-medium">{performanceData.hardwareConcurrency || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Device Memory:</span>
              <span className="font-medium">{performanceData.deviceMemory ? `${performanceData.deviceMemory} GB` : 'Unknown'}</span>
            </div>
            {performanceData.connection && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection Type:</span>
                  <span className="font-medium">{performanceData.connection.effectiveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Downlink Speed:</span>
                  <span className="font-medium">{performanceData.connection.downlink} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Round Trip Time:</span>
                  <span className="font-medium">{performanceData.connection.rtt} ms</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Animation Complexity Explanation */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Current Animation Strategy</h3>
        <p className={`text-lg font-medium mb-2 ${getComplexityColor(deviceMetrics.animationComplexity)}`}>
          {deviceMetrics.animationComplexity?.toUpperCase()} COMPLEXITY
        </p>
        <p className="text-gray-700 mb-4">
          {getComplexityDescription(deviceMetrics.animationComplexity)}
        </p>
        
        <div className="text-sm text-gray-600">
          <h4 className="font-medium mb-2">Optimization Details:</h4>
          <ul className="list-disc list-inside space-y-1">
            {deviceMetrics.isTouchDevice && (
              <li>Touch device detected: Hover effects replaced with touch feedback</li>
            )}
            {deviceMetrics.isMobile && (
              <li>Mobile device: Animation durations reduced by 20-40%</li>
            )}
            {deviceMetrics.isLowPerformance && (
              <li>Low performance device: Complex animations disabled</li>
            )}
            {deviceMetrics.prefersReducedMotion && (
              <li>Reduced motion preference: All animations disabled</li>
            )}
            {deviceMetrics.screenSize === 'xs' && (
              <li>Extra small screen: Animation distances and complexity reduced</li>
            )}
          </ul>
        </div>
      </div>

      {/* Test Instructions */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Testing Instructions</h3>
        <div className="text-blue-700 space-y-2">
          <p>• Resize your browser window to see how screen size affects animation complexity</p>
          <p>• Try enabling &quot;Reduce motion&quot; in your system accessibility settings</p>
          <p>• Test on different devices (mobile, tablet, desktop) to see adaptive behavior</p>
          <p>• Use browser dev tools to simulate different network conditions</p>
          <p>• Check hover vs touch interactions on different device types</p>
        </div>
      </div>
    </div>
  );
}