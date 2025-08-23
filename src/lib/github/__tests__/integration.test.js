import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubService, validateGitHubUrl, withErrorHandling } from '../index.js'

describe('GitHub Integration', () => {
  let service

  beforeEach(() => {
    service = new GitHubService()
    vi.clearAllMocks()
  })

  describe('End-to-end workflow', () => {
    it('should validate URL, then analyze repository', async () => {
      // Step 1: Validate URL
      const url = 'https://github.com/facebook/react'
      const validation = validateGitHubUrl(url)
      
      expect(validation.isValid).toBe(true)
      expect(validation.details.owner).toBe('facebook')
      expect(validation.details.repo).toBe('react')

      // Step 2: Mock API responses for analysis
      global.fetch.mockImplementation((url) => {
        if (url.includes('/repos/facebook/react') && !url.includes('/languages') && !url.includes('/contents')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              name: 'react',
              full_name: 'facebook/react',
              owner: { login: 'facebook' },
              private: false,
              size: 50000,
              language: 'JavaScript',
              updated_at: '2023-01-01T00:00:00Z',
              stargazers_count: 200000,
              forks_count: 40000,
              open_issues_count: 1000,
              default_branch: 'main'
            })
          })
        }
        if (url.includes('/languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ JavaScript: 80000, TypeScript: 20000 })
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

      // Step 3: Validate repository accessibility
      const repoValidation = await service.validateRepository(validation.details.normalizedUrl)
      
      expect(repoValidation.isValid).toBe(true)
      expect(repoValidation.isAccessible).toBe(true)
      expect(repoValidation.repository.name).toBe('react')

      // Step 4: Analyze repository
      const analysis = await service.analyzeRepository(validation.details.normalizedUrl)
      
      expect(analysis.error).toBeNull()
      expect(analysis.languages).toEqual({ JavaScript: 80000, TypeScript: 20000 })
      expect(analysis.technologies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'JavaScript',
            category: 'language'
          }),
          expect.objectContaining({
            name: 'TypeScript',
            category: 'language'
          })
        ])
      )
    })

    it('should handle errors gracefully with error handling wrapper', async () => {
      const failingOperation = () => {
        throw new Error('Network failure')
      }

      await expect(
        withErrorHandling(failingOperation, 'test operation')
      ).rejects.toThrow()
    })

    it('should work with various URL formats', () => {
      const urlFormats = [
        'https://github.com/owner/repo',
        'github.com/owner/repo',
        'owner/repo',
        'https://github.com/owner/repo.git'
      ]

      urlFormats.forEach(url => {
        const validation = validateGitHubUrl(url)
        expect(validation.isValid).toBe(true)
        expect(validation.details.owner).toBe('owner')
        expect(validation.details.repo).toBe('repo')
        expect(validation.details.normalizedUrl).toBe('https://github.com/owner/repo')
      })
    })
  })

  describe('Error scenarios', () => {
    it('should handle invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'https://gitlab.com/owner/repo',
        '',
        null,
        undefined
      ]

      invalidUrls.forEach(url => {
        const validation = validateGitHubUrl(url)
        expect(validation.isValid).toBe(false)
        expect(validation.error).toBeTruthy()
      })
    })

    it('should handle repository not found', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      })

      const result = await service.validateRepository('https://github.com/nonexistent/repo')
      
      expect(result.isValid).toBe(true)
      expect(result.isAccessible).toBe(false)
      expect(result.error).toBe('Repository not found or is private')
    })

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'))

      const result = await service.validateRepository('https://github.com/owner/repo')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })
})