/**
 * GitHub URL validation utilities
 * Provides comprehensive validation for GitHub repository URLs
 */

/**
 * Validates GitHub repository URL format and structure
 * @param {string} url - URL to validate
 * @returns {object} - Validation result with details
 */
export function validateGitHubUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required',
      details: null
    };
  }

  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    return {
      isValid: false,
      error: 'URL cannot be empty',
      details: null
    };
  }

  // Check for basic URL structure
  const urlPatterns = [
    // Full HTTPS URLs
    /^https:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/.*)?$/,
    // HTTP URLs (less secure but valid)
    /^http:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/.*)?$/,
    // GitHub URLs without protocol
    /^github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/.*)?$/,
    // Short format (owner/repo)
    /^([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?$/
  ];

  let match = null;
  let matchedPattern = null;

  for (let i = 0; i < urlPatterns.length; i++) {
    match = trimmedUrl.match(urlPatterns[i]);
    if (match) {
      matchedPattern = i;
      break;
    }
  }

  if (!match) {
    return {
      isValid: false,
      error: 'Invalid GitHub URL format. Expected format: https://github.com/owner/repository',
      details: {
        providedUrl: trimmedUrl,
        expectedFormats: [
          'https://github.com/owner/repository',
          'github.com/owner/repository',
          'owner/repository'
        ]
      }
    };
  }

  const owner = match[1];
  const repo = match[2];

  // Validate owner name
  const ownerValidation = validateOwnerName(owner);
  if (!ownerValidation.isValid) {
    return {
      isValid: false,
      error: `Invalid owner name: ${ownerValidation.error}`,
      details: {
        owner,
        repo,
        ownerError: ownerValidation.error
      }
    };
  }

  // Validate repository name
  const repoValidation = validateRepositoryName(repo);
  if (!repoValidation.isValid) {
    return {
      isValid: false,
      error: `Invalid repository name: ${repoValidation.error}`,
      details: {
        owner,
        repo,
        repoError: repoValidation.error
      }
    };
  }

  // Normalize URL to standard format
  const normalizedUrl = `https://github.com/${owner}/${repo}`;

  return {
    isValid: true,
    error: null,
    details: {
      owner,
      repo,
      normalizedUrl,
      originalUrl: trimmedUrl,
      patternMatched: matchedPattern
    }
  };
}

/**
 * Validates GitHub owner/organization name
 * @param {string} owner - Owner name to validate
 * @returns {object} - Validation result
 */
export function validateOwnerName(owner) {
  if (!owner || typeof owner !== 'string') {
    return {
      isValid: false,
      error: 'Owner name is required'
    };
  }

  const trimmedOwner = owner.trim();

  if (trimmedOwner.length === 0) {
    return {
      isValid: false,
      error: 'Owner name cannot be empty'
    };
  }

  if (trimmedOwner.length > 39) {
    return {
      isValid: false,
      error: 'Owner name cannot exceed 39 characters'
    };
  }

  // GitHub username rules
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/.test(trimmedOwner)) {
    return {
      isValid: false,
      error: 'Owner name can only contain alphanumeric characters, hyphens, periods, and underscores. Must start and end with alphanumeric character.'
    };
  }

  // Cannot start or end with hyphen
  if (trimmedOwner.startsWith('-') || trimmedOwner.endsWith('-')) {
    return {
      isValid: false,
      error: 'Owner name cannot start or end with a hyphen'
    };
  }

  // Cannot have consecutive hyphens
  if (trimmedOwner.includes('--')) {
    return {
      isValid: false,
      error: 'Owner name cannot contain consecutive hyphens'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates GitHub repository name
 * @param {string} repo - Repository name to validate
 * @returns {object} - Validation result
 */
export function validateRepositoryName(repo) {
  if (!repo || typeof repo !== 'string') {
    return {
      isValid: false,
      error: 'Repository name is required'
    };
  }

  const trimmedRepo = repo.trim();

  if (trimmedRepo.length === 0) {
    return {
      isValid: false,
      error: 'Repository name cannot be empty'
    };
  }

  if (trimmedRepo.length > 100) {
    return {
      isValid: false,
      error: 'Repository name cannot exceed 100 characters'
    };
  }

  // GitHub repository name rules
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmedRepo)) {
    return {
      isValid: false,
      error: 'Repository name can only contain alphanumeric characters, hyphens, periods, and underscores'
    };
  }

  // Cannot be just dots
  if (/^\.+$/.test(trimmedRepo)) {
    return {
      isValid: false,
      error: 'Repository name cannot consist only of dots'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Extracts owner and repository name from various GitHub URL formats
 * @param {string} url - GitHub URL
 * @returns {object} - Extracted owner and repo, or null if invalid
 */
export function parseGitHubUrl(url) {
  const validation = validateGitHubUrl(url);
  
  if (!validation.isValid) {
    return {
      owner: null,
      repo: null,
      error: validation.error
    };
  }

  return {
    owner: validation.details.owner,
    repo: validation.details.repo,
    normalizedUrl: validation.details.normalizedUrl,
    error: null
  };
}

/**
 * Checks if URL is a valid GitHub repository URL (basic format check)
 * @param {string} url - URL to check
 * @returns {boolean} - True if valid format
 */
export function isGitHubUrl(url) {
  return validateGitHubUrl(url).isValid;
}

/**
 * Normalizes GitHub URL to standard HTTPS format
 * @param {string} url - GitHub URL to normalize
 * @returns {string|null} - Normalized URL or null if invalid
 */
export function normalizeGitHubUrl(url) {
  const validation = validateGitHubUrl(url);
  return validation.isValid ? validation.details.normalizedUrl : null;
}

/**
 * Validates multiple GitHub URLs
 * @param {Array<string>} urls - Array of URLs to validate
 * @returns {Array<object>} - Array of validation results
 */
export function validateMultipleGitHubUrls(urls) {
  if (!Array.isArray(urls)) {
    return [];
  }

  return urls.map((url, index) => ({
    index,
    url,
    ...validateGitHubUrl(url)
  }));
}

export default {
  validateGitHubUrl,
  validateOwnerName,
  validateRepositoryName,
  parseGitHubUrl,
  isGitHubUrl,
  normalizeGitHubUrl,
  validateMultipleGitHubUrls
};