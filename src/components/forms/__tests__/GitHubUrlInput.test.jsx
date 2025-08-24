import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import GitHubUrlInput from '../GitHubUrlInput';
import { validateGitHubUrl } from '@/lib/github/urlValidation';
import { GitHubService } from '@/lib/github/GitHubService';

// Mock the GitHub validation utilities
vi.mock('@/lib/github/urlValidation');
vi.mock('@/lib/github/GitHubService');

describe('GitHubUrlInput', () => {
  let mockOnChange;
  let mockOnValidation;
  let mockGitHubService;

  beforeEach(() => {
    mockOnChange = vi.fn();
    mockOnValidation = vi.fn();
    
    // Mock GitHubService
    mockGitHubService = {
      validateRepository: vi.fn()
    };
    GitHubService.mockImplementation(() => mockGitHubService);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'url');
      expect(input).toHaveAttribute('placeholder', 'Enter GitHub repository URL (e.g., https://github.com/owner/repo)');
    });

    it('renders with custom props', () => {
      render(
        <GitHubUrlInput
          value="https://github.com/test/repo"
          placeholder="Custom placeholder"
          disabled={true}
          id="custom-id"
          aria-label="Custom label"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('https://github.com/test/repo');
      expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('id', 'custom-id');
      expect(input).toHaveAttribute('aria-label', 'Custom label');
    });

    it('applies custom className', () => {
      render(<GitHubUrlInput className="custom-class" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('Input Handling', () => {
    it('calls onChange when input value changes', async () => {
      const user = userEvent.setup();
      render(<GitHubUrlInput onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(mockOnChange).toHaveBeenCalledWith('test');
    });

    it('updates internal state when value prop changes', () => {
      const { rerender } = render(<GitHubUrlInput value="initial" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');
      
      rerender(<GitHubUrlInput value="updated" />);
      expect(input).toHaveValue('updated');
    });

    it('handles focus and blur events', async () => {
      const user = userEvent.setup();
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(input).not.toHaveFocus();
    });
  });

  describe('URL Format Validation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('validates URL format on input with debouncing', async () => {
      validateGitHubUrl.mockReturnValue({
        isValid: true,
        error: null,
        details: { owner: 'test', repo: 'repo', normalizedUrl: 'https://github.com/test/repo' }
      });
      
      mockGitHubService.validateRepository.mockResolvedValue({
        isValid: true,
        isAccessible: true,
        repository: { fullName: 'test/repo', language: 'JavaScript' },
        error: null
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput onValidation={mockOnValidation} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/repo');
      
      // Validation should not be called immediately (debounced)
      expect(validateGitHubUrl).not.toHaveBeenCalled();
      
      // Advance timers to trigger debounced validation
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(validateGitHubUrl).toHaveBeenCalledWith('https://github.com/test/repo');
      });
    });

    it('shows error for invalid URL format', async () => {
      validateGitHubUrl.mockReturnValue({
        isValid: false,
        error: 'Invalid GitHub URL format',
        details: null
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput onValidation={mockOnValidation} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid-url');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Invalid GitHub URL format')).toBeInTheDocument();
      });
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('validates immediately on blur', async () => {
      validateGitHubUrl.mockReturnValue({
        isValid: true,
        error: null,
        details: { owner: 'test', repo: 'repo' }
      });
      
      mockGitHubService.validateRepository.mockResolvedValue({
        isValid: true,
        isAccessible: true,
        repository: { fullName: 'test/repo' },
        error: null
      });

      const user = userEvent.setup();
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/repo');
      await user.tab(); // Trigger blur
      
      await waitFor(() => {
        expect(validateGitHubUrl).toHaveBeenCalledWith('https://github.com/test/repo');
      });
    });
  });

  describe('Repository Accessibility Checking', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      validateGitHubUrl.mockReturnValue({
        isValid: true,
        error: null,
        details: { owner: 'test', repo: 'repo' }
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('checks repository accessibility after format validation', async () => {
      mockGitHubService.validateRepository.mockResolvedValue({
        isValid: true,
        isAccessible: true,
        repository: { fullName: 'test/repo', language: 'JavaScript' },
        error: null
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput onValidation={mockOnValidation} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/repo');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(mockGitHubService.validateRepository).toHaveBeenCalledWith('https://github.com/test/repo');
      });
    });

    it('shows error for inaccessible repository', async () => {
      mockGitHubService.validateRepository.mockResolvedValue({
        isValid: true,
        isAccessible: false,
        repository: null,
        error: 'Repository not found or is private'
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/private-repo');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Repository not found or is private')).toBeInTheDocument();
      });
    });

    it('shows success message for accessible repository', async () => {
      mockGitHubService.validateRepository.mockResolvedValue({
        isValid: true,
        isAccessible: true,
        repository: { 
          fullName: 'test/repo', 
          language: 'JavaScript',
          isPrivate: false
        },
        error: null
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/repo');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Repository found:/)).toBeInTheDocument();
        expect(screen.getByText('test/repo')).toBeInTheDocument();
        expect(screen.getByText('Primary language: JavaScript')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      validateGitHubUrl.mockReturnValue({
        isValid: true,
        error: null,
        details: { owner: 'test', repo: 'repo' }
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows loading indicator during validation', async () => {
      // Create a promise that we can control
      let resolveValidation;
      const validationPromise = new Promise(resolve => {
        resolveValidation = resolve;
      });
      
      mockGitHubService.validateRepository.mockReturnValue(validationPromise);

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/repo');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByRole('textbox').parentElement.querySelector('.animate-spin')).toBeInTheDocument();
      });
      
      // Resolve the validation
      act(() => {
        resolveValidation({
          isValid: true,
          isAccessible: true,
          repository: { fullName: 'test/repo' },
          error: null
        });
      });
      
      // Loading indicator should disappear
      await waitFor(() => {
        expect(screen.getByRole('textbox').parentElement.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes', () => {
      render(
        <GitHubUrlInput 
          id="test-input"
          aria-label="Test label"
          aria-describedby="external-description"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Test label');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('announces validation errors to screen readers', async () => {
      validateGitHubUrl.mockReturnValue({
        isValid: false,
        error: 'Invalid URL format',
        details: null
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('provides status updates for screen readers', async () => {
      validateGitHubUrl.mockReturnValue({
        isValid: true,
        error: null,
        details: { owner: 'test', repo: 'repo' }
      });
      
      mockGitHubService.validateRepository.mockResolvedValue({
        isValid: true,
        isAccessible: true,
        repository: { fullName: 'test/repo' },
        error: null
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/repo');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        const statusElement = screen.getByText(/Valid repository: test\/repo/);
        expect(statusElement.parentElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<GitHubUrlInput />);
      
      const input = screen.getByRole('textbox');
      
      // Tab to input
      await user.tab();
      expect(input).toHaveFocus();
      
      // Type in input
      await user.keyboard('test');
      expect(input).toHaveValue('test');
      
      // Tab away
      await user.tab();
      expect(input).not.toHaveFocus();
    });

    it('supports auto-focus when requested', () => {
      render(<GitHubUrlInput autoFocus={true} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      validateGitHubUrl.mockReturnValue({
        isValid: true,
        error: null,
        details: { owner: 'test', repo: 'repo' }
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('handles network errors gracefully', async () => {
      mockGitHubService.validateRepository.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput onValidation={mockOnValidation} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/repo');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Validation failed: Network error/)).toBeInTheDocument();
      });
      
      expect(mockOnValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          isAccessible: false,
          error: 'Validation failed: Network error'
        })
      );
    });

    it('clears validation state for empty input', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput onValidation={mockOnValidation} />);
      
      const input = screen.getByRole('textbox');
      
      // Type and then clear
      await user.type(input, 'test');
      await user.clear(input);
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should not show any validation messages
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Validation Callback', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calls onValidation with validation results', async () => {
      validateGitHubUrl.mockReturnValue({
        isValid: true,
        error: null,
        details: { owner: 'test', repo: 'repo' }
      });
      
      mockGitHubService.validateRepository.mockResolvedValue({
        isValid: true,
        isAccessible: true,
        repository: { fullName: 'test/repo' },
        error: null
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<GitHubUrlInput onValidation={mockOnValidation} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'https://github.com/test/repo');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(mockOnValidation).toHaveBeenCalledWith({
          isValidating: false,
          isValid: true,
          isAccessible: true,
          error: null,
          repository: { fullName: 'test/repo' }
        });
      });
    });
  });

  describe('Component Cleanup', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('cleans up timeout on unmount', () => {
      const { unmount } = render(<GitHubUrlInput />);
      
      // Start typing to create a timeout
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Unmount component
      unmount();
      
      // Advance timers - should not cause any issues
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // No assertions needed - just ensuring no errors occur
    });
  });
});