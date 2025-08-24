'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Card from '@/components/ui/Card';

/**
 * Cloud architecture recommendation display component
 * Shows provider-specific cards with cost comparison and service reasoning
 */
export default function ArchitectureCards({
  recommendations = [],
  onSelect,
  selectedRecommendation = null,
  className = ''
}) {
  const [detailsModal, setDetailsModal] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  const modalRef = useRef(null);

  // Handle card selection
  const handleCardSelect = useCallback((recommendation) => {
    onSelect?.(recommendation);
  }, [onSelect]);

  // Handle details modal
  const handleShowDetails = useCallback((recommendation) => {
    setDetailsModal(recommendation);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsModal(null);
  }, []);

  // Handle escape key and outside clicks for modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && detailsModal) {
        handleCloseDetails();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && detailsModal) {
        handleCloseDetails();
      }
    };

    if (detailsModal) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [detailsModal, handleCloseDetails]);

  // Handle comparison mode toggle
  const handleComparisonToggle = useCallback(() => {
    setComparisonMode(!comparisonMode);
    if (!comparisonMode) {
      setSelectedForComparison(new Set());
    }
  }, [comparisonMode]);

  // Handle comparison selection
  const handleComparisonSelect = useCallback((recommendationId) => {
    const newSelection = new Set(selectedForComparison);
    if (newSelection.has(recommendationId)) {
      newSelection.delete(recommendationId);
    } else if (newSelection.size < 3) { // Limit to 3 comparisons
      newSelection.add(recommendationId);
    }
    setSelectedForComparison(newSelection);
  }, [selectedForComparison]);

  // Get provider icon
  const getProviderIcon = (provider) => {
    const icons = {
      aws: '🟠',
      azure: '🔵', 
      gcp: '🟡'
    };
    return icons[provider] || '☁️';
  };

  // Get provider name
  const getProviderName = (provider) => {
    const names = {
      aws: 'Amazon Web Services',
      azure: 'Microsoft Azure',
      gcp: 'Google Cloud Platform'
    };
    return names[provider] || provider.toUpperCase();
  };

  // Format cost
  const formatCost = (cost) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cost);
  };

  // Get confidence level styling
  const getConfidenceStyle = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">☁️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Recommendations Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Unable to generate architecture recommendations. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with comparison toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recommended Architectures
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {recommendations.length} options found, sorted by cost-effectiveness
          </p>
        </div>
        
        <button
          onClick={handleComparisonToggle}
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            comparisonMode
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {comparisonMode ? 'Exit Compare' : 'Compare'}
        </button>
      </div>

      {/* Recommendations grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((recommendation) => {
          const isSelected = selectedRecommendation?.id === recommendation.id;
          const isInComparison = selectedForComparison.has(recommendation.id);
          
          return (
            <Card
              key={recommendation.id}
              className={`relative transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:shadow-lg'
              } ${
                comparisonMode && isInComparison
                  ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                  : ''
              }`}
              onClick={() => {
                if (comparisonMode) {
                  handleComparisonSelect(recommendation.id);
                } else {
                  handleCardSelect(recommendation);
                }
              }}
            >
              {/* Comparison checkbox */}
              {comparisonMode && (
                <div className="absolute top-3 right-3">
                  <input
                    type="checkbox"
                    checked={isInComparison}
                    onChange={() => handleComparisonSelect(recommendation.id)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Provider header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl" role="img" aria-label={recommendation.provider}>
                    {getProviderIcon(recommendation.provider)}
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {getProviderName(recommendation.provider)}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${getConfidenceStyle(recommendation.confidence)}`}>
                        {Math.round(recommendation.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost summary */}
              <div className="mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCost(recommendation.estimatedCost.monthly)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    /month
                  </span>
                </div>
                
                {recommendation.estimatedCost.breakdown && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Compute:</span>
                      <span>{formatCost(recommendation.estimatedCost.breakdown.compute || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span>{formatCost(recommendation.estimatedCost.breakdown.storage || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span>{formatCost(recommendation.estimatedCost.breakdown.network || 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Key services */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Key Services
                </h5>
                <div className="space-y-1">
                  {recommendation.services.slice(0, 3).map((service, index) => (
                    <div key={`${recommendation.id}-service-${index}`} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {service.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        {service.category}
                      </span>
                    </div>
                  ))}
                  {recommendation.services.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      +{recommendation.services.length - 3} more services
                    </div>
                  )}
                </div>
              </div>

              {/* Reasoning preview */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Why This Architecture?
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {recommendation.reasoning[0] || 'Optimized for your technology stack and requirements.'}
                </p>
              </div>

              {/* Details/Select button */}
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowDetails(recommendation);
                  }}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  View Details
                </button>
                
                {!comparisonMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardSelect(recommendation);
                    }}
                    className={`px-3 py-2 text-xs rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                )}
              </div>


            </Card>
          );
        })}
      </div>

      {/* Comparison summary */}
      {comparisonMode && selectedForComparison.size > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
            Comparing {selectedForComparison.size} Architecture{selectedForComparison.size !== 1 ? 's' : ''}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {Array.from(selectedForComparison).map(id => {
              const rec = recommendations.find(r => r.id === id);
              return rec ? (
                <div key={`comparison-${id}`} className="text-center">
                  <div className="font-medium text-green-900 dark:text-green-100">
                    {getProviderName(rec.provider)}
                  </div>
                  <div className="text-green-700 dark:text-green-300">
                    {formatCost(rec.estimatedCost.monthly)}/month
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Selection summary */}
      {selectedRecommendation && !comparisonMode && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Selected: {getProviderName(selectedRecommendation.provider)}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Estimated cost: {formatCost(selectedRecommendation.estimatedCost.monthly)}/month
              </p>
            </div>
            <div className="text-2xl">
              {getProviderIcon(selectedRecommendation.provider)}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={modalRef}
              className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl" role="img" aria-label={detailsModal.provider}>
                    {getProviderIcon(detailsModal.provider)}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {getProviderName(detailsModal.provider)} Architecture
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceStyle(detailsModal.confidence)}`}>
                        {Math.round(detailsModal.confidence * 100)}% confidence
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCost(detailsModal.estimatedCost.monthly)}/month
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close details"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Cost Breakdown */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Cost Breakdown
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          {formatCost(detailsModal.estimatedCost.monthly)}/month
                        </div>
                        {detailsModal.estimatedCost.breakdown && (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Compute:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCost(detailsModal.estimatedCost.breakdown.compute || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Storage:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCost(detailsModal.estimatedCost.breakdown.storage || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Network:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCost(detailsModal.estimatedCost.breakdown.network || 0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scaling Projections */}
                    {detailsModal.estimatedCost.scalingProjections && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          Scaling Costs
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                          {detailsModal.estimatedCost.scalingProjections.map((projection, index) => (
                            <div key={`modal-projection-${index}`} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {projection.scale}:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCost(projection.monthlyCost)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cost Optimizations */}
                    {detailsModal.optimizations && detailsModal.optimizations.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          Cost Optimizations
                        </h4>
                        <ul className="space-y-2">
                          {detailsModal.optimizations.map((optimization, index) => (
                            <li key={`modal-optimization-${index}`} className="flex items-start space-x-2 text-sm">
                              <span className="text-green-500 mt-1">💡</span>
                              <span className="text-gray-600 dark:text-gray-400">{optimization.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Complete Service List */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Complete Service List
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {detailsModal.services.map((service, index) => (
                          <div key={`modal-service-${index}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {service.name}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                                {service.category}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {service.purpose}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Architecture Reasoning */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Architecture Reasoning
                      </h4>
                      <ul className="space-y-2">
                        {detailsModal.reasoning.map((reason, index) => (
                          <li key={`modal-reason-${index}`} className="flex items-start space-x-2 text-sm">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-gray-600 dark:text-gray-400">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Press Escape or click outside to close
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseDetails}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCardSelect(detailsModal);
                      handleCloseDetails();
                    }}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      selectedRecommendation?.id === detailsModal.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedRecommendation?.id === detailsModal.id ? 'Selected' : 'Select This Architecture'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}