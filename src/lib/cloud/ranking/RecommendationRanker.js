/**
 * Recommendation Ranker
 * Ranks architecture recommendations based on cost-effectiveness and suitability
 */

export class RecommendationRanker {
  constructor() {
    this.weights = this.initializeWeights();
  }

  /**
   * Rank recommendations by overall score
   * @param {Array} recommendations - Array of architecture recommendations
   * @param {Object} requirements - User requirements and preferences
   * @returns {Array} Sorted recommendations with scores
   */
  rankRecommendations(recommendations, requirements = {}) {
    try {
      // Calculate scores for each recommendation
      const scoredRecommendations = recommendations.map(rec => ({
        ...rec,
        score: this.calculateOverallScore(rec, requirements),
        scoreBreakdown: this.getScoreBreakdown(rec, requirements)
      }));

      // Sort by score (highest first)
      return scoredRecommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      throw new Error(`Ranking failed: ${error.message}`);
    }
  }

  /**
   * Calculate overall score for a recommendation
   */
  calculateOverallScore(recommendation, requirements) {
    const costScore = this.calculateCostScore(recommendation, requirements);
    const performanceScore = this.calculatePerformanceScore(recommendation, requirements);
    const reliabilityScore = this.calculateReliabilityScore(recommendation, requirements);
    const simplicityScore = this.calculateSimplicityScore(recommendation, requirements);
    const scalabilityScore = this.calculateScalabilityScore(recommendation, requirements);

    const weights = this.getWeightsForRequirements(requirements);

    return (
      costScore * weights.cost +
      performanceScore * weights.performance +
      reliabilityScore * weights.reliability +
      simplicityScore * weights.simplicity +
      scalabilityScore * weights.scalability
    );
  }

  /**
   * Calculate cost effectiveness score (0-1, higher is better)
   */
  calculateCostScore(recommendation, requirements) {
    const monthlyCost = recommendation.estimatedCost.monthly;
    const maxAcceptableCost = requirements.maxBudget || 1000;
    
    // Score based on cost efficiency
    if (monthlyCost <= maxAcceptableCost * 0.5) {
      return 1.0; // Excellent cost efficiency
    } else if (monthlyCost <= maxAcceptableCost) {
      return 0.8 - (monthlyCost / maxAcceptableCost) * 0.3; // Good to fair
    } else {
      return Math.max(0.1, 0.5 - (monthlyCost / maxAcceptableCost - 1)); // Poor but not zero
    }
  }

  /**
   * Calculate performance score based on service types and architecture
   */
  calculatePerformanceScore(recommendation, requirements) {
    let score = 0.5; // Base score
    
    // Bonus for managed services (better performance guarantees)
    const managedServices = recommendation.services.filter(s => s.type === 'managed');
    score += (managedServices.length / recommendation.services.length) * 0.2;
    
    // Bonus for CDN/caching services
    const hasCDN = recommendation.services.some(s => 
      s.name.includes('CloudFront') || s.name.includes('CDN') || s.name.includes('Cache')
    );
    if (hasCDN) score += 0.15;
    
    // Bonus for database optimization
    const hasOptimizedDB = recommendation.services.some(s => 
      s.category === 'database' && (s.name.includes('Aurora') || s.name.includes('Cosmos'))
    );
    if (hasOptimizedDB) score += 0.15;
    
    // Performance requirements adjustment
    if (requirements.performance === 'high') {
      // Prefer non-serverless for consistent performance
      const serverlessServices = recommendation.services.filter(s => s.type === 'serverless');
      score -= (serverlessServices.length / recommendation.services.length) * 0.1;
    }
    
    return Math.min(1.0, Math.max(0.1, score));
  }

  /**
   * Calculate reliability score based on service architecture
   */
  calculateReliabilityScore(recommendation, requirements) {
    let score = 0.6; // Base score
    
    // Bonus for managed services (higher reliability)
    if (recommendation.services && recommendation.services.length > 0) {
      const managedRatio = recommendation.services.filter(s => s.type === 'managed').length / 
                          recommendation.services.length;
      score += managedRatio * 0.3;
      
      // Bonus for multi-AZ/region services
      const hasHighAvailability = recommendation.services.some(s => 
        s.name.includes('Aurora') || s.name.includes('RDS') || s.name.includes('Cosmos')
      );
      if (hasHighAvailability) score += 0.1;
    }
    
    // Provider reliability bonus (subjective, based on general reputation)
    const providerBonus = {
      aws: 0.05,
      azure: 0.03,
      gcp: 0.02
    };
    score += providerBonus[recommendation.provider] || 0;
    
    return Math.min(1.0, Math.max(0.1, score));
  }

  /**
   * Calculate simplicity score (ease of setup and management)
   */
  calculateSimplicityScore(recommendation, requirements) {
    let score = 0.5; // Base score
    
    if (!recommendation.services || recommendation.services.length === 0) {
      return 0.3; // Low score for no services
    }
    
    // Bonus for fewer services (simpler architecture)
    const serviceCount = recommendation.services.length;
    if (serviceCount <= 3) score += 0.3;
    else if (serviceCount <= 5) score += 0.2;
    else score += 0.1;
    
    // Bonus for managed services (less operational overhead)
    const managedRatio = recommendation.services.filter(s => s.type === 'managed').length / 
                        recommendation.services.length;
    score += managedRatio * 0.2;
    
    // Bonus for serverless (no server management)
    const serverlessRatio = recommendation.services.filter(s => s.type === 'serverless').length / 
                           recommendation.services.length;
    score += serverlessRatio * 0.15;
    
    // Penalty for complex integrations
    const hasComplexIntegration = recommendation.services.some(s => 
      s.alternatives && s.alternatives.length > 3
    );
    if (hasComplexIntegration) score -= 0.1;
    
    return Math.min(1.0, Math.max(0.1, score));
  }

  /**
   * Calculate scalability score
   */
  calculateScalabilityScore(recommendation, requirements) {
    let score = 0.5; // Base score
    
    if (!recommendation.services || recommendation.services.length === 0) {
      return 0.3; // Low score for no services
    }
    
    // Bonus for auto-scaling services
    const hasAutoScaling = recommendation.services.some(s => 
      s.type === 'serverless' || s.name.includes('Auto') || s.name.includes('Elastic')
    );
    if (hasAutoScaling) score += 0.2;
    
    // Bonus for serverless (infinite scaling)
    const serverlessRatio = recommendation.services.filter(s => s.type === 'serverless').length / 
                           recommendation.services.length;
    score += serverlessRatio * 0.25;
    
    // Check scaling projections efficiency
    const scalingProjections = recommendation.estimatedCost?.scalingProjections || [];
    if (scalingProjections.length > 0) {
      const avgEfficiency = scalingProjections.reduce((sum, proj) => sum + proj.efficiency, 0) / 
                           scalingProjections.length;
      score += (1 - avgEfficiency) * 0.15; // Better efficiency = higher score
    }
    
    // Requirements-based adjustments
    if (requirements.expectedGrowth === 'high') {
      score += serverlessRatio * 0.1; // Extra bonus for serverless with high growth
    }
    
    return Math.min(1.0, Math.max(0.1, score));
  }

  /**
   * Get detailed score breakdown for transparency
   */
  getScoreBreakdown(recommendation, requirements) {
    const weights = this.getWeightsForRequirements(requirements);
    
    return {
      cost: {
        score: this.calculateCostScore(recommendation, requirements),
        weight: weights.cost,
        contribution: this.calculateCostScore(recommendation, requirements) * weights.cost
      },
      performance: {
        score: this.calculatePerformanceScore(recommendation, requirements),
        weight: weights.performance,
        contribution: this.calculatePerformanceScore(recommendation, requirements) * weights.performance
      },
      reliability: {
        score: this.calculateReliabilityScore(recommendation, requirements),
        weight: weights.reliability,
        contribution: this.calculateReliabilityScore(recommendation, requirements) * weights.reliability
      },
      simplicity: {
        score: this.calculateSimplicityScore(recommendation, requirements),
        weight: weights.simplicity,
        contribution: this.calculateSimplicityScore(recommendation, requirements) * weights.simplicity
      },
      scalability: {
        score: this.calculateScalabilityScore(recommendation, requirements),
        weight: weights.scalability,
        contribution: this.calculateScalabilityScore(recommendation, requirements) * weights.scalability
      }
    };
  }

  /**
   * Get weights based on user requirements
   */
  getWeightsForRequirements(requirements) {
    const baseWeights = { ...this.weights.default };
    
    // Adjust weights based on priorities
    if (requirements.priority === 'cost') {
      baseWeights.cost = 0.4;
      baseWeights.performance = 0.15;
      baseWeights.reliability = 0.15;
      baseWeights.simplicity = 0.15;
      baseWeights.scalability = 0.15;
    } else if (requirements.priority === 'performance') {
      baseWeights.cost = 0.15;
      baseWeights.performance = 0.4;
      baseWeights.reliability = 0.2;
      baseWeights.simplicity = 0.1;
      baseWeights.scalability = 0.15;
    } else if (requirements.priority === 'simplicity') {
      baseWeights.cost = 0.2;
      baseWeights.performance = 0.15;
      baseWeights.reliability = 0.15;
      baseWeights.simplicity = 0.35;
      baseWeights.scalability = 0.15;
    }
    
    // Adjust for startup vs enterprise
    if (requirements.organizationType === 'startup') {
      baseWeights.cost += 0.1;
      baseWeights.simplicity += 0.05;
      baseWeights.reliability -= 0.05;
      baseWeights.performance -= 0.1;
    } else if (requirements.organizationType === 'enterprise') {
      baseWeights.reliability += 0.1;
      baseWeights.performance += 0.05;
      baseWeights.cost -= 0.1;
      baseWeights.simplicity -= 0.05;
    }
    
    // Normalize weights to sum to 1
    const totalWeight = Object.values(baseWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(baseWeights).forEach(key => {
      baseWeights[key] = baseWeights[key] / totalWeight;
    });
    
    return baseWeights;
  }

  /**
   * Initialize default weights for scoring criteria
   */
  initializeWeights() {
    return {
      default: {
        cost: 0.25,
        performance: 0.20,
        reliability: 0.20,
        simplicity: 0.20,
        scalability: 0.15
      }
    };
  }
}