/**
 * Tests for ArchitectureRecommendationService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArchitectureRecommendationService } from '../ArchitectureRecommendationService.js';

// Mock dependencies
vi.mock('../mappings/CloudServiceMappings.js', () => ({
  CloudServiceMappings: vi.fn().mockImplementation(() => ({
    mapTechnologiesToServices: vi.fn().mockReturnValue([
      {
        name: 'Lambda',
        category: 'compute',
        purpose: 'Serverless function execution',
        type: 'serverless',
        supportedTechnologies: ['javascript'],
        confidence: 0.9
      }
    ]),
    getManagedAlternative: vi.fn().mockReturnValue(null),
    getRegionalOptimization: vi.fn().mockReturnValue(null)
  }))
}));

vi.mock('../cost/CostCalculator.js', () => ({
  CostCalculator: vi.fn().mockImplementation(() => ({
    calculateCosts: vi.fn().mockResolvedValue({
      monthly: 25.50,
      breakdown: { Lambda: { monthly: 25.50 } },
      scalingProjections: [
        { scale: '2x', monthlyCost: 45.00, costIncrease: 19.50, efficiency: 0.88 }
      ],
      currency: 'USD',
      region: 'us-east-1',
      assumptions: ['Test assumption']
    })
  }))
}));

vi.mock('../ranking/RecommendationRanker.js', () => ({
  RecommendationRanker: vi.fn().mockImplementation(() => ({
    rankRecommendations: vi.fn().mockImplementation(recs => 
      recs.map(rec => ({ ...rec, score: 0.85 })).sort((a, b) => b.score - a.score)
    )
  }))
}));

describe('ArchitectureRecommendationService', () => {
  let service;
  let mockTechnologies;
  let mockRequirements;

  beforeEach(() => {
    service = new ArchitectureRecommendationService();
    mockTechnologies = [
      {
        name: 'javascript',
        category: 'language',
        confidence: 0.9,
        source: 'file_extension'
      },
      {
        name: 'react',
        category: 'framework',
        confidence: 0.8,
        source: 'package_file'
      }
    ];
    mockRequirements = {
      scale: 'medium',
      traffic: 'medium',
      region: 'us-east-1'
    };
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for all providers', async () => {
      const recommendations = await service.generateRecommendations(
        mockTechnologies,
        mockRequirements
      );

      expect(recommendations).toHaveLength(3); // AWS, Azure, GCP
      expect(recommendations[0]).toHaveProperty('provider');
      expect(recommendations[0]).toHaveProperty('services');
      expect(recommendations[0]).toHaveProperty('estimatedCost');
      expect(recommendations[0]).toHaveProperty('reasoning');
      expect(recommendations[0]).toHaveProperty('confidence');
      expect(recommendations[0]).toHaveProperty('score');
    });

    it('should handle empty technologies array', async () => {
      const recommendations = await service.generateRecommendations([], mockRequirements);
      
      expect(recommendations).toHaveLength(3);
      recommendations.forEach(rec => {
        expect(rec.services).toBeDefined();
        expect(rec.estimatedCost).toBeDefined();
      });
    });

    it('should handle missing requirements', async () => {
      const recommendations = await service.generateRecommendations(mockTechnologies);
      
      expect(recommendations).toHaveLength(3);
      expect(recommendations[0]).toHaveProperty('estimatedCost');
    });

    it('should throw error on service failure', async () => {
      // Mock a failure in cost calculation
      service.costCalculator.calculateCosts.mockRejectedValueOnce(
        new Error('Cost calculation failed')
      );

      await expect(
        service.generateRecommendations(mockTechnologies, mockRequirements)
      ).rejects.toThrow('Failed to generate recommendations');
    });
  });

  describe('generateProviderRecommendation', () => {
    it('should generate recommendation for specific provider', async () => {
      const recommendation = await service.generateProviderRecommendation(
        'aws',
        mockTechnologies,
        mockRequirements
      );

      expect(recommendation.provider).toBe('aws');
      expect(recommendation.services).toBeDefined();
      expect(recommendation.estimatedCost).toBeDefined();
      expect(recommendation.reasoning).toBeInstanceOf(Array);
      expect(recommendation.confidence).toBeGreaterThan(0);
      expect(recommendation.optimizations).toBeInstanceOf(Array);
    });

    it('should include service optimization', async () => {
      const recommendation = await service.generateProviderRecommendation(
        'aws',
        mockTechnologies,
        mockRequirements
      );

      expect(recommendation.services).toHaveLength(1);
      expect(recommendation.services[0].name).toBe('Lambda');
    });
  });

  describe('applyOptimizationRules', () => {
    it('should prefer managed services', () => {
      const services = [
        { name: 'EC2', category: 'compute', type: 'traditional' }
      ];
      
      const optimized = service.applyOptimizationRules(services, mockRequirements);
      
      expect(optimized).toHaveLength(1);
      // Should call getManagedAlternative
      expect(service.mappings.getManagedAlternative).toHaveBeenCalled();
    });

    it('should suggest serverless for variable traffic', () => {
      const services = [
        { 
          name: 'EC2', 
          category: 'compute', 
          type: 'traditional',
          serverlessAlternative: 'Lambda'
        }
      ];
      const variableTrafficReqs = { ...mockRequirements, traffic: 'variable' };
      
      const optimized = service.applyOptimizationRules(services, variableTrafficReqs);
      
      expect(optimized[0]).toHaveProperty('name', 'Lambda');
      expect(optimized[0]).toHaveProperty('type', 'serverless');
    });

    it('should add reserved instance options for predictable workloads', () => {
      const services = [
        { 
          name: 'EC2', 
          category: 'compute', 
          type: 'traditional',
          supportsReservedInstances: true
        }
      ];
      const predictableReqs = { ...mockRequirements, workload: 'predictable' };
      
      const optimized = service.applyOptimizationRules(services, predictableReqs);
      
      expect(optimized[0]).toHaveProperty('reservedInstanceOption');
      expect(optimized[0].reservedInstanceOption).toHaveProperty('savings');
    });
  });

  describe('generateReasoning', () => {
    it('should generate reasoning based on technologies', () => {
      const services = [
        {
          name: 'Lambda',
          category: 'compute',
          supportedTechnologies: ['javascript']
        }
      ];
      
      const reasoning = service.generateReasoning(mockTechnologies, services);
      
      expect(reasoning).toBeInstanceOf(Array);
      expect(reasoning.length).toBeGreaterThan(0);
      expect(reasoning[0]).toContain('javascript');
      expect(reasoning[0]).toContain('Lambda');
    });

    it('should include web application reasoning', () => {
      const webTechnologies = [
        { name: 'react', category: 'framework', confidence: 0.8 },
        { name: 'postgresql', category: 'database', confidence: 0.9 }
      ];
      const services = [];
      
      const reasoning = service.generateReasoning(webTechnologies, services);
      
      expect(reasoning.some(r => r.includes('Web application'))).toBe(true);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence based on technology confidence', () => {
      const highConfidenceTech = [
        { name: 'javascript', confidence: 0.9 },
        { name: 'react', confidence: 0.8 }
      ];
      const services = [{ name: 'Lambda' }];
      
      const confidence = service.calculateConfidence(highConfidenceTech, services);
      
      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should return lower confidence with no services', () => {
      const confidence = service.calculateConfidence(mockTechnologies, []);
      
      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should suggest auto scaling for compute services', () => {
      const services = [
        { name: 'EC2', category: 'compute' }
      ];
      
      const suggestions = service.getOptimizationSuggestions(services, mockRequirements);
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.some(s => s.title.includes('Auto Scaling'))).toBe(true);
    });

    it('should suggest caching for database services', () => {
      const services = [
        { name: 'RDS', category: 'database' }
      ];
      
      const suggestions = service.getOptimizationSuggestions(services, mockRequirements);
      
      expect(suggestions.some(s => s.title.includes('Caching'))).toBe(true);
    });

    it('should return empty array for no applicable services', () => {
      const services = [
        { name: 'S3', category: 'storage' }
      ];
      
      const suggestions = service.getOptimizationSuggestions(services, mockRequirements);
      
      expect(suggestions).toBeInstanceOf(Array);
    });
  });
});