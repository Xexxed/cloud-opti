/**
 * Integration tests for the complete cloud architecture recommendation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArchitectureRecommendationService } from '../ArchitectureRecommendationService.js';

describe('Cloud Architecture Recommendation System Integration', () => {
  let service;

  beforeEach(() => {
    service = new ArchitectureRecommendationService();
  });

  describe('End-to-end recommendation generation', () => {
    it('should generate complete recommendations for a typical web application', async () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9, source: 'file_extension' },
        { name: 'react', category: 'framework', confidence: 0.8, source: 'package_file' },
        { name: 'postgresql', category: 'database', confidence: 0.9, source: 'config_file' }
      ];

      const requirements = {
        scale: 'medium',
        traffic: 'medium',
        region: 'us-east-1',
        maxBudget: 500,
        priority: 'cost'
      };

      const recommendations = await service.generateRecommendations(technologies, requirements);

      // Should have recommendations for all three providers
      expect(recommendations).toHaveLength(3);
      
      // Verify each recommendation has required properties
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('provider');
        expect(rec).toHaveProperty('services');
        expect(rec).toHaveProperty('estimatedCost');
        expect(rec).toHaveProperty('reasoning');
        expect(rec).toHaveProperty('confidence');
        expect(rec).toHaveProperty('optimizations');
        expect(rec).toHaveProperty('score');

        // Verify services are mapped correctly
        expect(rec.services.length).toBeGreaterThan(0);
        expect(rec.services.some(s => s.category === 'compute' || s.category === 'hosting')).toBe(true);
        expect(rec.services.some(s => s.category === 'database')).toBe(true);

        // Verify cost estimation
        expect(rec.estimatedCost.monthly).toBeGreaterThan(0);
        expect(rec.estimatedCost.breakdown).toBeDefined();
        expect(rec.estimatedCost.scalingProjections).toBeInstanceOf(Array);

        // Verify reasoning is provided
        expect(rec.reasoning).toBeInstanceOf(Array);
        expect(rec.reasoning.length).toBeGreaterThan(0);

        // Verify confidence is reasonable
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
      });

      // Should be ranked by score
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].score).toBeGreaterThanOrEqual(recommendations[i + 1].score);
      }
    });

    it('should handle serverless-optimized applications', async () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.95, source: 'file_extension' },
        { name: 'nextjs', category: 'framework', confidence: 0.9, source: 'package_file' }
      ];

      const requirements = {
        scale: 'small',
        traffic: 'variable',
        priority: 'simplicity'
      };

      const recommendations = await service.generateRecommendations(technologies, requirements);

      // Should prefer serverless solutions for variable traffic
      const awsRec = recommendations.find(r => r.provider === 'aws');
      expect(awsRec.services.some(s => s.type === 'serverless')).toBe(true);

      // Should have reasonable costs for small scale
      recommendations.forEach(rec => {
        expect(rec.estimatedCost.monthly).toBeLessThan(200);
      });
    });

    it('should optimize for enterprise requirements', async () => {
      const technologies = [
        { name: 'python', category: 'language', confidence: 0.9, source: 'file_extension' },
        { name: 'postgresql', category: 'database', confidence: 0.95, source: 'config_file' }
      ];

      const requirements = {
        scale: 'large',
        traffic: 'high',
        priority: 'reliability',
        organizationType: 'enterprise',
        workload: 'predictable'
      };

      const recommendations = await service.generateRecommendations(technologies, requirements);

      // Should prefer managed services for enterprise
      recommendations.forEach(rec => {
        const managedServices = rec.services.filter(s => s.type === 'managed');
        expect(managedServices.length).toBeGreaterThan(0);

        // Should suggest reserved instances for predictable workloads
        const computeServices = rec.services.filter(s => s.category === 'compute');
        if (computeServices.length > 0) {
          expect(computeServices.some(s => s.reservedInstanceOption)).toBe(true);
        }
      });
    });

    it('should handle minimal technology detection', async () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.6, source: 'file_extension' }
      ];

      const requirements = {
        scale: 'small',
        maxBudget: 100
      };

      const recommendations = await service.generateRecommendations(technologies, requirements);

      expect(recommendations).toHaveLength(3);
      
      // Should still provide reasonable recommendations
      recommendations.forEach(rec => {
        expect(rec.services.length).toBeGreaterThan(0);
        expect(rec.estimatedCost.monthly).toBeLessThanOrEqual(100);
        expect(rec.confidence).toBeGreaterThan(0.3); // Lower but still reasonable
      });
    });

    it('should provide cost-optimized recommendations', async () => {
      const technologies = [
        { name: 'python', category: 'language', confidence: 0.8, source: 'file_extension' },
        { name: 'mongodb', category: 'database', confidence: 0.7, source: 'config_file' }
      ];

      const requirements = {
        scale: 'medium',
        priority: 'cost',
        maxBudget: 200,
        organizationType: 'startup'
      };

      const recommendations = await service.generateRecommendations(technologies, requirements);

      // Cost-optimized should prefer cheaper options
      const topRecommendation = recommendations[0];
      expect(topRecommendation.estimatedCost.monthly).toBeLessThanOrEqual(200);

      // Should include cost optimization suggestions
      expect(topRecommendation.optimizations.some(opt => opt.type === 'cost')).toBe(true);

      // Should prefer serverless/managed services for cost efficiency
      const serverlessOrManaged = topRecommendation.services.filter(s => 
        s.type === 'serverless' || s.type === 'managed'
      );
      expect(serverlessOrManaged.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-provider comparison', () => {
    it('should provide meaningful differences between providers', async () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9, source: 'file_extension' },
        { name: 'react', category: 'framework', confidence: 0.8, source: 'package_file' }
      ];

      const requirements = { scale: 'medium', traffic: 'medium' };

      const recommendations = await service.generateRecommendations(technologies, requirements);

      const awsRec = recommendations.find(r => r.provider === 'aws');
      const azureRec = recommendations.find(r => r.provider === 'azure');
      const gcpRec = recommendations.find(r => r.provider === 'gcp');

      // Should have different service names
      expect(awsRec.services[0].name).not.toBe(azureRec.services[0].name);
      expect(azureRec.services[0].name).not.toBe(gcpRec.services[0].name);

      // Should have different cost structures
      expect(awsRec.estimatedCost.monthly).not.toBe(azureRec.estimatedCost.monthly);

      // Should have provider-specific reasoning
      expect(awsRec.reasoning).not.toEqual(azureRec.reasoning);
    });

    it('should rank providers appropriately based on requirements', async () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9, source: 'file_extension' }
      ];

      // Test cost priority
      const costPriorityReqs = { priority: 'cost', maxBudget: 100 };
      const costRecommendations = await service.generateRecommendations(technologies, costPriorityReqs);
      
      // Test performance priority
      const perfPriorityReqs = { priority: 'performance', maxBudget: 500 };
      const perfRecommendations = await service.generateRecommendations(technologies, perfPriorityReqs);

      // Should have different scores based on priority
      expect(costRecommendations[0].score).not.toBe(perfRecommendations[0].score);
      
      // Cost priority should favor lower cost options
      const costTopRec = costRecommendations[0];
      expect(costTopRec.estimatedCost.monthly).toBeLessThanOrEqual(100);
    });
  });

  describe('Scaling and cost projections', () => {
    it('should provide realistic scaling projections', async () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9, source: 'file_extension' }
      ];

      const requirements = { scale: 'small', traffic: 'low' };

      const recommendations = await service.generateRecommendations(technologies, requirements);

      recommendations.forEach(rec => {
        const projections = rec.estimatedCost.scalingProjections;
        expect(projections).toHaveLength(3); // 2x, 5x, 10x

        // Costs should increase with scale
        expect(projections[0].monthlyCost).toBeGreaterThan(rec.estimatedCost.monthly);
        expect(projections[1].monthlyCost).toBeGreaterThanOrEqual(projections[0].monthlyCost);
        expect(projections[2].monthlyCost).toBeGreaterThanOrEqual(projections[1].monthlyCost);

        // Should have efficiency metrics
        projections.forEach(proj => {
          expect(proj).toHaveProperty('efficiency');
          expect(proj.efficiency).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty technology array gracefully', async () => {
      const recommendations = await service.generateRecommendations([]);

      expect(recommendations).toHaveLength(3);
      recommendations.forEach(rec => {
        expect(rec.services).toBeDefined();
        expect(rec.estimatedCost).toBeDefined();
        expect(rec.confidence).toBeLessThan(0.5); // Low confidence expected
      });
    });

    it('should handle unknown technologies gracefully', async () => {
      const technologies = [
        { name: 'unknownlang', category: 'language', confidence: 0.5, source: 'file_extension' },
        { name: 'unknownframework', category: 'framework', confidence: 0.3, source: 'package_file' }
      ];

      const recommendations = await service.generateRecommendations(technologies);

      expect(recommendations).toHaveLength(3);
      recommendations.forEach(rec => {
        expect(rec.services).toBeDefined();
        expect(rec.confidence).toBeLessThan(0.6); // Lower confidence for unknown tech
      });
    });

    it('should handle extreme budget constraints', async () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9, source: 'file_extension' }
      ];

      const requirements = { maxBudget: 10 }; // Very low budget

      const recommendations = await service.generateRecommendations(technologies, requirements);

      recommendations.forEach(rec => {
        // Should still provide recommendations but with low scores
        expect(rec.services.length).toBeGreaterThan(0);
        expect(rec.score).toBeLessThan(0.8); // Lower score due to budget constraints
      });
    });
  });

  describe('Optimization suggestions', () => {
    it('should provide relevant optimization suggestions', async () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9, source: 'file_extension' },
        { name: 'postgresql', category: 'database', confidence: 0.8, source: 'config_file' }
      ];

      const requirements = { scale: 'medium' };

      const recommendations = await service.generateRecommendations(technologies, requirements);

      recommendations.forEach(rec => {
        expect(rec.optimizations).toBeInstanceOf(Array);
        
        if (rec.optimizations.length > 0) {
          rec.optimizations.forEach(opt => {
            expect(opt).toHaveProperty('type');
            expect(opt).toHaveProperty('title');
            expect(opt).toHaveProperty('description');
            expect(['cost', 'performance', 'reliability', 'security']).toContain(opt.type);
          });
        }
      });
    });
  });
});