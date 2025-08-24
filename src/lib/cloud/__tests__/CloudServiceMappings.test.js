/**
 * Tests for CloudServiceMappings
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CloudServiceMappings } from '../mappings/CloudServiceMappings.js';

describe('CloudServiceMappings', () => {
  let mappings;

  beforeEach(() => {
    mappings = new CloudServiceMappings();
  });

  describe('mapTechnologiesToServices', () => {
    it('should map JavaScript to appropriate AWS services', () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9 }
      ];

      const services = mappings.mapTechnologiesToServices('aws', technologies);

      expect(services).toHaveLength(2); // Lambda and App Runner
      expect(services[0]).toHaveProperty('name', 'Lambda');
      expect(services[0]).toHaveProperty('category', 'compute');
      expect(services[0]).toHaveProperty('type', 'serverless');
      expect(services[0].supportedTechnologies).toContain('javascript');
      expect(services[0].confidence).toBe(0.9);
    });

    it('should map React to hosting services', () => {
      const technologies = [
        { name: 'react', category: 'framework', confidence: 0.8 }
      ];

      const services = mappings.mapTechnologiesToServices('aws', technologies);

      expect(services.length).toBeGreaterThan(0);
      expect(services.some(s => s.name === 'S3 + CloudFront')).toBe(true);
      expect(services.some(s => s.category === 'hosting')).toBe(true);
    });

    it('should map PostgreSQL to database services', () => {
      const technologies = [
        { name: 'postgresql', category: 'database', confidence: 0.9 }
      ];

      const services = mappings.mapTechnologiesToServices('aws', technologies);

      expect(services.length).toBeGreaterThan(0);
      expect(services.some(s => s.name === 'RDS PostgreSQL')).toBe(true);
      expect(services.some(s => s.category === 'database')).toBe(true);
    });

    it('should handle multiple technologies', () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9 },
        { name: 'react', category: 'framework', confidence: 0.8 },
        { name: 'postgresql', category: 'database', confidence: 0.7 }
      ];

      const services = mappings.mapTechnologiesToServices('aws', technologies);

      expect(services.length).toBeGreaterThan(3);
      expect(services.some(s => s.category === 'compute')).toBe(true);
      expect(services.some(s => s.category === 'hosting')).toBe(true);
      expect(services.some(s => s.category === 'database')).toBe(true);
    });

    it('should consolidate duplicate services', () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9 },
        { name: 'javascript', category: 'language', confidence: 0.8 } // Duplicate
      ];

      const services = mappings.mapTechnologiesToServices('aws', technologies);

      // Should not have duplicate Lambda services
      const lambdaServices = services.filter(s => s.name === 'Lambda');
      expect(lambdaServices).toHaveLength(1);
      expect(lambdaServices[0].confidence).toBe(0.9); // Should use higher confidence
    });

    it('should work with different providers', () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9 }
      ];

      const awsServices = mappings.mapTechnologiesToServices('aws', technologies);
      const azureServices = mappings.mapTechnologiesToServices('azure', technologies);
      const gcpServices = mappings.mapTechnologiesToServices('gcp', technologies);

      expect(awsServices.some(s => s.name === 'Lambda')).toBe(true);
      expect(azureServices.some(s => s.name === 'Functions')).toBe(true);
      expect(gcpServices.some(s => s.name === 'Cloud Functions')).toBe(true);
    });

    it('should handle unknown technologies gracefully', () => {
      const technologies = [
        { name: 'unknowntech', category: 'language', confidence: 0.5 }
      ];

      const services = mappings.mapTechnologiesToServices('aws', technologies);

      expect(services).toHaveLength(0);
    });

    it('should handle empty technologies array', () => {
      const services = mappings.mapTechnologiesToServices('aws', []);

      expect(services).toHaveLength(0);
    });
  });

  describe('getServiceMappings', () => {
    it('should return correct mappings for known technology', () => {
      const technology = { name: 'javascript', category: 'language' };
      const awsMappings = mappings.getServiceMappings('aws', technology);

      expect(awsMappings).toBeInstanceOf(Array);
      expect(awsMappings.length).toBeGreaterThan(0);
      expect(awsMappings[0]).toHaveProperty('name');
      expect(awsMappings[0]).toHaveProperty('category');
    });

    it('should return empty array for unknown technology', () => {
      const technology = { name: 'unknowntech', category: 'language' };
      const mappings_result = mappings.getServiceMappings('aws', technology);

      expect(mappings_result).toEqual([]);
    });

    it('should return empty array for unknown provider', () => {
      const technology = { name: 'javascript', category: 'language' };
      const mappings_result = mappings.getServiceMappings('unknownprovider', technology);

      expect(mappings_result).toEqual([]);
    });
  });

  describe('getManagedAlternative', () => {
    it('should return managed alternative for EC2', () => {
      const service = { name: 'EC2', category: 'compute' };
      const alternative = mappings.getManagedAlternative(service);

      expect(alternative).toHaveProperty('name', 'Elastic Beanstalk');
      expect(alternative).toHaveProperty('type', 'managed');
    });

    it('should return null for services without alternatives', () => {
      const service = { name: 'Lambda', category: 'compute' };
      const alternative = mappings.getManagedAlternative(service);

      expect(alternative).toBeNull();
    });
  });

  describe('service mapping completeness', () => {
    it('should have mappings for all major languages', () => {
      const languages = ['javascript', 'python'];
      
      languages.forEach(lang => {
        const tech = { name: lang, category: 'language' };
        const awsServices = mappings.getServiceMappings('aws', tech);
        const azureServices = mappings.getServiceMappings('azure', tech);
        const gcpServices = mappings.getServiceMappings('gcp', tech);

        expect(awsServices.length).toBeGreaterThan(0);
        expect(azureServices.length).toBeGreaterThan(0);
        expect(gcpServices.length).toBeGreaterThan(0);
      });
    });

    it('should have mappings for major frameworks', () => {
      const frameworks = ['react', 'nextjs'];
      
      frameworks.forEach(framework => {
        const tech = { name: framework, category: 'framework' };
        const awsServices = mappings.getServiceMappings('aws', tech);

        expect(awsServices.length).toBeGreaterThan(0);
      });
    });

    it('should have mappings for major databases', () => {
      const databases = ['postgresql', 'mongodb'];
      
      databases.forEach(db => {
        const tech = { name: db, category: 'database' };
        const awsServices = mappings.getServiceMappings('aws', tech);
        const azureServices = mappings.getServiceMappings('azure', tech);
        const gcpServices = mappings.getServiceMappings('gcp', tech);

        expect(awsServices.length).toBeGreaterThan(0);
        expect(azureServices.length).toBeGreaterThan(0);
        expect(gcpServices.length).toBeGreaterThan(0);
      });
    });
  });

  describe('service properties validation', () => {
    it('should ensure all services have required properties', () => {
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9 }
      ];

      const services = mappings.mapTechnologiesToServices('aws', technologies);

      services.forEach(service => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('category');
        expect(service).toHaveProperty('purpose');
        expect(service).toHaveProperty('alternatives');
        expect(service).toHaveProperty('costFactors');
        expect(service.alternatives).toBeInstanceOf(Array);
        expect(service.costFactors).toBeInstanceOf(Array);
      });
    });

    it('should have consistent service types', () => {
      const validTypes = ['serverless', 'managed', 'traditional'];
      const technologies = [
        { name: 'javascript', category: 'language', confidence: 0.9 }
      ];

      const services = mappings.mapTechnologiesToServices('aws', technologies);

      services.forEach(service => {
        if (service.type) {
          expect(validTypes).toContain(service.type);
        }
      });
    });
  });
});