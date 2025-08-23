/**
 * Error handling utilities for GitHub API and network operations
 * Provides comprehensive error classification, retry logic, and user-friendly messages
 */

/**
 * Custom error classes for different types of GitHub API errors
 */
export class GitHubError extends Error {
  constructor(message, type, statusCode = null, retryable = false) {
    super(message);
    this.name = 'GitHubError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.timestamp = new Date();
  }
}

export class NetworkError extends GitHubError {
  constructor(message, originalError = null) {
    super(message, 'NETWORK_ERROR', null, true);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

export class RateLimitError extends GitHubError {
  constructor(message, resetTime = null) {
    super(message, 'RATE_LIMIT_ERROR', 429, true);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
  }
}

export class AuthenticationError extends GitHubError {
  constructor(message) {
    super(message, 'AUTHENTICATION_ERROR', 401, false);
    this.name = 'AuthenticationError';
  }
}

export class RepositoryNotFoundError extends GitHubError {
  constructor(message, repositoryUrl = null) {
    super(message, 'REPOSITORY_NOT_FOUND', 404, false);
    this.name = 'RepositoryNotFoundError';
    this.repositoryUrl = repositoryUrl;
  }
}

export class ValidationError extends GitHubError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', 400, false);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Error handler class for GitHub operations
 */
export class GitHubErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.retryableStatusCodes = new Set([408, 429, 500, 502, 503, 504]);
  }

  /**
   * Handles and classifies errors from GitHub API responses
   * @param {Error|Response} error - Error or Response object
   * @param {string} context - Context where error occurred
   * @returns {GitHubError} - Classified error
   */
  handleError(error, context = 'GitHub API') {
    // Handle fetch Response objects
    if (error instanceof Response) {
      return this.handleResponseError(error, context);
    }

    // Handle network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new NetworkError(
        'Network connection failed. Please check your internet connection.',
        error
      );
    }

    // Handle timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new NetworkError(
        'Request timed out. The GitHub API may be slow to respond.',
        error
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, error.field);
    }

    // Handle other custom errors
    if (error instanceof GitHubError) {
      return error;
    }

    // Generic error fallback
    return new GitHubError(
      `Unexpected error in ${context}: ${error.message}`,
      'UNKNOWN_ERROR',
      null,
      false
    );
  }

  /**
   * Handles HTTP response errors from GitHub API
   * @param {Response} response - Fetch Response object
   * @param {string} context - Context where error occurred
   * @returns {GitHubError} - Classified error
   */
  async handleResponseError(response, context) {
    const statusCode = response.status;
    
    try {
      const errorData = await response.json();
      const message = errorData.message || `HTTP ${statusCode} error`;
      
      switch (statusCode) {
        case 401:
          return new AuthenticationError(
            'Authentication failed. Please check your GitHub token or repository permissions.'
          );
        
        case 403:
          if (message.includes('rate limit')) {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            return new RateLimitError(
              'GitHub API rate limit exceeded. Please try again later.',
              resetTime ? new Date(parseInt(resetTime) * 1000) : null
            );
          }
          return new AuthenticationError(
            'Access forbidden. The repository may be private or you may lack permissions.'
          );
        
        case 404:
          return new RepositoryNotFoundError(
            'Repository not found. Please check the URL and ensure the repository exists and is accessible.'
          );
        
        case 422:
          return new ValidationError(
            `Validation failed: ${message}`,
            errorData.errors?.[0]?.field
          );
        
        default:
          if (this.retryableStatusCodes.has(statusCode)) {
            return new GitHubError(
              `GitHub API temporarily unavailable (${statusCode}): ${message}`,
              'API_ERROR',
              statusCode,
              true
            );
          }
          
          return new GitHubError(
            `GitHub API error (${statusCode}): ${message}`,
            'API_ERROR',
            statusCode,
            false
          );
      }
    } catch (parseError) {
      // If we can't parse the error response, create a generic error
      return new GitHubError(
        `HTTP ${statusCode} error from GitHub API`,
        'API_ERROR',
        statusCode,
        this.retryableStatusCodes.has(statusCode)
      );
    }
  }

  /**
   * Executes an operation with retry logic for retryable errors
   * @param {Function} operation - Async operation to execute
   * @param {string} context - Context for error handling
   * @param {number} attempt - Current attempt number (internal)
   * @returns {Promise} - Operation result
   */
  async executeWithRetry(operation, context = 'GitHub operation', attempt = 1) {
    try {
      return await operation();
    } catch (error) {
      const handledError = this.handleError(error, context);
      
      // Don't retry if not retryable or max attempts reached
      if (!handledError.retryable || attempt >= this.maxRetries) {
        throw handledError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        this.baseDelay * Math.pow(2, attempt - 1),
        this.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      console.warn(
        `${context} failed (attempt ${attempt}/${this.maxRetries}). Retrying in ${Math.round(jitteredDelay)}ms...`,
        handledError.message
      );

      await this.sleep(jitteredDelay);
      return this.executeWithRetry(operation, context, attempt + 1);
    }
  }

  /**
   * Utility function to sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets user-friendly error message for display
   * @param {GitHubError} error - Error to get message for
   * @returns {object} - User-friendly error information
   */
  getUserFriendlyError(error) {
    const baseInfo = {
      title: 'Error',
      message: error.message,
      type: error.type,
      canRetry: error.retryable,
      timestamp: error.timestamp
    };

    switch (error.type) {
      case 'NETWORK_ERROR':
        return {
          ...baseInfo,
          title: 'Connection Error',
          suggestions: [
            'Check your internet connection',
            'Try again in a few moments',
            'Verify the GitHub URL is correct'
          ]
        };

      case 'RATE_LIMIT_ERROR':
        const resetTime = error.resetTime;
        const waitTime = resetTime ? Math.ceil((resetTime - new Date()) / 1000 / 60) : 60;
        return {
          ...baseInfo,
          title: 'Rate Limit Exceeded',
          suggestions: [
            `Wait ${waitTime} minutes before trying again`,
            'Consider using a GitHub personal access token for higher limits',
            'Try analyzing a different repository'
          ]
        };

      case 'AUTHENTICATION_ERROR':
        return {
          ...baseInfo,
          title: 'Access Denied',
          suggestions: [
            'Ensure the repository is public',
            'Check if you have access to private repositories',
            'Verify your GitHub token if using one'
          ]
        };

      case 'REPOSITORY_NOT_FOUND':
        return {
          ...baseInfo,
          title: 'Repository Not Found',
          suggestions: [
            'Double-check the repository URL',
            'Ensure the repository exists and is accessible',
            'Check for typos in the owner or repository name'
          ]
        };

      case 'VALIDATION_ERROR':
        return {
          ...baseInfo,
          title: 'Invalid Input',
          suggestions: [
            'Check the GitHub URL format',
            'Ensure the URL points to a valid repository',
            'Try using the format: https://github.com/owner/repository'
          ]
        };

      default:
        return {
          ...baseInfo,
          title: 'Unexpected Error',
          suggestions: [
            'Try refreshing the page',
            'Check if GitHub is experiencing issues',
            'Contact support if the problem persists'
          ]
        };
    }
  }
}

/**
 * Default error handler instance
 */
export const defaultErrorHandler = new GitHubErrorHandler();

/**
 * Utility functions for common error handling patterns
 */

/**
 * Wraps a GitHub API operation with error handling
 * @param {Function} operation - Async operation to wrap
 * @param {string} context - Context for error messages
 * @returns {Promise} - Wrapped operation result
 */
export async function withErrorHandling(operation, context = 'GitHub operation') {
  return defaultErrorHandler.executeWithRetry(operation, context);
}

/**
 * Creates a timeout wrapper for operations
 * @param {Function} operation - Operation to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} - Operation with timeout
 */
export function withTimeout(operation, timeoutMs = 10000) {
  return Promise.race([
    operation(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

/**
 * Validates and normalizes GitHub operation results
 * @param {any} result - Operation result to validate
 * @param {string} expectedType - Expected result type
 * @returns {any} - Validated result
 */
export function validateResult(result, expectedType = 'object') {
  if (result === null || result === undefined) {
    throw new ValidationError('Operation returned null or undefined result');
  }

  if (expectedType === 'object' && typeof result !== 'object') {
    throw new ValidationError(`Expected object result, got ${typeof result}`);
  }

  if (expectedType === 'array' && !Array.isArray(result)) {
    throw new ValidationError(`Expected array result, got ${typeof result}`);
  }

  return result;
}

export default {
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
};