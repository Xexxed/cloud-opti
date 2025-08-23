import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubService } from '../GitHubService.js'

describe('GitHubService', () => {
  let service
  
  beforeEach(() => {
    service = new GitHubService()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(service.apiToken).toBeNull()
      expect(service.baseUrl).toBe('https://api.github.com')
    })

    it('should initialize with provided API token', () => {
      const token = 'test-token'
      const serviceWithToken = new GitHubService(token)
      expect(serviceWithToken.apiToken).toBe(token)
    })
  })

  describe('parseGitHubUrl', () => {
    it('should parse full HTTPS GitHub URL', () => {
      const url = 'https://github.com/owner/repo'
      const result = service.parseGitHubUrl(url)
      expect(result).toEqual({ owner: 'owner', repo: 'repo' })
    })

    it('should parse GitHub URL with .git extension', () => {
      const url = 'https://github.com/owner/repo.git'
      const result = service.parseGitHubUrl(url)
      expect(result).toEqual({ owner: 'owner', repo: 'repo' })
    })

    it('should parse short format URL', () => {
      const url = 'owner/repo'
      const result = service.parseGitHubUrl(url)
      expect(result).toEqual({ owner: 'owner', repo: 'repo' })
    })

    it('should handle URL with additional path', () => {
      const url = 'https://github.com/owner/repo/tree/main'
      const result = service.parseGitHubUrl(url)
      expect(result).toEqual({ owner: 'owner', repo: 'repo' })
    })

    it('should return null for invalid URL', () => {
      const url = 'invalid-url'
      const result = service.parseGitHubUrl(url)
      expect(result).toEqual({ owner: null, repo: null })
    })
  })

  describe('makeApiRequest', () => {
    it('should make request with correct headers', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) }
      global.fetch.mockResolvedValue(mockResponse)

      await service.makeApiRequest('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/test',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CloudOpti-Analyzer/1.0'
          },
          timeout: 10000
        }
      )
    })

    it('should include authorization header when token is provided', async () => {
      const serviceWithToken = new GitHubService('test-token')
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) }
      global.fetch.mockResolvedValue(mockResponse)

      await serviceWithToken.makeApiRequest('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/test',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CloudOpti-Analyzer/1.0',
            'Authorization': 'token test-token'
          },
          timeout: 10000
        }
      )
    })
  })

  describe('validateRepository', () => {
    it('should return valid result for accessible repository', async () => {
      const mockRepoData = {
        name: 'test-repo',
        full_name: 'owner/test-repo',
        owner: { login: 'owner' },
        private: false,
        size: 1000,
        language: 'JavaScript',
        updated_at: '2023-01-01T00:00:00Z',
        stargazers_count: 100,
        forks_count: 50,
        open_issues_count: 10,
        default_branch: 'main'
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockRepoData)
      }
      global.fetch.mockResolvedValue(mockResponse)

      const result = await service.validateRepository('https://github.com/owner/test-repo')

      expect(result.isValid).toBe(true)
      expect(result.isAccessible).toBe(true)
      expect(result.repository.name).toBe('test-repo')
      expect(result.repository.owner).toBe('owner')
      expect(result.error).toBeNull()
    })

    it('should return invalid result for malformed URL', async () => {
      const result = await service.validateRepository('invalid-url')

      expect(result.isValid).toBe(false)
      expect(result.isAccessible).toBe(false)
      expect(result.repository).toBeNull()
      expect(result.error).toBe('Invalid GitHub URL format')
    })

    it('should return inaccessible result for 404 response', async () => {
      const mockResponse = {
        ok: false,
        status: 404
      }
      global.fetch.mockResolvedValue(mockResponse)

      const result = await service.validateRepository('https://github.com/owner/nonexistent')

      expect(result.isValid).toBe(true)
      expect(result.isAccessible).toBe(false)
      expect(result.repository).toBeNull()
      expect(result.error).toBe('Repository not found or is private')
    })

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'))

      const result = await service.validateRepository('https://github.com/owner/repo')

      expect(result.isValid).toBe(false)
      expect(result.isAccessible).toBe(false)
      expect(result.repository).toBeNull()
      expect(result.error).toBe('Network error')
    })
  })

  describe('analyzeRepository', () => {
    beforeEach(() => {
      // Mock successful API responses
      global.fetch.mockImplementation((url) => {
        if (url.includes('/languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ JavaScript: 1000, TypeScript: 500 })
          })
        }
        if (url.includes('/contents')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { name: 'package.json', type: 'file' },
              { name: 'src', type: 'dir' },
              { name: 'README.md', type: 'file' }
            ])
          })
        }
        return Promise.resolve({ ok: false, status: 404 })
      })
    })

    it('should analyze repository and return technologies', async () => {
      const progressCallback = vi.fn()
      
      const result = await service.analyzeRepository(
        'https://github.com/owner/repo',
        progressCallback
      )

      expect(result.error).toBeNull()
      expect(result.languages).toEqual({ JavaScript: 1000, TypeScript: 500 })
      expect(result.technologies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'JavaScript',
            category: 'language',
            confidence: 0.9
          }),
          expect.objectContaining({
            name: 'TypeScript',
            category: 'language',
            confidence: 0.9
          })
        ])
      )
      expect(progressCallback).toHaveBeenCalledTimes(6)
    })

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'))

      const result = await service.analyzeRepository('https://github.com/owner/repo')

      expect(result.error).toBe('API Error')
      expect(result.technologies).toEqual([])
      expect(result.languages).toEqual({})
      expect(result.packageFiles).toEqual([])
    })
  })

  describe('parseDependencies', () => {
    it('should parse package.json dependencies', () => {
      const packageJsonContent = JSON.stringify({
        dependencies: { react: '^18.0.0', lodash: '^4.17.21' },
        devDependencies: { jest: '^29.0.0' }
      })

      const result = service.parseDependencies('package.json', packageJsonContent)

      expect(result).toEqual(['react', 'lodash', 'jest'])
    })

    it('should parse requirements.txt dependencies', () => {
      const requirementsContent = 'django>=3.2.0\nrequests==2.28.1\n# comment line\nnumpy'

      const result = service.parseDependencies('requirements.txt', requirementsContent)

      expect(result).toEqual(['django', 'requests', 'numpy'])
    })

    it('should parse pom.xml dependencies', () => {
      const pomContent = `
        <dependencies>
          <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
          </dependency>
          <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
          </dependency>
        </dependencies>
      `

      const result = service.parseDependencies('pom.xml', pomContent)

      expect(result).toEqual(['spring-core', 'junit'])
    })

    it('should return empty array for unknown file types', () => {
      const result = service.parseDependencies('unknown.txt', 'content')
      expect(result).toEqual([])
    })

    it('should handle malformed JSON gracefully', () => {
      const result = service.parseDependencies('package.json', 'invalid json')
      expect(result).toEqual([])
    })
  })

  describe('detectFrameworks', () => {
    it('should detect React framework', () => {
      const dependencies = ['react', 'react-dom', 'lodash']
      const result = service.detectFrameworks(dependencies)

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'React',
            category: 'framework',
            confidence: 0.8
          })
        ])
      )
    })

    it('should detect multiple frameworks', () => {
      const dependencies = ['react', 'express', 'next']
      const result = service.detectFrameworks(dependencies)

      expect(result).toHaveLength(3)
      expect(result.map(f => f.name)).toEqual(
        expect.arrayContaining(['React', 'Express.js', 'Next.js'])
      )
    })

    it('should return empty array for no framework dependencies', () => {
      const dependencies = ['lodash', 'moment', 'axios']
      const result = service.detectFrameworks(dependencies)

      expect(result).toEqual([])
    })
  })

  describe('detectFromFileStructure', () => {
    it('should detect Docker from Dockerfile', () => {
      const contents = [
        { name: 'Dockerfile' },
        { name: 'src' },
        { name: 'package.json' }
      ]

      const result = service.detectFromFileStructure(contents)

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Docker',
            category: 'tool',
            confidence: 0.9
          })
        ])
      )
    })

    it('should detect Docker from docker-compose.yml', () => {
      const contents = [
        { name: 'docker-compose.yml' },
        { name: 'src' }
      ]

      const result = service.detectFromFileStructure(contents)

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Docker',
            category: 'tool'
          })
        ])
      )
    })

    it('should detect Kubernetes from k8s files', () => {
      const contents = [
        { name: 'k8s-deployment.yaml' },
        { name: 'src' }
      ]

      const result = service.detectFromFileStructure(contents)

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Kubernetes',
            category: 'tool',
            confidence: 0.8
          })
        ])
      )
    })

    it('should return empty array for no detectable tools', () => {
      const contents = [
        { name: 'src' },
        { name: 'package.json' },
        { name: 'README.md' }
      ]

      const result = service.detectFromFileStructure(contents)

      expect(result).toEqual([])
    })
  })

  describe('getRepositoryMetadata', () => {
    it('should fetch and return repository metadata', async () => {
      const mockContributors = [
        { login: 'user1', contributions: 100 },
        { login: 'user2', contributions: 50 }
      ]
      const mockCommits = [
        { commit: { author: { date: '2023-01-01T00:00:00Z' } } }
      ]

      global.fetch.mockImplementation((url) => {
        if (url.includes('/contributors')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockContributors)
          })
        }
        if (url.includes('/commits')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCommits)
          })
        }
        return Promise.resolve({ ok: false })
      })

      const result = await service.getRepositoryMetadata('https://github.com/owner/repo')

      expect(result.contributors).toBe(2)
      expect(result.recentActivity).toEqual(new Date('2023-01-01T00:00:00Z'))
      expect(result.topContributors).toHaveLength(2)
      expect(result.topContributors[0]).toEqual({
        login: 'user1',
        contributions: 100
      })
    })

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'))

      const result = await service.getRepositoryMetadata('https://github.com/owner/repo')

      expect(result.contributors).toBe(0)
      expect(result.recentActivity).toBeNull()
      expect(result.topContributors).toEqual([])
      expect(result.error).toBe('API Error')
    })
  })
})