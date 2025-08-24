/**
 * Tests for RecommendationRanker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationRanker } from '../ranking/RecommendationRanker.js';

describe('RecommendationRanker', () => {
  let ranker;
  let mockRecommendations;

  beforeEach(() => {
    ranker = new RecommendationRanker();
    mockRecommendations = [
      {
        id: 'aws-1',
        provider: 'aws',
        services: [
          { name: 'Lambda', category: 'compute', type: 'serverless' },
          { name: 'RDS PostgreSQL', category: 'database', type: 'managed' }
        ],
        estimatedCost: {
          monthly: 150,
          scalingProjections: [
            { scale: '2x', efficiency: 0.8 },
            { scale: '5x', efficiency: 0.7 }
          ]
        },
        confidence: 0.9
      },
      {
        id: 'azure-1',
        provider: 'azure',
        services: [
          { name: 'Functions', category: 'compute', type: 'serverless' },
          { name: 'Database for PostgreSQL', category: 'database', type: 'managed' }
        ],
        estimatedCost: {
          monthly: 200,
          scalingProjections: [
            { scale: '2x', efficiency: 0.9 },
            { scale: '5x', efficiency: 0.8 }
          ]
        },
        confidence: 0.8
      },
      {
        id: 'gcp-1',
        provider: 'gcp',
        services: [
          { name: 'Cloud Functions', category: 'compute', type: 'serverless' },
          { name: 'Cloud SQL PostgreSQL', category: 'database', type: 'managed' }
        ],
        estimatedCost: {
          monthly: 120,
          scalingProjections: [
            { scale: '2x', efficiency: 0.85 },
            { scale: '5x', efficiency: 0.75 }
          ]
        },
        confidence: 0.85
      }
    ];
  });

  describe('rankRecommendations', () => {
    it('should rank recommendations and add scores', () => {
      const requirements = { maxBudget: 300, priority: 'cost' };
      
      const ranked = ranker.rankRecommendations(mockRecommendations, requirements);

      expect(ranked).toHaveLength(3);
      expect(ranked[0]).toHaveProperty('score');
      expect(ranked[0]).toHaveProperty('scoreBreakdown');
      
      // Should be sorted by score (highest first)
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
      expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
    });

    it('should prioritize cost when cost priority is set', () => {
      const requirements = { maxBudget: 300, priority: 'cost' };
      
      const ranked = ranker.rankRecommendations(mockRecommendations, requirements);

      // Should rank by overall score, with cost being heavily weighted
      expect(ranked[0]).toHaveProperty('score');
      expect(ranked[0].scoreBreakdown.cost.weight).toBeGreaterThan(0.3);
      
      // The lowest cost option should score well on cost
      const gcpRec = ranked.find(r => r.provider === 'gcp');
      expect(gcpRec.scoreBreakdown.cost.score).toBeGreaterThan(0.8);
    });

    it('should handle performance priority', () => {
      const requirements = { priority: 'performance' };
      
      const ranked = ranker.rankRecommendations(mockRecommendations, requirements);

      expect(ranked[0]).toHaveProperty('score');
      expect(ranked[0].scoreBreakdown.performance.weight).toBeGreaterThan(0.3);
    });

    it('should handle empty recommendations array', () => {
      const ranked = ranker.rankRecommendations([]);

      expect(ranked).toHaveLength(0);
    });

    it('should throw error on ranking failure', () => {
      const invalidRecommendations = [{ invalid: 'data' }];

      expect(() => {
        ranker.rankRecommendations(invalidRecommendations);
      }).toThrow('Ranking failed');
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate score between 0 and 1', () => {
      const recommendation = mockRecommendations[0];
      const requirements = { maxBudget: 200 };

      const score = ranker.calculateOverallScore(recommendation, requirements);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should weight scores according to requirements', () => {
      const recommendation = mockRecommendations[0];
      
      const costPriorityScore = ranker.calculateOverallScore(
        recommendation, 
        { priority: 'cost', maxBudget: 200 }
      );
      
      const performancePriorityScore = ranker.calculateOverallScore(
        recommendation, 
        { priority: 'performance' }
      );

      // Scores should be different based on priority
      expect(costPriorityScore).not.toBe(performancePriorityScore);
    });
  });

  describe('calculateCostScore', () => {
    it('should give high score for low cost within budget', () => {
      const recommendation = { estimatedCost: { monthly: 50 } };
      const requirements = { maxBudget: 200 };

      const score = ranker.calculateCostScore(recommendation, requirements);

      expect(score).toBeGreaterThan(0.8);
    });

    it('should give lower score for high cost', () => {
      const recommendation = { estimatedCost: { monthly: 500 } };
      const requirements = { maxBudget: 200 };

      const score = ranker.calculateCostScore(recommendation, requirements);

      expect(score).toBeLessThan(0.5);
    });

    it('should handle missing budget gracefully', () => {
      const recommendation = { estimatedCost: { monthly: 100 } };
      const requirements = {};

      const score = ranker.calculateCostScore(recommendation, requirements);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should give bonus for managed services', () => {
      const managedRecommendation = {
        services: [
          { name: 'RDS', type: 'managed' },
          { name: 'Lambda', type: 'managed' }
        ]
      };
      
      const traditionalRecommendation = {
        services: [
          { name: 'EC2', type: 'traditional' },
          { name: 'Self-managed DB', type: 'traditional' }
        ]
      };

      const managedScore = ranker.calculatePerformanceScore(managedRecommendation, {});
      const traditionalScore = ranker.calculatePerformanceScore(traditionalRecommendation, {});

      expect(managedScore).toBeGreaterThan(traditionalScore);
    });

    it('should give bonus for CDN services', () => {
      const withCDN = {
        services: [
          { name: 'CloudFront', category: 'hosting' },
          { name: 'Lambda', category: 'compute' }
        ]
      };
      
      const withoutCDN = {
        services: [
          { name: 'EC2', category: 'compute' }
        ]
      };

      const cdnScore = ranker.calculatePerformanceScore(withCDN, {});
      const noCdnScore = ranker.calculatePerformanceScore(withoutCDN, {});

      expect(cdnScore).toBeGreaterThan(noCdnScore);
    });

    it('should adjust for high performance requirements', () => {
      const serverlessRecommendation = {
        services: [{ name: 'Lambda', type: 'serverless' }]
      };

      const highPerfScore = ranker.calculatePerformanceScore(
        serverlessRecommendation, 
        { performance: 'high' }
      );
      
      const normalScore = ranker.calculatePerformanceScore(
        serverlessRecommendation, 
        {}
      );

      expect(normalScore).toBeGreaterThan(highPerfScore); // Serverless penalized for high perf
    });
  });

  describe('calculateReliabilityScore', () => {
    it('should favor managed services for reliability', () => {
      const managedRecommendation = {
        services: [{ name: 'RDS', type: 'managed' }]
      };
      
      const traditionalRecommendation = {
        services: [{ name: 'EC2', type: 'traditional' }]
      };

      const managedScore = ranker.calculateReliabilityScore(managedRecommendation, {});
      const traditionalScore = ranker.calculateReliabilityScore(traditionalRecommendation, {});

      expect(managedScore).toBeGreaterThan(traditionalScore);
    });

    it('should give bonus for high availability services', () => {
      const haRecommendation = {
        services: [{ name: 'Aurora', category: 'database' }]
      };
      
      const standardRecommendation = {
        services: [{ name: 'Standard DB', category: 'database' }]
      };

      const haScore = ranker.calculateReliabilityScore(haRecommendation, {});
      const standardScore = ranker.calculateReliabilityScore(standardRecommendation, {});

      expect(haScore).toBeGreaterThan(standardScore);
    });

    it('should give provider-based reliability bonus', () => {
      const awsRecommendation = { provider: 'aws', services: [] };
      const unknownRecommendation = { provider: 'unknown', services: [] };

      const awsScore = ranker.calculateReliabilityScore(awsRecommendation, {});
      const unknownScore = ranker.calculateReliabilityScore(unknownRecommendation, {});

      expect(awsScore).toBeGreaterThan(0.6); // AWS should get base + bonus
      expect(unknownScore).toBe(0.6); // Unknown should get just base score
      expect(awsScore).toBeGreaterThan(unknownScore);
    });
  });

  describe('calculateSimplicityScore', () => {
    it('should favor fewer services', () => {
      const simpleRecommendation = {
        services: [
          { name: 'Lambda', type: 'serverless' }
        ]
      };
      
      const complexRecommendation = {
        services: [
          { name: 'EC2', type: 'traditional' },
          { name: 'RDS', type: 'managed' },
          { name: 'ElastiCache', type: 'managed' },
          { name: 'CloudFront', type: 'managed' },
          { name: 'S3', type: 'managed' },
          { name: 'Lambda', type: 'serverless' }
        ]
      };

      const simpleScore = ranker.calculateSimplicityScore(simpleRecommendation, {});
      const complexScore = ranker.calculateSimplicityScore(complexRecommendation, {});

      expect(simpleScore).toBeGreaterThan(complexScore);
    });

    it('should favor managed and serverless services', () => {
      const managedRecommendation = {
        services: [
          { name: 'Lambda', type: 'serverless' },
          { name: 'RDS', type: 'managed' }
        ]
      };
      
      const traditionalRecommendation = {
        services: [
          { name: 'EC2', type: 'traditional' },
          { name: 'Self-managed DB', type: 'traditional' }
        ]
      };

      const managedScore = ranker.calculateSimplicityScore(managedRecommendation, {});
      const traditionalScore = ranker.calculateSimplicityScore(traditionalRecommendation, {});

      expect(managedScore).toBeGreaterThan(traditionalScore);
    });
  });

  describe('calculateScalabilityScore', () => {
    it('should favor serverless for scalability', () => {
      const serverlessRecommendation = {
        services: [{ name: 'Lambda', type: 'serverless' }],
        estimatedCost: { scalingProjections: [] }
      };
      
      const traditionalRecommendation = {
        services: [{ name: 'EC2', type: 'traditional' }],
        estimatedCost: { scalingProjections: [] }
      };

      const serverlessScore = ranker.calculateScalabilityScore(serverlessRecommendation, {});
      const traditionalScore = ranker.calculateScalabilityScore(traditionalRecommendation, {});

      expect(serverlessScore).toBeGreaterThan(traditionalScore);
    });

    it('should consider scaling efficiency', () => {
      const efficientRecommendation = {
        services: [{ name: 'Lambda', type: 'serverless' }],
        estimatedCost: {
          scalingProjections: [
            { efficiency: 0.8 },
            { efficiency: 0.7 }
          ]
        }
      };
      
      const inefficientRecommendation = {
        services: [{ name: 'EC2', type: 'traditional' }],
        estimatedCost: {
          scalingProjections: [
            { efficiency: 1.2 },
            { efficiency: 1.5 }
          ]
        }
      };

      const efficientScore = ranker.calculateScalabilityScore(efficientRecommendation, {});
      const inefficientScore = ranker.calculateScalabilityScore(inefficientRecommendation, {});

      expect(efficientScore).toBeGreaterThan(inefficientScore);
    });

    it('should adjust for high growth expectations', () => {
      const serverlessRecommendation = {
        services: [{ name: 'Lambda', type: 'serverless' }],
        estimatedCost: { scalingProjections: [] }
      };

      const highGrowthScore = ranker.calculateScalabilityScore(
        serverlessRecommendation, 
        { expectedGrowth: 'high' }
      );
      
      const normalScore = ranker.calculateScalabilityScore(
        serverlessRecommendation, 
        {}
      );

      expect(highGrowthScore).toBeGreaterThan(normalScore);
    });
  });

  describe('getWeightsForRequirements', () => {
    it('should adjust weights for cost priority', () => {
      const weights = ranker.getWeightsForRequirements({ priority: 'cost' });

      expect(weights.cost).toBeGreaterThan(0.3);
      expect(weights.performance).toBeLessThan(0.2);
    });

    it('should adjust weights for performance priority', () => {
      const weights = ranker.getWeightsForRequirements({ priority: 'performance' });

      expect(weights.performance).toBeGreaterThan(0.3);
      expect(weights.cost).toBeLessThan(0.2);
    });

    it('should adjust weights for startup organization', () => {
      const weights = ranker.getWeightsForRequirements({ organizationType: 'startup' });

      expect(weights.cost).toBeGreaterThan(0.25);
      expect(weights.simplicity).toBeGreaterThan(0.2);
    });

    it('should adjust weights for enterprise organization', () => {
      const weights = ranker.getWeightsForRequirements({ organizationType: 'enterprise' });

      expect(weights.reliability).toBeGreaterThan(0.25);
      expect(weights.performance).toBeGreaterThan(0.2);
    });

    it('should normalize weights to sum to 1', () => {
      const weights = ranker.getWeightsForRequirements({ priority: 'cost' });
      const sum = Object.values(weights).reduce((total, weight) => total + weight, 0);

      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe('getScoreBreakdown', () => {
    it('should provide detailed score breakdown', () => {
      const recommendation = mockRecommendations[0];
      const requirements = { maxBudget: 200 };

      const breakdown = ranker.getScoreBreakdown(recommendation, requirements);

      expect(breakdown).toHaveProperty('cost');
      expect(breakdown).toHaveProperty('performance');
      expect(breakdown).toHaveProperty('reliability');
      expect(breakdown).toHaveProperty('simplicity');
      expect(breakdown).toHaveProperty('scalability');

      Object.values(breakdown).forEach(category => {
        expect(category).toHaveProperty('score');
        expect(category).toHaveProperty('weight');
        expect(category).toHaveProperty('contribution');
        expect(category.score).toBeGreaterThanOrEqual(0);
        expect(category.score).toBeLessThanOrEqual(1);
      });
    });

    it('should have contributions that sum to overall score', () => {
      const recommendation = mockRecommendations[0];
      const requirements = { maxBudget: 200 };

      const overallScore = ranker.calculateOverallScore(recommendation, requirements);
      const breakdown = ranker.getScoreBreakdown(recommendation, requirements);

      const totalContribution = Object.values(breakdown)
        .reduce((sum, category) => sum + category.contribution, 0);

      expect(totalContribution).toBeCloseTo(overallScore, 5);
    });
  });
});