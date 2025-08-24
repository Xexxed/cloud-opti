/**
 * Cloud Service Mappings
 * Maps technologies to appropriate cloud services across providers
 */

export class CloudServiceMappings {
  constructor() {
    this.serviceMappings = this.initializeServiceMappings();
    this.managedAlternatives = this.initializeManagedAlternatives();
  }

  /**
   * Map technologies to cloud services for a specific provider
   * @param {string} provider - Cloud provider (aws, azure, gcp)
   * @param {Array} technologies - Detected technologies
   * @returns {Array} Recommended cloud services
   */
  mapTechnologiesToServices(provider, technologies) {
    const services = new Map();

    technologies.forEach(tech => {
      const mappings = this.getServiceMappings(provider, tech);
      mappings.forEach(service => {
        const key = `${service.category}-${service.name}`;
        if (!services.has(key)) {
          services.set(key, {
            ...service,
            supportedTechnologies: [tech.name],
            confidence: tech.confidence
          });
        } else {
          const existing = services.get(key);
          existing.supportedTechnologies.push(tech.name);
          existing.confidence = Math.max(existing.confidence, tech.confidence);
        }
      });
    });

    return Array.from(services.values());
  }

  /**
   * Get service mappings for a specific technology and provider
   */
  getServiceMappings(provider, technology) {
    const techKey = technology.name.toLowerCase();
    const categoryMappings = this.serviceMappings[technology.category] || {};
    const techMappings = categoryMappings[techKey] || {};
    
    return techMappings[provider] || [];
  }

  /**
   * Get managed service alternative if available
   */
  getManagedAlternative(service) {
    const key = `${service.category}-${service.name}`;
    return this.managedAlternatives[key] || null;
  }

  /**
   * Get regional optimization for a service
   */
  getRegionalOptimization(service, region) {
    // Regional optimizations would be implemented here
    // For now, return null as this would require extensive regional data
    return null;
  }

  /**
   * Initialize technology to service mappings
   */
  initializeServiceMappings() {
    return {
      language: {
        javascript: {
          aws: [
            {
              name: 'Lambda',
              category: 'compute',
              purpose: 'Serverless function execution',
              type: 'serverless',
              serverlessAlternative: 'Lambda',
              alternatives: ['EC2', 'ECS', 'App Runner'],
              costFactors: ['execution time', 'memory allocation', 'requests']
            },
            {
              name: 'App Runner',
              category: 'compute',
              purpose: 'Containerized web applications',
              type: 'managed',
              alternatives: ['ECS', 'EC2'],
              costFactors: ['vCPU', 'memory', 'requests']
            }
          ],
          azure: [
            {
              name: 'Functions',
              category: 'compute',
              purpose: 'Serverless function execution',
              type: 'serverless',
              serverlessAlternative: 'Functions',
              alternatives: ['App Service', 'Container Instances'],
              costFactors: ['execution time', 'memory', 'requests']
            },
            {
              name: 'App Service',
              category: 'compute',
              purpose: 'Web application hosting',
              type: 'managed',
              alternatives: ['Container Instances', 'Virtual Machines'],
              costFactors: ['app service plan', 'compute hours']
            }
          ],
          gcp: [
            {
              name: 'Cloud Functions',
              category: 'compute',
              purpose: 'Serverless function execution',
              type: 'serverless',
              serverlessAlternative: 'Cloud Functions',
              alternatives: ['Cloud Run', 'Compute Engine'],
              costFactors: ['invocations', 'compute time', 'memory']
            },
            {
              name: 'Cloud Run',
              category: 'compute',
              purpose: 'Containerized applications',
              type: 'managed',
              alternatives: ['Compute Engine', 'GKE'],
              costFactors: ['CPU', 'memory', 'requests']
            }
          ]
        },
        python: {
          aws: [
            {
              name: 'Lambda',
              category: 'compute',
              purpose: 'Serverless Python execution',
              type: 'serverless',
              serverlessAlternative: 'Lambda',
              alternatives: ['EC2', 'ECS', 'Elastic Beanstalk'],
              costFactors: ['execution time', 'memory allocation', 'requests']
            },
            {
              name: 'Elastic Beanstalk',
              category: 'compute',
              purpose: 'Python web application deployment',
              type: 'managed',
              alternatives: ['EC2', 'ECS'],
              costFactors: ['EC2 instances', 'load balancer', 'storage']
            }
          ],
          azure: [
            {
              name: 'Functions',
              category: 'compute',
              purpose: 'Serverless Python execution',
              type: 'serverless',
              serverlessAlternative: 'Functions',
              alternatives: ['App Service', 'Container Instances'],
              costFactors: ['execution time', 'memory', 'requests']
            },
            {
              name: 'App Service',
              category: 'compute',
              purpose: 'Python web application hosting',
              type: 'managed',
              alternatives: ['Container Instances', 'Virtual Machines'],
              costFactors: ['app service plan', 'compute hours']
            }
          ],
          gcp: [
            {
              name: 'Cloud Functions',
              category: 'compute',
              purpose: 'Serverless Python execution',
              type: 'serverless',
              serverlessAlternative: 'Cloud Functions',
              alternatives: ['Cloud Run', 'App Engine'],
              costFactors: ['invocations', 'compute time', 'memory']
            },
            {
              name: 'App Engine',
              category: 'compute',
              purpose: 'Python web application platform',
              type: 'managed',
              alternatives: ['Cloud Run', 'Compute Engine'],
              costFactors: ['instance hours', 'requests', 'bandwidth']
            }
          ]
        }
      },
      framework: {
        react: {
          aws: [
            {
              name: 'S3 + CloudFront',
              category: 'hosting',
              purpose: 'Static site hosting with CDN',
              type: 'managed',
              alternatives: ['Amplify', 'EC2'],
              costFactors: ['storage', 'data transfer', 'requests']
            },
            {
              name: 'Amplify',
              category: 'hosting',
              purpose: 'Full-stack React application hosting',
              type: 'managed',
              alternatives: ['S3 + CloudFront', 'Elastic Beanstalk'],
              costFactors: ['build minutes', 'hosting', 'data transfer']
            }
          ],
          azure: [
            {
              name: 'Static Web Apps',
              category: 'hosting',
              purpose: 'Static React application hosting',
              type: 'managed',
              alternatives: ['App Service', 'Storage Account'],
              costFactors: ['bandwidth', 'custom domains', 'functions']
            }
          ],
          gcp: [
            {
              name: 'Firebase Hosting',
              category: 'hosting',
              purpose: 'Static React application hosting',
              type: 'managed',
              alternatives: ['Cloud Storage', 'App Engine'],
              costFactors: ['storage', 'bandwidth', 'requests']
            }
          ]
        },
        nextjs: {
          aws: [
            {
              name: 'Vercel (recommended)',
              category: 'hosting',
              purpose: 'Optimized Next.js hosting',
              type: 'managed',
              alternatives: ['Amplify', 'Lambda + API Gateway'],
              costFactors: ['function executions', 'bandwidth', 'build time']
            },
            {
              name: 'Amplify',
              category: 'hosting',
              purpose: 'Full-stack Next.js hosting',
              type: 'managed',
              alternatives: ['Lambda + API Gateway', 'ECS'],
              costFactors: ['build minutes', 'hosting', 'data transfer']
            }
          ],
          azure: [
            {
              name: 'Static Web Apps',
              category: 'hosting',
              purpose: 'Next.js static export hosting',
              type: 'managed',
              alternatives: ['App Service', 'Container Instances'],
              costFactors: ['bandwidth', 'functions', 'custom domains']
            }
          ],
          gcp: [
            {
              name: 'Cloud Run',
              category: 'hosting',
              purpose: 'Containerized Next.js hosting',
              type: 'managed',
              alternatives: ['App Engine', 'Compute Engine'],
              costFactors: ['CPU', 'memory', 'requests']
            }
          ]
        }
      },
      database: {
        postgresql: {
          aws: [
            {
              name: 'RDS PostgreSQL',
              category: 'database',
              purpose: 'Managed PostgreSQL database',
              type: 'managed',
              supportsReservedInstances: true,
              alternatives: ['Aurora PostgreSQL', 'EC2 self-managed'],
              costFactors: ['instance type', 'storage', 'backup', 'data transfer']
            },
            {
              name: 'Aurora PostgreSQL',
              category: 'database',
              purpose: 'High-performance PostgreSQL',
              type: 'managed',
              alternatives: ['RDS PostgreSQL'],
              costFactors: ['ACU (serverless)', 'storage', 'I/O requests']
            }
          ],
          azure: [
            {
              name: 'Database for PostgreSQL',
              category: 'database',
              purpose: 'Managed PostgreSQL service',
              type: 'managed',
              alternatives: ['Virtual Machines'],
              costFactors: ['compute', 'storage', 'backup']
            }
          ],
          gcp: [
            {
              name: 'Cloud SQL PostgreSQL',
              category: 'database',
              purpose: 'Managed PostgreSQL database',
              type: 'managed',
              alternatives: ['Compute Engine self-managed'],
              costFactors: ['CPU', 'memory', 'storage', 'network']
            }
          ]
        },
        mongodb: {
          aws: [
            {
              name: 'DocumentDB',
              category: 'database',
              purpose: 'MongoDB-compatible document database',
              type: 'managed',
              alternatives: ['MongoDB Atlas', 'EC2 self-managed'],
              costFactors: ['instance type', 'storage', 'I/O requests']
            }
          ],
          azure: [
            {
              name: 'Cosmos DB',
              category: 'database',
              purpose: 'Multi-model database with MongoDB API',
              type: 'managed',
              alternatives: ['Virtual Machines'],
              costFactors: ['request units', 'storage', 'backup']
            }
          ],
          gcp: [
            {
              name: 'Firestore',
              category: 'database',
              purpose: 'NoSQL document database',
              type: 'managed',
              alternatives: ['MongoDB Atlas', 'Compute Engine'],
              costFactors: ['reads', 'writes', 'storage', 'bandwidth']
            }
          ]
        }
      }
    };
  }

  /**
   * Initialize managed service alternatives
   */
  initializeManagedAlternatives() {
    return {
      'compute-EC2': {
        name: 'Elastic Beanstalk',
        category: 'compute',
        purpose: 'Managed application deployment',
        type: 'managed',
        benefit: 'Reduced operational overhead'
      },
      'compute-Virtual Machines': {
        name: 'App Service',
        category: 'compute',
        purpose: 'Managed web application hosting',
        type: 'managed',
        benefit: 'Simplified deployment and scaling'
      },
      'compute-Compute Engine': {
        name: 'App Engine',
        category: 'compute',
        purpose: 'Managed application platform',
        type: 'managed',
        benefit: 'Automatic scaling and management'
      }
    };
  }
}