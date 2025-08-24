/**
 * Architecture Recommendation Service
 * Generates cloud architecture recommendations based on detected technologies
 */

import { CloudServiceMappings } from './mappings/CloudServiceMappings.js';
import { CostCalculator } from './cost/CostCalculator.js';
import { RecommendationRanker } from './ranking/RecommendationRanker.js';

export class ArchitectureRecommendationService {
  constructor() {
    this.mappings = new CloudServiceMappings();
    this.costCalculator = new CostCalculator();
    this.ranker = new RecommendationRanker();
  }

  /**
   * Generate architecture recommendations for all cloud providers
   * @param {Array} technologies - Detected technologies with confidence scores
   * @param {Object} requirements - Additional requirements (scale, region, etc.)
   * @returns {Promise<Array>} Array of architecture recommendations
   */
  async generateRecommendations(technologies, requirements = {}) {
    try {
      const providers = ['aws', 'azure', 'gcp'];
      const recommendations = [];

      for (const provider of providers) {
        const recommendation = await this.generateProviderRecommendation(
          provider,
          technologies,
          requirements
        );
        recommendations.push(recommendation);
      }

      // Rank recommendations by cost-effectiveness and suitability
      return this.ranker.rankRecommendations(recommendations, requirements);
    } catch (error) {
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  /**
   * Generate recommendation for a specific cloud provider
   * @param {string} provider - Cloud provider (aws, azure, gcp)
   * @param {Array} technologies - Detected technologies
   * @param {Object} requirements - Additional requirements
   * @returns {Promise<Object>} Provider-specific recommendation
   */
  async generateProviderRecommendation(provider, technologies, requirements) {
    // Map technologies to cloud services
    const services = this.mappings.mapTechnologiesToServices(provider, technologies);
    
    // Apply optimization rules
    const optimizedServices = this.applyOptimizationRules(services, requirements);
    
    // Calculate costs
    const costEstimate = await this.costCalculator.calculateCosts(
      provider,
      optimizedServices,
      requirements
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(technologies, optimizedServices);

    return {
      id: `${provider}-${Date.now()}`,
      provider,
      services: optimizedServices,
      estimatedCost: costEstimate,
      reasoning,
      confidence: this.calculateConfidence(technologies, optimizedServices),
      optimizations: this.getOptimizationSuggestions(optimizedServices, requirements)
    };
  }

  /**
   * Apply cost optimization rules to service selection
   * @param {Array} services - Initial service recommendations
   * @param {Object} requirements - Requirements and constraints
   * @returns {Array} Optimized service list
   */
  applyOptimizationRules(services, requirements) {
    let optimizedServices = [...services];

    // Rule 1: Prefer managed services for operational efficiency
    optimizedServices = this.preferManagedServices(optimizedServices);

    // Rule 2: Suggest serverless for variable/low traffic
    if (requirements.traffic === 'variable' || requirements.traffic === 'low') {
      optimizedServices = this.suggestServerlessOptions(optimizedServices);
    }

    // Rule 3: Consider reserved instances for predictable workloads
    if (requirements.workload === 'predictable') {
      optimizedServices = this.addReservedInstanceOptions(optimizedServices);
    }

    // Rule 4: Optimize for region-specific services
    if (requirements.region) {
      optimizedServices = this.optimizeForRegion(optimizedServices, requirements.region);
    }

    return optimizedServices;
  }

  /**
   * Prefer managed services over self-managed alternatives
   */
  preferManagedServices(services) {
    return services.map(service => {
      const managedAlternative = this.mappings.getManagedAlternative(service);
      return managedAlternative || service;
    });
  }

  /**
   * Suggest serverless alternatives where applicable
   */
  suggestServerlessOptions(services) {
    return services.map(service => {
      if (service.category === 'compute' && service.serverlessAlternative) {
        return {
          ...service,
          name: service.serverlessAlternative,
          type: 'serverless',
          costOptimization: 'Pay-per-use pricing for variable workloads'
        };
      }
      return service;
    });
  }

  /**
   * Add reserved instance recommendations for cost savings
   */
  addReservedInstanceOptions(services) {
    return services.map(service => {
      if (service.category === 'compute') {
        return {
          ...service,
          supportsReservedInstances: true,
          reservedInstanceOption: {
            savings: '30-60% cost reduction',
            commitment: '1-3 years',
            recommendation: 'Recommended for predictable workloads'
          }
        };
      }
      return service;
    });
  }

  /**
   * Optimize service selection for specific regions
   */
  optimizeForRegion(services, region) {
    return services.map(service => {
      const regionalOptimization = this.mappings.getRegionalOptimization(service, region);
      return regionalOptimization ? { ...service, ...regionalOptimization } : service;
    });
  }

  /**
   * Generate human-readable reasoning for recommendations
   */
  generateReasoning(technologies, services) {
    const reasoning = [];

    // Technology-based reasoning
    technologies.forEach(tech => {
      const relatedServices = services.filter(service => 
        service.supportedTechnologies?.includes(tech.name)
      );
      
      if (relatedServices.length > 0) {
        reasoning.push(
          `${tech.name} detected - recommended ${relatedServices.map(s => s.name).join(', ')} for optimal compatibility`
        );
      }
    });

    // Architecture pattern reasoning
    const hasDatabase = technologies.some(tech => tech.category === 'database');
    const hasWebFramework = technologies.some(tech => tech.category === 'framework');
    
    if (hasDatabase && hasWebFramework) {
      reasoning.push('Web application with database detected - recommended managed database service for reliability and scalability');
    }

    return reasoning;
  }

  /**
   * Calculate confidence score for recommendations
   */
  calculateConfidence(technologies, services) {
    if (technologies.length === 0) {
      return services.length > 0 ? 0.3 : 0.1;
    }
    
    const techConfidenceSum = technologies.reduce((sum, tech) => sum + tech.confidence, 0);
    const avgTechConfidence = techConfidenceSum / technologies.length;
    
    const serviceMatchScore = services.length > 0 ? 0.8 : 0.3;
    
    return Math.min(avgTechConfidence * serviceMatchScore, 1.0);
  }

  /**
   * Get optimization suggestions for the architecture
   */
  getOptimizationSuggestions(services, requirements) {
    const suggestions = [];

    // Cost optimization suggestions
    const computeServices = services.filter(s => s.category === 'compute');
    if (computeServices.length > 0) {
      suggestions.push({
        type: 'cost',
        title: 'Consider Auto Scaling',
        description: 'Implement auto scaling to optimize costs during low traffic periods',
        potentialSavings: '20-40%'
      });
    }

    // Performance optimization suggestions
    const databaseServices = services.filter(s => s.category === 'database');
    if (databaseServices.length > 0) {
      suggestions.push({
        type: 'performance',
        title: 'Add Caching Layer',
        description: 'Implement caching to reduce database load and improve response times',
        benefit: 'Improved performance and reduced database costs'
      });
    }

    return suggestions;
  }
}