import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AnalysisProgress, { useAnalysisProgress } from '../AnalysisProgress.jsx';

// Mock the accessibility hooks and utilities
vi.mock('@/hooks/useAccessibility', () => ({
  useReducedMotion: vi.fn(() => false)
}));

vi.mock('@/lib/accessibility', () => ({
  ariaUtils: {
    announce: vi.fn()
  }
}));

vi.mock('@/components/accessibility/ReducedMotionWrapper', () => ({
  default: function MockReducedMotionWrapper({ children, className }) {
    return <div className={className}>{children}</div>;
  }
}));

describe('AnalysisProgress', () => {
  const defaultProps = {
    progress: 0,
    currentStage: '',
    stages: [],
    error: null,
    onRetry: null,
    estimatedTimeRemaining: null,
    isComplete: false
  };

  const mockStages = [
    { name: 'Fetching Repository', description: 'Downloading repository contents', duration: 5 },
    { name: 'Analyzing Code', description: 'Detecting technologies and frameworks', duration: 10 },
    { name: 'Processing Dependencies', description: 'Parsing package files', duration: 3 },
    { name: 'Generating Report', description: 'Creating analysis results', duration: 2 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<AnalysisProgress {...defaultProps} />);
      
      expect(screen.getByRole('region', { name: 'Analysis Progress' })).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Analyzing Repository')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays progress percentage correctly', () => {
      render(<AnalysisProgress {...defaultProps} progress={45} />);
      
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45');
    });

    it('shows current stage when provided', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          currentStage="Analyzing Code" 
          progress={30}
        />
      );
      
      expect(screen.getByText('Analyzing Code')).toBeInTheDocument();
    });

    it('displays stages list when provided', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          stages={mockStages}
          currentStage="Analyzing Code"
        />
      );
      
      expect(screen.getByText('Analysis Stages')).toBeInTheDocument();
      mockStages.forEach(stage => {
        expect(screen.getByText(stage.name)).toBeInTheDocument();
        expect(screen.getByText(stage.description)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Animation', () => {
    it('handles progress values outside 0-100 range', () => {
      const { rerender } = render(<AnalysisProgress {...defaultProps} progress={-10} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      rerender(<AnalysisProgress {...defaultProps} progress={150} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Time Estimation', () => {
    it('formats time remaining correctly', () => {
      const { rerender } = render(
        <AnalysisProgress {...defaultProps} estimatedTimeRemaining={30} />
      );
      expect(screen.getByText('30 seconds remaining')).toBeInTheDocument();
      
      rerender(<AnalysisProgress {...defaultProps} estimatedTimeRemaining={90} />);
      expect(screen.getByText('2 minutes remaining')).toBeInTheDocument();
      
      rerender(<AnalysisProgress {...defaultProps} estimatedTimeRemaining={3700} />);
      expect(screen.getByText('1 hour remaining')).toBeInTheDocument();
    });

    it('does not show time remaining when complete', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          estimatedTimeRemaining={30}
          isComplete={true}
        />
      );
      
      expect(screen.queryByText('30 seconds remaining')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message', () => {
      const errorMessage = 'Repository not found';
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error={errorMessage}
        />
      );
      
      expect(screen.getByText('Analysis Error')).toBeInTheDocument();
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      const mockRetry = vi.fn();
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Network error"
          onRetry={mockRetry}
        />
      );
      
      const retryButton = screen.getByRole('button', { name: 'Retry analysis' });
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button when onRetry is not provided', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Network error"
        />
      );
      
      expect(screen.queryByRole('button', { name: 'Retry analysis' })).not.toBeInTheDocument();
    });
  });

  describe('Completion State', () => {
    it('shows completion message', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isComplete={true}
          progress={100}
        />
      );
      
      expect(screen.getByText('Analysis Complete')).toBeInTheDocument();
      expect(screen.getByText('Repository analysis finished successfully. Review the detected technologies below.')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<AnalysisProgress {...defaultProps} progress={45} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Analysis progress: 45% complete');
    });

    it('has screen reader only announcements element', () => {
      render(<AnalysisProgress {...defaultProps} />);
      
      const announcementElement = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
      expect(announcementElement).toBeInTheDocument();
      expect(announcementElement).toHaveClass('sr-only');
    });
  });
});

describe('useAnalysisProgress Hook', () => {
  const TestComponent = ({ initialStages = [] }) => {
    const {
      progress,
      currentStage,
      stages,
      error,
      isComplete,
      estimatedTimeRemaining,
      updateProgress,
      setCurrentStage,
      handleError,
      reset
    } = useAnalysisProgress(initialStages);

    return (
      <div>
        <div data-testid="progress">{progress}</div>
        <div data-testid="current-stage">{currentStage}</div>
        <div data-testid="error">{error || 'none'}</div>
        <div data-testid="complete">{isComplete.toString()}</div>
        <div data-testid="time-remaining">{estimatedTimeRemaining || 'none'}</div>
        <div data-testid="stages-count">{stages.length}</div>
        
        <button onClick={() => updateProgress(50, 'Test Stage')}>Update Progress</button>
        <button onClick={() => setCurrentStage('New Stage')}>Set Stage</button>
        <button onClick={() => handleError('Test Error')}>Set Error</button>
        <button onClick={reset}>Reset</button>
      </div>
    );
  };

  it('initializes with default values', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('progress')).toHaveTextContent('0');
    expect(screen.getByTestId('current-stage')).toHaveTextContent('');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('complete')).toHaveTextContent('false');
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('none');
    expect(screen.getByTestId('stages-count')).toHaveTextContent('0');
  });

  it('initializes with provided stages', () => {
    const initialStages = [
      { name: 'Stage 1', description: 'First stage' },
      { name: 'Stage 2', description: 'Second stage' }
    ];
    
    render(<TestComponent initialStages={initialStages} />);
    
    expect(screen.getByTestId('stages-count')).toHaveTextContent('2');
  });

  it('updates progress and stage', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Update Progress'));
    
    expect(screen.getByTestId('progress')).toHaveTextContent('50');
    expect(screen.getByTestId('current-stage')).toHaveTextContent('Test Stage');
  });

  it('marks analysis as complete when progress reaches 100', () => {
    const TestCompleteComponent = () => {
      const { progress, isComplete, updateProgress } = useAnalysisProgress();
      
      return (
        <div>
          <div data-testid="progress">{progress}</div>
          <div data-testid="complete">{isComplete.toString()}</div>
          <button onClick={() => updateProgress(100)}>Complete</button>
        </div>
      );
    };
    
    render(<TestCompleteComponent />);
    
    fireEvent.click(screen.getByText('Complete'));
    
    expect(screen.getByTestId('progress')).toHaveTextContent('100');
    expect(screen.getByTestId('complete')).toHaveTextContent('true');
  });

  it('handles errors correctly', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Set Error'));
    
    expect(screen.getByTestId('error')).toHaveTextContent('Test Error');
    expect(screen.getByTestId('complete')).toHaveTextContent('false');
  });

  it('resets all state', () => {
    render(<TestComponent />);
    
    // Set some state
    fireEvent.click(screen.getByText('Update Progress'));
    fireEvent.click(screen.getByText('Set Error'));
    
    // Verify state is set
    expect(screen.getByTestId('progress')).toHaveTextContent('50');
    expect(screen.getByTestId('error')).toHaveTextContent('Test Error');
    
    // Reset
    fireEvent.click(screen.getByText('Reset'));
    
    // Verify reset
    expect(screen.getByTestId('progress')).toHaveTextContent('0');
    expect(screen.getByTestId('current-stage')).toHaveTextContent('');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('complete')).toHaveTextContent('false');
  });
});