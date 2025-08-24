/**
 * Tests for CostCalculator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CostCalculator } from '../cost/CostCalculator.js';

describe('CostCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new CostCalculator();
  });

  describe('calculateCosts', () => {
    it('should calculate costs for AWS Lambda service', async () => {
      const services = [
        {
          name: 'Lambda',
          category: 'compute',
          type: 'serverless'
        }
      ];
      const requirements = { scale: 'medium', traffic: 'medium' };

      const result = await calculator.calculateCosts('aws', services, requirements);

      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('scalingProjections');
      expect(result).toHaveProperty('currency', 'USD');
      expect(result).toHaveProperty('assumptions');
      expect(result.monthly).toBeGreaterThan(0);
      expect(result.breakdown.Lambda).toBeDefined();
    });

    it('should calculate costs for managed services', async () => {
      const services = [
        {
          name: 'RDS PostgreSQL',
          category: 'database',
          type: 'managed'
        }
      ];
      const requirements = { scale: 'small' };

      const result = await calculator.calculateCosts('aws', services, requirements);

      expect(result.monthly).toBeGreaterThan(0);
      expect(result.breakdown['RDS PostgreSQL']).toBeDefined();
      expect(result.breakdown['RDS PostgreSQL'].breakdown).toHaveProperty('baseService');
    });

    it('should handle multiple services', async () => {
      const services = [
        { name: 'Lambda', category: 'compute', type: 'serverless' },
        { name: 'RDS PostgreSQL', category: 'database', type: 'managed' }
      ];

      const result = await calculator.calculateCosts('aws', services);

      expect(Object.keys(result.breakdown)).toHaveLength(2);
      expect(result.breakdown.Lambda).toBeDefined();
      expect(result.breakdown['RDS PostgreSQL']).toBeDefined();
    });

    it('should include scaling projections', async () => {
      const services = [
        { name: 'Lambda', category: 'compute', type: 'serverless' }
      ];

      const result = await calculator.calculateCosts('aws', services);

      expect(result.scalingProjections).toBeInstanceOf(Array);
      expect(result.scalingProjections).toHaveLength(3); // 2x, 5x, 10x
      expect(result.scalingProjections[0]).toHaveProperty('scale', '2x');
      expect(result.scalingProjections[0]).toHaveProperty('monthlyCost');
      expect(result.scalingProjections[0]).toHaveProperty('costIncrease');
      expect(result.scalingProjections[0]).toHaveProperty('efficiency');
    });

    it('should handle different regions', async () => {
      const services = [
        { name: 'Lambda', category: 'compute', type: 'serverless' }
      ];
      const requirements = { region: 'eu-west-1' };

      const result = await calculator.calculateCosts('aws', services, requirements);

      expect(result.region).toBe('eu-west-1');
    });

    it('should throw error on calculation failure', async () => {
      // Mock a scenario that would cause calculation to fail
      const invalidServices = null;

      await expect(
        calculator.calculateCosts('aws', invalidServices)
      ).rejects.toThrow('Cost calculation failed');
    });
  });

  describe('calculateServiceCost', () => {
    it('should calculate serverless service cost correctly', () => {
      const service = {
        name: 'Lambda',
        category: 'compute',
        type: 'serverless'
      };
      const requirements = { scale: 'medium' };

      const result = calculator.calculateServiceCost('aws', service, requirements);

      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('executions');
      expect(result.breakdown).toHaveProperty('computeTime');
      expect(result.monthly).toBeGreaterThan(0);
    });

    it('should calculate managed service cost correctly', () => {
      const service = {
        name: 'RDS PostgreSQL',
        category: 'database',
        type: 'managed'
      };
      const requirements = { scale: 'small' };

      const result = calculator.calculateServiceCost('aws', service, requirements);

      expect(result.monthly).toBeGreaterThan(0);
      expect(result.breakdown).toHaveProperty('baseService');
      expect(result.breakdown).toHaveProperty('usage');
    });

    it('should apply reserved instance discounts', () => {
      const service = {
        name: 'EC2',
        category: 'compute',
        type: 'traditional',
        reservedInstanceOption: true
      };
      const requirements = { commitment: '1year' };

      const result = calculator.calculateServiceCost('aws', service, requirements);

      expect(result.breakdown).toHaveProperty('reservedInstanceSavings');
    });
  });

  describe('estimateUsage', () => {
    it('should estimate usage for small scale', () => {
      const service = { name: 'Lambda', category: 'compute' };
      const requirements = { scale: 'small', traffic: 'low' };

      const usage = calculator.estimateUsage(service, requirements);

      expect(usage).toHaveProperty('hours');
      expect(usage).toHaveProperty('executions');
      expect(usage).toHaveProperty('storageGB');
      expect(usage.hours).toBeLessThan(200); // Small scale with low traffic
    });

    it('should estimate higher usage for large scale', () => {
      const service = { name: 'Lambda', category: 'compute' };
      const requirements = { scale: 'large', traffic: 'high' };

      const usage = calculator.estimateUsage(service, requirements);

      expect(usage.hours).toBeGreaterThan(1000); // Large scale with high traffic
      expect(usage.executions).toBeGreaterThan(100000);
    });

    it('should handle variable traffic patterns', () => {
      const service = { name: 'Lambda', category: 'compute' };
      const requirements = { scale: 'medium', traffic: 'variable' };

      const usage = calculator.estimateUsage(service, requirements);

      // Variable traffic should be between low and medium
      expect(usage.hours).toBeGreaterThan(100);
      expect(usage.hours).toBeLessThan(400);
    });
  });

  describe('calculateScalingProjections', () => {
    it('should calculate scaling projections correctly', () => {
      const services = [
        { name: 'Lambda', category: 'compute', type: 'serverless' }
      ];
      const requirements = { scale: 'medium' };
      const baseCost = 100;

      const projections = calculator.calculateScalingProjections(
        'aws',
        services,
        requirements,
        baseCost
      );

      expect(projections).toHaveLength(3);
      expect(projections[0].scale).toBe('2x');
      expect(projections[1].scale).toBe('5x');
      expect(projections[2].scale).toBe('10x');
      
      // Costs should increase with scale
      expect(projections[0].monthlyCost).toBeGreaterThan(baseCost);
      expect(projections[1].monthlyCost).toBeGreaterThan(projections[0].monthlyCost);
      expect(projections[2].monthlyCost).toBeGreaterThan(projections[1].monthlyCost);
    });

    it('should calculate efficiency metrics', () => {
      const services = [
        { name: 'Lambda', category: 'compute', type: 'serverless' }
      ];
      const projections = calculator.calculateScalingProjections(
        'aws',
        services,
        {},
        100
      );

      projections.forEach(projection => {
        expect(projection).toHaveProperty('efficiency');
        expect(projection.efficiency).toBeGreaterThan(0);
        expect(projection.efficiency).toBeLessThanOrEqual(2); // Reasonable efficiency range
      });
    });
  });

  describe('getPricingForService', () => {
    it('should return AWS Lambda pricing', () => {
      const service = { name: 'Lambda', category: 'compute' };
      const pricing = calculator.getPricingForService('aws', service);

      expect(pricing).toHaveProperty('perExecution');
      expect(pricing).toHaveProperty('perComputeSecond');
      expect(pricing.perExecution).toBeGreaterThan(0);
    });

    it('should return default pricing for unknown service', () => {
      const service = { name: 'UnknownService', category: 'unknown' };
      const pricing = calculator.getPricingForService('aws', service);

      expect(pricing).toHaveProperty('perHour', 0.10);
      expect(pricing).toHaveProperty('perExecution');
    });

    it('should handle different providers', () => {
      const service = { name: 'Functions', category: 'compute' };
      
      const awsPricing = calculator.getPricingForService('aws', service);
      const azurePricing = calculator.getPricingForService('azure', service);
      const gcpPricing = calculator.getPricingForService('gcp', service);

      expect(awsPricing).toBeDefined();
      expect(azurePricing).toBeDefined();
      expect(gcpPricing).toBeDefined();
    });
  });

  describe('cost calculation accuracy', () => {
    it('should produce reasonable costs for typical workloads', async () => {
      const services = [
        { name: 'Lambda', category: 'compute', type: 'serverless' },
        { name: 'RDS PostgreSQL', category: 'database', type: 'managed' }
      ];
      const requirements = { scale: 'medium', traffic: 'medium' };

      const result = await calculator.calculateCosts('aws', services, requirements);

      // Typical medium workload should be in reasonable range
      expect(result.monthly).toBeGreaterThan(10);
      expect(result.monthly).toBeLessThan(1000);
    });

    it('should show cost increases with scale', async () => {
      const services = [
        { name: 'Lambda', category: 'compute', type: 'serverless' }
      ];

      const smallResult = await calculator.calculateCosts('aws', services, { scale: 'small' });
      const largeResult = await calculator.calculateCosts('aws', services, { scale: 'large' });

      expect(largeResult.monthly).toBeGreaterThan(smallResult.monthly);
    });
  });

  describe('getCostAssumptions', () => {
    it('should return relevant cost assumptions', () => {
      const requirements = { region: 'us-west-2' };
      const assumptions = calculator.getCostAssumptions(requirements);

      expect(assumptions).toBeInstanceOf(Array);
      expect(assumptions.length).toBeGreaterThan(0);
      expect(assumptions.some(a => a.includes('us-west-2'))).toBe(true);
    });

    it('should include standard assumptions', () => {
      const assumptions = calculator.getCostAssumptions({});

      expect(assumptions.some(a => a.includes('estimates'))).toBe(true);
      expect(assumptions.some(a => a.includes('subject to change'))).toBe(true);
    });
  });
});