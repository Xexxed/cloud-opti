import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  GitHubError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
  RepositoryNotFoundError,
  ValidationError,
  GitHubErrorHandler,
  defaultErrorHandler,
  withErrorHandling,
  withTimeout,
  validateResult
} from '../errorHandling.js'

describe('errorHandling', () => {
  describe('Error Classes', () => {
    describe('GitHubError', () => {
      it('should create error with correct properties', () => {
        const error = new GitHubError('Test message', 'TEST_TYPE', 400, true)
        
        expect(error.message).toBe('Test message')
        expect(error.name).toBe('GitHubError')
        expect(error.type).toBe('TEST_TYPE')
        expect(error.statusCode).toBe(400)
        expect(error.retryable).toBe(true)
        expect(error.timestamp).toBeInstanceOf(Date)
      })
    })

    describe('NetworkError', () => {
      it('should create network error with correct properties', () => {
        const originalError = new Error('Connection failed')
        const error = new NetworkError('Network issue', originalError)
        
        expect(error.name).toBe('NetworkError')
        expect(error.type).toBe('NETWORK_ERROR')
        expect(error.retryable).toBe(true)
        expect(error.originalError).toBe(originalError)
      })
    })

    describe('RateLimitError', () => {
      it('should create rate limit error with reset time', () => {
        const resetTime = new Date()
        const error = new RateLimitError('Rate limited', resetTime)
        
        expect(error.name).toBe('RateLimitError')
        expect(error.type).toBe('RATE_LIMIT_ERROR')
        expect(error.statusCode).toBe(429)
        expect(error.retryable).toBe(true)
        expect(error.resetTime).toBe(resetTime)
      })
    })

    describe('AuthenticationError', () => {
      it('should create authentication error', () => {
        const error = new AuthenticationError('Auth failed')
        
        expect(error.name).toBe('AuthenticationError')
        expect(error.type).toBe('AUTHENTICATION_ERROR')
        expect(error.statusCode).toBe(401)
        expect(error.retryable).toBe(false)
      })
    })

    describe('RepositoryNotFoundError', () => {
      it('should create repository not found error', () => {
        const url = 'https://github.com/owner/repo'
        const error = new RepositoryNotFoundError('Not found', url)
        
        expect(error.name).toBe('RepositoryNotFoundError')
        expect(error.type).toBe('REPOSITORY_NOT_FOUND')
        expect(error.statusCode).toBe(404)
        expect(error.retryable).toBe(false)
        expect(error.repositoryUrl).toBe(url)
      })
    })

    describe('ValidationError', () => {
      it('should create validation error with field', () => {
        const error = new ValidationError('Invalid input', 'url')
        
        expect(error.name).toBe('ValidationError')
        expect(error.type).toBe('VALIDATION_ERROR')
        expect(error.statusCode).toBe(400)
        expect(error.retryable).toBe(false)
        expect(error.field).toBe('url')
      })
    })
  })

  describe('GitHubErrorHandler', () => {
    let handler

    beforeEach(() => {
      handler = new GitHubErrorHandler({
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000
      })
    })

    describe('handleError', () => {
      it('should handle network errors', () => {
        const networkError = new TypeError('fetch failed')
        const result = handler.handleError(networkError)
        
        expect(result).toBeInstanceOf(NetworkError)
        expect(result.retryable).toBe(true)
      })

      it('should handle timeout errors', () => {
        const timeoutError = new Error('timeout')
        const result = handler.handleError(timeoutError)
        
        expect(result).toBeInstanceOf(NetworkError)
        expect(result.message).toContain('timed out')
      })

      it('should handle validation errors', () => {
        const validationError = new ValidationError('Invalid input')
        const result = handler.handleError(validationError)
        
        expect(result).toBeInstanceOf(ValidationError)
        expect(result.retryable).toBe(false)
      })

      it('should handle existing GitHub errors', () => {
        const githubError = new AuthenticationError('Auth failed')
        const result = handler.handleError(githubError)
        
        expect(result).toBe(githubError)
      })

      it('should handle unknown errors', () => {
        const unknownError = new Error('Unknown error')
        const result = handler.handleError(unknownError)
        
        expect(result).toBeInstanceOf(GitHubError)
        expect(result.type).toBe('UNKNOWN_ERROR')
        expect(result.retryable).toBe(false)
      })
    })

    describe('handleResponseError', () => {
      it('should handle 401 authentication error', async () => {
        const response = {
          status: 401,
          json: () => Promise.resolve({ message: 'Bad credentials' })
        }
        
        const result = await handler.handleResponseError(response)
        
        expect(result).toBeInstanceOf(AuthenticationError)
        expect(result.message).toContain('Authentication failed')
      })

      it('should handle 403 rate limit error', async () => {
        const response = {
          status: 403,
          headers: {
            get: (name) => name === 'X-RateLimit-Reset' ? '1640995200' : null
          },
          json: () => Promise.resolve({ message: 'rate limit exceeded' })
        }
        
        const result = await handler.handleResponseError(response)
        
        expect(result).toBeInstanceOf(RateLimitError)
        expect(result.resetTime).toBeInstanceOf(Date)
      })

      it('should handle 404 not found error', async () => {
        const response = {
          status: 404,
          json: () => Promise.resolve({ message: 'Not Found' })
        }
        
        const result = await handler.handleResponseError(response)
        
        expect(result).toBeInstanceOf(RepositoryNotFoundError)
      })

      it('should handle 422 validation error', async () => {
        const response = {
          status: 422,
          json: () => Promise.resolve({
            message: 'Validation Failed',
            errors: [{ field: 'name' }]
          })
        }
        
        const result = await handler.handleResponseError(response)
        
        expect(result).toBeInstanceOf(ValidationError)
        expect(result.field).toBe('name')
      })

      it('should handle retryable server errors', async () => {
        const response = {
          status: 500,
          json: () => Promise.resolve({ message: 'Internal Server Error' })
        }
        
        const result = await handler.handleResponseError(response)
        
        expect(result).toBeInstanceOf(GitHubError)
        expect(result.retryable).toBe(true)
        expect(result.statusCode).toBe(500)
      })

      it('should handle JSON parse errors', async () => {
        const response = {
          status: 500,
          json: () => Promise.reject(new Error('Invalid JSON'))
        }
        
        const result = await handler.handleResponseError(response)
        
        expect(result).toBeInstanceOf(GitHubError)
        expect(result.statusCode).toBe(500)
      })
    })

    describe('executeWithRetry', () => {
      it('should succeed on first attempt', async () => {
        const operation = vi.fn().mockResolvedValue('success')
        
        const result = await handler.executeWithRetry(operation)
        
        expect(result).toBe('success')
        expect(operation).toHaveBeenCalledTimes(1)
      })

      it('should retry on retryable errors', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new NetworkError('Network error'))
          .mockResolvedValue('success')
        
        const result = await handler.executeWithRetry(operation)
        
        expect(result).toBe('success')
        expect(operation).toHaveBeenCalledTimes(2)
      })

      it('should not retry non-retryable errors', async () => {
        const operation = vi.fn().mockRejectedValue(new AuthenticationError('Auth failed'))
        
        await expect(handler.executeWithRetry(operation)).rejects.toThrow(AuthenticationError)
        expect(operation).toHaveBeenCalledTimes(1)
      })

      it('should stop retrying after max attempts', async () => {
        const operation = vi.fn().mockRejectedValue(new NetworkError('Network error'))
        
        await expect(handler.executeWithRetry(operation)).rejects.toThrow(NetworkError)
        expect(operation).toHaveBeenCalledTimes(2) // maxRetries = 2
      })
    })

    describe('getUserFriendlyError', () => {
      it('should return user-friendly network error', () => {
        const error = new NetworkError('Connection failed')
        const result = handler.getUserFriendlyError(error)
        
        expect(result.title).toBe('Connection Error')
        expect(result.canRetry).toBe(true)
        expect(result.suggestions).toContain('Check your internet connection')
      })

      it('should return user-friendly rate limit error', () => {
        const resetTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        const error = new RateLimitError('Rate limited', resetTime)
        const result = handler.getUserFriendlyError(error)
        
        expect(result.title).toBe('Rate Limit Exceeded')
        expect(result.suggestions[0]).toContain('Wait')
      })

      it('should return user-friendly authentication error', () => {
        const error = new AuthenticationError('Auth failed')
        const result = handler.getUserFriendlyError(error)
        
        expect(result.title).toBe('Access Denied')
        expect(result.suggestions).toContain('Ensure the repository is public')
      })

      it('should return user-friendly repository not found error', () => {
        const error = new RepositoryNotFoundError('Not found')
        const result = handler.getUserFriendlyError(error)
        
        expect(result.title).toBe('Repository Not Found')
        expect(result.suggestions).toContain('Double-check the repository URL')
      })

      it('should return user-friendly validation error', () => {
        const error = new ValidationError('Invalid input')
        const result = handler.getUserFriendlyError(error)
        
        expect(result.title).toBe('Invalid Input')
        expect(result.suggestions).toContain('Check the GitHub URL format')
      })

      it('should return generic error for unknown types', () => {
        const error = new GitHubError('Unknown error', 'UNKNOWN')
        const result = handler.getUserFriendlyError(error)
        
        expect(result.title).toBe('Unexpected Error')
        expect(result.suggestions).toContain('Try refreshing the page')
      })
    })
  })

  describe('Utility Functions', () => {
    describe('withErrorHandling', () => {
      it('should wrap operation with error handling', async () => {
        const operation = vi.fn().mockResolvedValue('success')
        
        const result = await withErrorHandling(operation, 'test operation')
        
        expect(result).toBe('success')
      })

      it('should handle errors in wrapped operation', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Test error'))
        
        await expect(withErrorHandling(operation)).rejects.toThrow()
      })
    })

    describe('withTimeout', () => {
      it('should resolve if operation completes within timeout', async () => {
        const operation = () => Promise.resolve('success')
        
        const result = await withTimeout(operation, 1000)
        
        expect(result).toBe('success')
      })

      it('should reject if operation times out', async () => {
        const operation = () => new Promise(resolve => setTimeout(resolve, 2000))
        
        await expect(withTimeout(operation, 100)).rejects.toThrow('Operation timed out')
      })
    })

    describe('validateResult', () => {
      it('should validate object results', () => {
        const result = { data: 'test' }
        
        expect(validateResult(result, 'object')).toBe(result)
      })

      it('should validate array results', () => {
        const result = [1, 2, 3]
        
        expect(validateResult(result, 'array')).toBe(result)
      })

      it('should throw for null results', () => {
        expect(() => validateResult(null)).toThrow(ValidationError)
      })

      it('should throw for undefined results', () => {
        expect(() => validateResult(undefined)).toThrow(ValidationError)
      })

      it('should throw for wrong type', () => {
        expect(() => validateResult('string', 'object')).toThrow(ValidationError)
      })
    })
  })
})