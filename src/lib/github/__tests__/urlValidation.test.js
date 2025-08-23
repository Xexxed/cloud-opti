import { describe, it, expect } from 'vitest'
import {
  validateGitHubUrl,
  validateOwnerName,
  validateRepositoryName,
  parseGitHubUrl,
  isGitHubUrl,
  normalizeGitHubUrl,
  validateMultipleGitHubUrls
} from '../urlValidation.js'

describe('urlValidation', () => {
  describe('validateGitHubUrl', () => {
    it('should validate full HTTPS GitHub URL', () => {
      const result = validateGitHubUrl('https://github.com/owner/repo')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.details.owner).toBe('owner')
      expect(result.details.repo).toBe('repo')
      expect(result.details.normalizedUrl).toBe('https://github.com/owner/repo')
    })

    it('should validate HTTP GitHub URL', () => {
      const result = validateGitHubUrl('http://github.com/owner/repo')
      
      expect(result.isValid).toBe(true)
      expect(result.details.owner).toBe('owner')
      expect(result.details.repo).toBe('repo')
    })

    it('should validate GitHub URL without protocol', () => {
      const result = validateGitHubUrl('github.com/owner/repo')
      
      expect(result.isValid).toBe(true)
      expect(result.details.owner).toBe('owner')
      expect(result.details.repo).toBe('repo')
    })

    it('should validate short format URL', () => {
      const result = validateGitHubUrl('owner/repo')
      
      expect(result.isValid).toBe(true)
      expect(result.details.owner).toBe('owner')
      expect(result.details.repo).toBe('repo')
    })

    it('should validate URL with .git extension', () => {
      const result = validateGitHubUrl('https://github.com/owner/repo.git')
      
      expect(result.isValid).toBe(true)
      expect(result.details.owner).toBe('owner')
      expect(result.details.repo).toBe('repo')
    })

    it('should validate URL with additional path', () => {
      const result = validateGitHubUrl('https://github.com/owner/repo/tree/main')
      
      expect(result.isValid).toBe(true)
      expect(result.details.owner).toBe('owner')
      expect(result.details.repo).toBe('repo')
    })

    it('should reject empty URL', () => {
      const result = validateGitHubUrl('')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('URL is required')
    })

    it('should reject whitespace-only URL', () => {
      const result = validateGitHubUrl('   ')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('URL cannot be empty')
    })

    it('should reject null URL', () => {
      const result = validateGitHubUrl(null)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('URL is required')
    })

    it('should reject invalid URL format', () => {
      const result = validateGitHubUrl('not-a-github-url')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid GitHub URL format')
    })

    it('should reject URL with invalid owner name', () => {
      const result = validateGitHubUrl('https://github.com/-invalid/repo')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid owner name')
    })

    it('should reject URL with invalid repository name', () => {
      const result = validateGitHubUrl('https://github.com/owner/...')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid repository name')
    })

    it('should handle URLs with special characters in names', () => {
      const result = validateGitHubUrl('https://github.com/owner-name/repo.name')
      
      expect(result.isValid).toBe(true)
      expect(result.details.owner).toBe('owner-name')
      expect(result.details.repo).toBe('repo.name')
    })
  })

  describe('validateOwnerName', () => {
    it('should validate valid owner names', () => {
      const validNames = ['owner', 'owner-name', 'owner.name', 'owner_name', 'owner123']
      
      validNames.forEach(name => {
        const result = validateOwnerName(name)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeNull()
      })
    })

    it('should reject empty owner name', () => {
      const result = validateOwnerName('')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Owner name is required')
    })

    it('should reject null owner name', () => {
      const result = validateOwnerName(null)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Owner name is required')
    })

    it('should reject owner name starting with hyphen', () => {
      const result = validateOwnerName('-owner')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Must start and end with alphanumeric character')
    })

    it('should reject owner name ending with hyphen', () => {
      const result = validateOwnerName('owner-')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Must start and end with alphanumeric character')
    })

    it('should reject owner name with consecutive hyphens', () => {
      const result = validateOwnerName('owner--name')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot contain consecutive hyphens')
    })

    it('should reject owner name exceeding 39 characters', () => {
      const longName = 'a'.repeat(40)
      const result = validateOwnerName(longName)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot exceed 39 characters')
    })

    it('should reject owner name with invalid characters', () => {
      const result = validateOwnerName('owner@name')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('can only contain alphanumeric characters')
    })

    it('should accept single character owner name', () => {
      const result = validateOwnerName('a')
      
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateRepositoryName', () => {
    it('should validate valid repository names', () => {
      const validNames = ['repo', 'repo-name', 'repo.name', 'repo_name', 'repo123']
      
      validNames.forEach(name => {
        const result = validateRepositoryName(name)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeNull()
      })
    })

    it('should reject empty repository name', () => {
      const result = validateRepositoryName('')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Repository name is required')
    })

    it('should reject null repository name', () => {
      const result = validateRepositoryName(null)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Repository name is required')
    })

    it('should reject repository name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101)
      const result = validateRepositoryName(longName)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot exceed 100 characters')
    })

    it('should reject repository name with invalid characters', () => {
      const result = validateRepositoryName('repo@name')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('can only contain alphanumeric characters')
    })

    it('should reject repository name consisting only of dots', () => {
      const result = validateRepositoryName('...')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot consist only of dots')
    })

    it('should accept repository name with single dot', () => {
      const result = validateRepositoryName('repo.name')
      
      expect(result.isValid).toBe(true)
    })
  })

  describe('parseGitHubUrl', () => {
    it('should parse valid GitHub URL', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo')
      
      expect(result.owner).toBe('owner')
      expect(result.repo).toBe('repo')
      expect(result.normalizedUrl).toBe('https://github.com/owner/repo')
      expect(result.error).toBeNull()
    })

    it('should return error for invalid URL', () => {
      const result = parseGitHubUrl('invalid-url')
      
      expect(result.owner).toBeNull()
      expect(result.repo).toBeNull()
      expect(result.error).toContain('Invalid GitHub URL format')
    })
  })

  describe('isGitHubUrl', () => {
    it('should return true for valid GitHub URLs', () => {
      const validUrls = [
        'https://github.com/owner/repo',
        'github.com/owner/repo',
        'owner/repo'
      ]
      
      validUrls.forEach(url => {
        expect(isGitHubUrl(url)).toBe(true)
      })
    })

    it('should return false for invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'https://gitlab.com/owner/repo',
        '',
        null
      ]
      
      invalidUrls.forEach(url => {
        expect(isGitHubUrl(url)).toBe(false)
      })
    })
  })

  describe('normalizeGitHubUrl', () => {
    it('should normalize various GitHub URL formats', () => {
      const testCases = [
        ['https://github.com/owner/repo', 'https://github.com/owner/repo'],
        ['github.com/owner/repo', 'https://github.com/owner/repo'],
        ['owner/repo', 'https://github.com/owner/repo']
      ]
      
      testCases.forEach(([input, expected]) => {
        expect(normalizeGitHubUrl(input)).toBe(expected)
      })
    })

    it('should normalize GitHub URL with .git extension', () => {
      expect(normalizeGitHubUrl('https://github.com/owner/repo.git')).toBe('https://github.com/owner/repo')
    })

    it('should return null for invalid URLs', () => {
      expect(normalizeGitHubUrl('invalid-url')).toBeNull()
      expect(normalizeGitHubUrl('')).toBeNull()
      expect(normalizeGitHubUrl(null)).toBeNull()
    })
  })

  describe('validateMultipleGitHubUrls', () => {
    it('should validate multiple URLs', () => {
      const urls = [
        'https://github.com/owner1/repo1',
        'invalid-url',
        'owner2/repo2'
      ]
      
      const results = validateMultipleGitHubUrls(urls)
      
      expect(results).toHaveLength(3)
      expect(results[0].isValid).toBe(true)
      expect(results[1].isValid).toBe(false)
      expect(results[2].isValid).toBe(true)
    })

    it('should return empty array for non-array input', () => {
      expect(validateMultipleGitHubUrls('not-an-array')).toEqual([])
      expect(validateMultipleGitHubUrls(null)).toEqual([])
    })

    it('should include index and original URL in results', () => {
      const urls = ['owner/repo']
      const results = validateMultipleGitHubUrls(urls)
      
      expect(results[0].index).toBe(0)
      expect(results[0].url).toBe('owner/repo')
    })
  })
})