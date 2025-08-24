/**
 * Cost Calculator
 * Calculates estimated costs for cloud services across providers
 */

export class CostCalculator {
  constructor() {
    this.pricingData = this.initializePricingData();
    this.scalingFactors = this.initializeScalingFactors();
  }

  /**
   * Calculate costs for a set of cloud services
   * @param {string} provider - Cloud provider
   * @param {Array} services - List of recommended services
   * @param {Object} requirements - Scaling and usage requirements
   * @returns {Promise<Object>} Cost estimate with breakdown
   */
  async calculateCosts(provider, services, requirements = {}) {
    try {
      const breakdown = {};
      let totalMonthlyCost = 0;

      for (const service of services) {
        const serviceCost = this.calculateServiceCost(provider, service, requirements);
        breakdown[service.name] = serviceCost;
        totalMonthlyCost += serviceCost.monthly;
      }

      const scalingProjections = this.calculateScalingProjections(
        provider,
        services,
        requirements,
        totalMonthlyCost
      );

      return {
        monthly: Math.round(totalMonthlyCost * 100) / 100,
        breakdown,
        scalingProjections,
        currency: 'USD',
        region: requirements.region || 'us-east-1',
        assumptions: this.getCostAssumptions(requirements)
      };
    } catch (error) {
      throw new Error(`Cost calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate cost for a specific service
   */
  calculateServiceCost(provider, service, requirements) {
    const pricing = this.getPricingForService(provider, service);
    const usage = this.estimateUsage(service, requirements);
    
    let monthlyCost = 0;
    const costBreakdown = {};

    // Calculate cost based on service type and pricing model
    switch (service.type) {
      case 'serverless':
        monthlyCost = this.calculateServerlessCost(pricing, usage);
        costBreakdown.executions = usage.executions * pricing.perExecution;
        costBreakdown.computeTime = usage.computeTime * pricing.perComputeSecond;
        break;
        
      case 'managed':
        monthlyCost = this.calculateManagedServiceCost(pricing, usage);
        costBreakdown.baseService = pricing.basePrice;
        costBreakdown.usage = usage.hours * pricing.perHour;
        break;
        
      default:
        monthlyCost = this.calculateDefaultCost(pricing, usage);
        costBreakdown.compute = usage.hours * pricing.perHour;
    }

    // Apply reserved instance discounts if applicable
    if (service.reservedInstanceOption && requirements.commitment) {
      const discount = this.getReservedInstanceDiscount(service, requirements.commitment);
      monthlyCost *= (1 - discount);
      costBreakdown.reservedInstanceSavings = monthlyCost * discount;
    }

    return {
      monthly: Math.round(monthlyCost * 100) / 100,
      breakdown: costBreakdown,
      unit: 'USD'
    };
  }

  /**
   * Calculate serverless service costs
   */
  calculateServerlessCost(pricing, usage) {
    const executionCost = usage.executions * pricing.perExecution;
    const computeCost = usage.computeTime * pricing.perComputeSecond;
    const memoryCost = usage.memoryGBSeconds * pricing.perMemoryGBSecond;
    
    return executionCost + computeCost + memoryCost;
  }

  /**
   * Calculate managed service costs
   */
  calculateManagedServiceCost(pricing, usage) {
    const baseCost = pricing.basePrice || 0;
    const usageCost = usage.hours * (pricing.perHour || 0);
    const storageCost = usage.storageGB * (pricing.perGBMonth || 0);
    const transferCost = usage.dataTransferGB * (pricing.perGBTransfer || 0);
    
    return baseCost + usageCost + storageCost + transferCost;
  }

  /**
   * Calculate default service costs
   */
  calculateDefaultCost(pricing, usage) {
    return usage.hours * pricing.perHour;
  }

  /**
   * Estimate usage patterns for a service
   */
  estimateUsage(service, requirements) {
    const scale = requirements.scale || 'small';
    const traffic = requirements.traffic || 'medium';
    
    const baseUsage = {
      small: { hours: 100, executions: 10000, storageGB: 10, dataTransferGB: 50 },
      medium: { hours: 300, executions: 50000, storageGB: 50, dataTransferGB: 200 },
      large: { hours: 720, executions: 200000, storageGB: 200, dataTransferGB: 1000 }
    };

    const trafficMultipliers = {
      low: 0.5,
      medium: 1.0,
      high: 2.0,
      variable: 0.7
    };

    const usage = baseUsage[scale] || baseUsage.medium;
    const multiplier = trafficMultipliers[traffic] || 1.0;

    return {
      hours: usage.hours * multiplier,
      executions: usage.executions * multiplier,
      computeTime: usage.executions * 0.1 * multiplier, // Average 100ms per execution
      memoryGBSeconds: usage.executions * 0.1 * 0.128 * multiplier, // 128MB average
      storageGB: usage.storageGB,
      dataTransferGB: usage.dataTransferGB * multiplier
    };
  }

  /**
   * Calculate scaling cost projections
   */
  calculateScalingProjections(provider, services, requirements, baseCost) {
    const projections = [];
    const scales = ['2x', '5x', '10x'];
    
    scales.forEach(scale => {
      const multiplier = parseFloat(scale.replace('x', ''));
      const scaledRequirements = {
        ...requirements,
        scale: this.getScaledSize(requirements.scale, multiplier)
      };
      
      let scaledCost = 0;
      services.forEach(service => {
        const serviceCost = this.calculateServiceCost(provider, service, scaledRequirements);
        scaledCost += serviceCost.monthly;
      });
      
      // Ensure scaled cost is always higher than base cost
      scaledCost = Math.max(scaledCost, baseCost * multiplier * 0.8);
      
      const efficiency = baseCost > 0 ? (scaledCost / baseCost / multiplier) : 1.0;
      
      projections.push({
        scale,
        monthlyCost: Math.round(scaledCost * 100) / 100,
        costIncrease: Math.round((scaledCost - baseCost) * 100) / 100,
        efficiency: Math.round(Math.max(0.1, efficiency) * 100) / 100
      });
    });
    
    return projections;
  }

  /**
   * Get scaled size based on multiplier
   */
  getScaledSize(currentScale, multiplier) {
    const sizeOrder = ['small', 'medium', 'large'];
    const currentIndex = sizeOrder.indexOf(currentScale || 'medium');
    
    if (multiplier >= 5) return 'large';
    if (multiplier >= 2) return currentIndex < 1 ? 'medium' : 'large';
    return currentScale || 'medium';
  }

  /**
   * Get reserved instance discount
   */
  getReservedInstanceDiscount(service, commitment) {
    const discounts = {
      '1year': 0.3,
      '3year': 0.5
    };
    return discounts[commitment] || 0;
  }

  /**
   * Get pricing data for a specific service
   */
  getPricingForService(provider, service) {
    const providerPricing = this.pricingData[provider] || {};
    const categoryPricing = providerPricing[service.category] || {};
    const servicePricing = categoryPricing[service.name] || {};
    
    // Return default pricing if specific pricing not found
    return {
      perHour: 0.10,
      perExecution: 0.0000002,
      perComputeSecond: 0.0000166667,
      perMemoryGBSecond: 0.0000166667,
      perGBMonth: 0.10,
      perGBTransfer: 0.09,
      basePrice: 0,
      ...servicePricing
    };
  }

  /**
   * Get cost calculation assumptions
   */
  getCostAssumptions(requirements) {
    return [
      'Costs are estimates based on typical usage patterns',
      'Actual costs may vary based on specific usage and configuration',
      'Prices are subject to change by cloud providers',
      `Calculations assume ${requirements.region || 'us-east-1'} region pricing`,
      'Data transfer costs may vary based on traffic patterns',
      'Reserved instance pricing requires upfront commitment'
    ];
  }

  /**
   * Initialize pricing data for all providers
   */
  initializePricingData() {
    return {
      aws: {
        compute: {
          'Lambda': {
            perExecution: 0.0000002,
            perComputeSecond: 0.0000166667,
            perMemoryGBSecond: 0.0000166667
          },
          'App Runner': {
            perHour: 0.007,
            perGBMonth: 0.20
          },
          'EC2': {
            perHour: 0.0116 // t3.micro
          }
        },
        hosting: {
          'S3 + CloudFront': {
            perGBMonth: 0.023,
            perGBTransfer: 0.085
          },
          'Amplify': {
            perGBMonth: 0.15,
            perBuildMinute: 0.01
          }
        },
        database: {
          'RDS PostgreSQL': {
            perHour: 0.017, // db.t3.micro
            perGBMonth: 0.115
          },
          'Aurora PostgreSQL': {
            perACU: 0.06,
            perGBMonth: 0.10
          }
        }
      },
      azure: {
        compute: {
          'Functions': {
            perExecution: 0.0000002,
            perComputeSecond: 0.000016
          },
          'App Service': {
            perHour: 0.018 // Basic B1
          }
        },
        hosting: {
          'Static Web Apps': {
            basePrice: 0,
            perGBTransfer: 0.087
          }
        },
        database: {
          'Database for PostgreSQL': {
            perHour: 0.022, // Basic B1ms
            perGBMonth: 0.115
          }
        }
      },
      gcp: {
        compute: {
          'Cloud Functions': {
            perExecution: 0.0000004,
            perComputeSecond: 0.0000024,
            perMemoryGBSecond: 0.0000025
          },
          'Cloud Run': {
            perCPUSecond: 0.00002400,
            perMemoryGBSecond: 0.00000250
          }
        },
        hosting: {
          'Firebase Hosting': {
            perGBMonth: 0.026,
            perGBTransfer: 0.15
          }
        },
        database: {
          'Cloud SQL PostgreSQL': {
            perHour: 0.0150, // db-f1-micro
            perGBMonth: 0.090
          }
        }
      }
    };
  }

  /**
   * Initialize scaling factors
   */
  initializeScalingFactors() {
    return {
      serverless: {
        efficiency: 0.8, // Serverless scales more efficiently
        overhead: 0.1
      },
      managed: {
        efficiency: 0.9,
        overhead: 0.05
      },
      traditional: {
        efficiency: 1.0,
        overhead: 0.2
      }
    };
  }
}