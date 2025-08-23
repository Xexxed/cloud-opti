/**
 * GitHub API Service for repository analysis and validation
 * Handles repository access, validation, and content analysis
 */
export class GitHubService {
  constructor(apiToken = null) {
    this.apiToken = apiToken;
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * Validates if a GitHub repository URL is accessible
   * @param {string} url - GitHub repository URL
   * @returns {Promise<{isValid: boolean, isAccessible: boolean, repository: object|null, error: string|null}>}
   */
  async validateRepository(url) {
    try {
      const { owner, repo } = this.parseGitHubUrl(url);
      
      if (!owner || !repo) {
        return {
          isValid: false,
          isAccessible: false,
          repository: null,
          error: 'Invalid GitHub URL format'
        };
      }

      const response = await this.makeApiRequest(`/repos/${owner}/${repo}`);
      
      if (response.ok) {
        const repository = await response.json();
        return {
          isValid: true,
          isAccessible: true,
          repository: {
            name: repository.name,
            fullName: repository.full_name,
            owner: repository.owner.login,
            isPrivate: repository.private,
            size: repository.size,
            language: repository.language,
            languages: null, // Will be fetched separately
            lastUpdated: new Date(repository.updated_at),
            metadata: {
              stars: repository.stargazers_count,
              forks: repository.forks_count,
              openIssues: repository.open_issues_count,
              defaultBranch: repository.default_branch
            }
          },
          error: null
        };
      } else if (response.status === 404) {
        return {
          isValid: true,
          isAccessible: false,
          repository: null,
          error: 'Repository not found or is private'
        };
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } catch (error) {
      return {
        isValid: false,
        isAccessible: false,
        repository: null,
        error: error.message
      };
    }
  }

  /**
   * Analyzes repository contents to detect technologies and dependencies
   * @param {string} url - GitHub repository URL
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<{technologies: Array, languages: object, packageFiles: Array, error: string|null}>}
   */
  async analyzeRepository(url, progressCallback = null) {
    try {
      const { owner, repo } = this.parseGitHubUrl(url);
      
      if (progressCallback) progressCallback('Fetching repository information...', 10);
      
      // Get repository languages
      const languagesResponse = await this.makeApiRequest(`/repos/${owner}/${repo}/languages`);
      const languages = languagesResponse.ok ? await languagesResponse.json() : {};
      
      if (progressCallback) progressCallback('Analyzing repository structure...', 30);
      
      // Get repository contents
      const contentsResponse = await this.makeApiRequest(`/repos/${owner}/${repo}/contents`);
      const contents = contentsResponse.ok ? await contentsResponse.json() : [];
      
      if (progressCallback) progressCallback('Detecting package files...', 50);
      
      // Analyze package files and dependencies
      const packageFiles = await this.analyzePackageFiles(owner, repo, contents);
      
      if (progressCallback) progressCallback('Processing dependencies...', 60);
      
      if (progressCallback) progressCallback('Detecting technologies...', 70);
      
      // Detect technologies from files and dependencies
      const technologies = this.detectTechnologies(languages, packageFiles, contents);
      
      if (progressCallback) progressCallback('Analysis complete', 100);
      
      return {
        technologies,
        languages,
        packageFiles,
        error: null
      };
    } catch (error) {
      return {
        technologies: [],
        languages: {},
        packageFiles: [],
        error: error.message
      };
    }
  }

  /**
   * Fetches repository metadata including contributors and activity
   * @param {string} url - GitHub repository URL
   * @returns {Promise<object>}
   */
  async getRepositoryMetadata(url) {
    try {
      const { owner, repo } = this.parseGitHubUrl(url);
      
      const [contributorsResponse, commitsResponse] = await Promise.all([
        this.makeApiRequest(`/repos/${owner}/${repo}/contributors?per_page=10`),
        this.makeApiRequest(`/repos/${owner}/${repo}/commits?per_page=10`)
      ]);
      
      const contributors = contributorsResponse.ok ? await contributorsResponse.json() : [];
      const commits = commitsResponse.ok ? await commitsResponse.json() : [];
      
      return {
        contributors: contributors.length,
        recentActivity: commits.length > 0 ? new Date(commits[0].commit.author.date) : null,
        topContributors: contributors.slice(0, 5).map(c => ({
          login: c.login,
          contributions: c.contributions
        }))
      };
    } catch (error) {
      return {
        contributors: 0,
        recentActivity: null,
        topContributors: [],
        error: error.message
      };
    }
  }

  /**
   * Makes authenticated API request to GitHub
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Response>}
   */
  async makeApiRequest(endpoint) {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CloudOpti-Analyzer/1.0'
    };
    
    if (this.apiToken) {
      headers['Authorization'] = `token ${this.apiToken}`;
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers,
      timeout: 10000 // 10 second timeout
    });
    
    return response;
  }

  /**
   * Parses GitHub URL to extract owner and repository name
   * @param {string} url - GitHub repository URL
   * @returns {object} - {owner, repo}
   */
  parseGitHubUrl(url) {
    try {
      // Handle various GitHub URL formats
      const patterns = [
        /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
        /^([^\/]+)\/([^\/]+)$/
      ];
      
      let cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
      
      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) {
          return {
            owner: match[1],
            repo: match[2]
          };
        }
      }
      
      return { owner: null, repo: null };
    } catch (error) {
      return { owner: null, repo: null };
    }
  }

  /**
   * Analyzes package files to extract dependencies
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Array} contents - Repository contents
   * @returns {Promise<Array>}
   */
  async analyzePackageFiles(owner, repo, contents) {
    const packageFiles = [];
    const packageFileNames = [
      'package.json',
      'requirements.txt',
      'pom.xml',
      'build.gradle',
      'Cargo.toml',
      'go.mod',
      'composer.json',
      'Gemfile',
      'setup.py',
      'pyproject.toml'
    ];
    
    // Ensure contents is an array
    if (!Array.isArray(contents)) {
      return packageFiles;
    }
    
    for (const file of contents) {
      if (packageFileNames.includes(file.name)) {
        try {
          const fileResponse = await this.makeApiRequest(`/repos/${owner}/${repo}/contents/${file.name}`);
          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            const content = fileData.content ? atob(fileData.content) : '';
            
            packageFiles.push({
              name: file.name,
              content,
              dependencies: this.parseDependencies(file.name, content)
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch ${file.name}:`, error.message);
        }
      }
    }
    
    return packageFiles;
  }

  /**
   * Parses dependencies from package file content
   * @param {string} fileName - Package file name
   * @param {string} content - File content
   * @returns {Array}
   */
  parseDependencies(fileName, content) {
    try {
      switch (fileName) {
        case 'package.json':
          const packageJson = JSON.parse(content);
          return [
            ...Object.keys(packageJson.dependencies || {}),
            ...Object.keys(packageJson.devDependencies || {})
          ];
        
        case 'requirements.txt':
          return content.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => line.split(/[>=<]/)[0].trim());
        
        case 'pom.xml':
          // Basic XML parsing for Maven dependencies
          const dependencyMatches = content.match(/<artifactId>([^<]+)<\/artifactId>/g) || [];
          return dependencyMatches.map(match => match.replace(/<\/?artifactId>/g, ''));
        
        default:
          return [];
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Detects technologies from languages, dependencies, and file structure
   * @param {object} languages - Repository languages
   * @param {Array} packageFiles - Package files with dependencies
   * @param {Array} contents - Repository contents
   * @returns {Array}
   */
  detectTechnologies(languages, packageFiles, contents) {
    const technologies = [];
    
    // Detect from languages
    Object.keys(languages).forEach(language => {
      technologies.push({
        id: language.toLowerCase(),
        name: language,
        category: 'language',
        confidence: 0.9,
        source: 'github_languages',
        evidence: [`${language} detected in repository languages`]
      });
    });
    
    // Detect frameworks from dependencies
    packageFiles.forEach(packageFile => {
      const frameworks = this.detectFrameworks(packageFile.dependencies);
      technologies.push(...frameworks);
    });
    
    // Detect from file structure
    const structureTechnologies = this.detectFromFileStructure(contents);
    technologies.push(...structureTechnologies);
    
    return technologies;
  }

  /**
   * Detects frameworks from dependency list
   * @param {Array} dependencies - List of dependencies
   * @returns {Array}
   */
  detectFrameworks(dependencies) {
    const frameworkMap = {
      'react': { name: 'React', category: 'framework' },
      'vue': { name: 'Vue.js', category: 'framework' },
      'angular': { name: 'Angular', category: 'framework' },
      'next': { name: 'Next.js', category: 'framework' },
      'nuxt': { name: 'Nuxt.js', category: 'framework' },
      'express': { name: 'Express.js', category: 'framework' },
      'django': { name: 'Django', category: 'framework' },
      'flask': { name: 'Flask', category: 'framework' },
      'spring-boot': { name: 'Spring Boot', category: 'framework' },
      'laravel': { name: 'Laravel', category: 'framework' }
    };
    
    const detected = [];
    
    dependencies.forEach(dep => {
      const depName = dep.toLowerCase();
      Object.keys(frameworkMap).forEach(key => {
        if (depName.includes(key)) {
          const framework = frameworkMap[key];
          detected.push({
            id: key,
            name: framework.name,
            category: framework.category,
            confidence: 0.8,
            source: 'package_dependencies',
            evidence: [`Found ${dep} in dependencies`]
          });
        }
      });
    });
    
    return detected;
  }

  /**
   * Detects technologies from file structure patterns
   * @param {Array} contents - Repository contents
   * @returns {Array}
   */
  detectFromFileStructure(contents) {
    const technologies = [];
    
    // Ensure contents is an array
    if (!Array.isArray(contents)) {
      return technologies;
    }
    
    const fileNames = contents.map(file => file.name);
    
    // Docker detection
    if (fileNames.includes('Dockerfile') || fileNames.includes('docker-compose.yml')) {
      technologies.push({
        id: 'docker',
        name: 'Docker',
        category: 'tool',
        confidence: 0.9,
        source: 'file_structure',
        evidence: ['Docker configuration files found']
      });
    }
    
    // Kubernetes detection
    if (fileNames.some(name => name.includes('k8s') || name.includes('kubernetes'))) {
      technologies.push({
        id: 'kubernetes',
        name: 'Kubernetes',
        category: 'tool',
        confidence: 0.8,
        source: 'file_structure',
        evidence: ['Kubernetes configuration files found']
      });
    }
    
    return technologies;
  }
}

export default GitHubService;