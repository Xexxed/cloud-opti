import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TechnologyEditor from '../TechnologyEditor.jsx';

// Mock data
const mockDetectedTechnologies = [
  {
    id: 'tech-1',
    name: 'React',
    category: 'framework',
    version: '18.2.0',
    confidence: 0.95,
    source: 'package_file',
    evidence: ['package.json: "react": "^18.2.0"', 'JSX files detected'],
    isModified: false
  },
  {
    id: 'tech-2',
    name: 'Node.js',
    category: 'language',
    version: '18.0.0',
    confidence: 0.85,
    source: 'package_file',
    evidence: ['package.json: "node": ">=18.0.0"'],
    isModified: false
  },
  {
    id: 'tech-3',
    name: 'PostgreSQL',
    category: 'database',
    confidence: 0.7,
    source: 'config_file',
    evidence: ['database.yml: postgresql adapter'],
    isModified: false
  }
];

describe('TechnologyEditor', () => {
  let mockOnModify;
  let mockOnConfirm;
  let user;

  beforeEach(() => {
    mockOnModify = vi.fn();
    mockOnConfirm = vi.fn();
    user = userEvent.setup();
  });

  describe('Rendering', () => {
    it('renders the component with detected technologies', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Review Technology Stack')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    });

    it('displays technology details correctly', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      // Check React details
      expect(screen.getByText('v18.2.0')).toBeInTheDocument();
      expect(screen.getAllByText('High confidence')).toHaveLength(2);
      expect(screen.getAllByText('Source: package file')).toHaveLength(2);
    });

    it('shows confidence levels with correct colors', () => {
      const technologiesWithDifferentConfidence = [
        { ...mockDetectedTechnologies[0], confidence: 0.9 }, // High
        { ...mockDetectedTechnologies[1], confidence: 0.6 }, // Medium
        { ...mockDetectedTechnologies[2], confidence: 0.3 }  // Low
      ];

      render(
        <TechnologyEditor
          detectedTechnologies={technologiesWithDifferentConfidence}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('High confidence')).toHaveClass('text-green-600');
      expect(screen.getByText('Medium confidence')).toHaveClass('text-yellow-600');
      expect(screen.getByText('Low confidence')).toHaveClass('text-red-600');
    });

    it('displays category icons correctly', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      // Check that category icons are present (emojis)
      const frameworkIcon = screen.getByLabelText('framework');
      const languageIcon = screen.getByLabelText('language');
      const databaseIcon = screen.getByLabelText('database');

      expect(frameworkIcon).toBeInTheDocument();
      expect(languageIcon).toBeInTheDocument();
      expect(databaseIcon).toBeInTheDocument();
    });
  });

  describe('Technology Selection', () => {
    it('allows selecting individual technologies', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      const reactCheckbox = screen.getByLabelText('Select React');
      await user.click(reactCheckbox);

      expect(reactCheckbox).toBeChecked();
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('shows bulk actions when technologies are selected', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      const reactCheckbox = screen.getByLabelText('Select React');
      const nodeCheckbox = screen.getByLabelText('Select Node.js');

      await user.click(reactCheckbox);
      await user.click(nodeCheckbox);

      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getByText('Remove Selected')).toBeInTheDocument();
    });

    it('performs bulk removal of selected technologies', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      // Select React and Node.js
      await user.click(screen.getByLabelText('Select React'));
      await user.click(screen.getByLabelText('Select Node.js'));

      // Remove selected
      await user.click(screen.getByText('Remove Selected'));

      // Should only have PostgreSQL left
      expect(screen.queryByText('React')).not.toBeInTheDocument();
      expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();

      expect(mockOnModify).toHaveBeenCalledWith([mockDetectedTechnologies[2]]);
    });
  });

  describe('Technology Removal', () => {
    it('removes individual technologies', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      const removeReactButton = screen.getByLabelText('Remove React');
      await user.click(removeReactButton);

      expect(screen.queryByText('React')).not.toBeInTheDocument();
      expect(mockOnModify).toHaveBeenCalledWith([
        mockDetectedTechnologies[1],
        mockDetectedTechnologies[2]
      ]);
    });
  });

  describe('Adding Technologies', () => {
    it('shows add technology form when button is clicked', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByText('+ Add Technology'));

      expect(screen.getByText('Add New Technology')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., React, Node.js, PostgreSQL')).toBeInTheDocument();
    });

    it('adds a new technology with valid input', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      // Open add form
      await user.click(screen.getByText('+ Add Technology'));

      // Fill in the form
      await user.type(screen.getByPlaceholderText('e.g., React, Node.js, PostgreSQL'), 'Express.js');
      await user.selectOptions(screen.getByDisplayValue('Framework'), 'framework');
      await user.type(screen.getByPlaceholderText('e.g., 18.2.0'), '4.18.0');

      // Submit
      await user.click(screen.getByText('Add Technology'));

      expect(screen.getByText('Express.js')).toBeInTheDocument();
      expect(mockOnModify).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...mockDetectedTechnologies,
          expect.objectContaining({
            name: 'Express.js',
            category: 'framework',
            version: '4.18.0',
            confidence: 1.0,
            source: 'manual',
            isModified: true
          })
        ])
      );
    });

    it('prevents adding technology with empty name', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByText('+ Add Technology'));

      const addButton = screen.getByText('Add Technology');
      expect(addButton).toBeDisabled();

      // Type and clear the name
      const nameInput = screen.getByPlaceholderText('e.g., React, Node.js, PostgreSQL');
      await user.type(nameInput, 'Test');
      expect(addButton).not.toBeDisabled();

      await user.clear(nameInput);
      expect(addButton).toBeDisabled();
    });

    it('cancels adding technology', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByText('+ Add Technology'));
      await user.type(screen.getByPlaceholderText('e.g., React, Node.js, PostgreSQL'), 'Test');
      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Add New Technology')).not.toBeInTheDocument();
      expect(screen.getByText('+ Add Technology')).toBeInTheDocument();
    });
  });

  describe('Evidence Display', () => {
    it('shows evidence tooltip on hover', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      const evidenceButtons = screen.getAllByLabelText('View evidence');
      await user.hover(evidenceButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Evidence:')).toHaveLength(3);
        expect(screen.getByText('• package.json: "react": "^18.2.0"')).toBeInTheDocument();
        expect(screen.getByText('• JSX files detected')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag start event', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      const reactCard = screen.getByText('React').closest('[draggable="true"]');
      
      // Create a mock drag event
      const dragStartEvent = new Event('dragstart', { bubbles: true });
      Object.defineProperty(dragStartEvent, 'dataTransfer', {
        value: {
          effectAllowed: '',
          setData: vi.fn(),
          setDragImage: vi.fn()
        }
      });

      fireEvent(reactCard, dragStartEvent);

      expect(dragStartEvent.dataTransfer.effectAllowed).toBe('move');
    });

    it('handles drag over event', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      const reactCard = screen.getByText('React').closest('[draggable="true"]');
      
      const dragOverEvent = new Event('dragover', { bubbles: true });
      Object.defineProperty(dragOverEvent, 'dataTransfer', {
        value: { dropEffect: '' }
      });
      dragOverEvent.preventDefault = vi.fn();

      fireEvent(reactCard, dragOverEvent);

      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
      expect(dragOverEvent.dataTransfer.dropEffect).toBe('move');
    });
  });

  describe('Confirmation Actions', () => {
    it('shows technology count and modified status', () => {
      const modifiedTechnologies = [
        { ...mockDetectedTechnologies[0], isModified: true },
        ...mockDetectedTechnologies.slice(1)
      ];

      render(
        <TechnologyEditor
          detectedTechnologies={modifiedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('3 technologies selected')).toBeInTheDocument();
      expect(screen.getByText('• Modified')).toBeInTheDocument();
    });

    it('resets changes when reset button is clicked', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      // Remove a technology first
      await user.click(screen.getByLabelText('Remove React'));

      // Reset changes
      await user.click(screen.getByText('Reset Changes'));

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(mockOnModify).toHaveBeenLastCalledWith(mockDetectedTechnologies);
    });

    it('calls onConfirm with current technologies', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByText('Continue to Recommendations'));

      expect(mockOnConfirm).toHaveBeenCalledWith(mockDetectedTechnologies);
    });

    it('disables confirm button when loading', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      );

      const confirmButton = screen.getByText('Processing...');
      expect(confirmButton).toBeDisabled();
    });

    it('disables confirm button when no technologies', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={[]}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByText('Continue to Recommendations');
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByLabelText('Select React')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove React')).toBeInTheDocument();
      expect(screen.getAllByLabelText('View evidence')).toHaveLength(3);
      expect(screen.getAllByLabelText('Drag to reorder')).toHaveLength(3);
    });

    it('has proper form labels', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={mockDetectedTechnologies}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByText('+ Add Technology'));

      expect(screen.getByLabelText('Technology Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Version (optional)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty detected technologies array', () => {
      render(
        <TechnologyEditor
          detectedTechnologies={[]}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('0 technologies selected')).toBeInTheDocument();
      expect(screen.getByText('+ Add Technology')).toBeInTheDocument();
    });

    it('handles undefined props gracefully', () => {
      render(<TechnologyEditor />);

      expect(screen.getByText('Review Technology Stack')).toBeInTheDocument();
      expect(screen.getByText('0 technologies selected')).toBeInTheDocument();
    });

    it('trims whitespace from technology names', async () => {
      render(
        <TechnologyEditor
          detectedTechnologies={[]}
          onModify={mockOnModify}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByText('+ Add Technology'));
      await user.type(screen.getByPlaceholderText('e.g., React, Node.js, PostgreSQL'), '  Express.js  ');
      await user.click(screen.getByText('Add Technology'));

      expect(mockOnModify).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Express.js' // Should be trimmed
        })
      ]);
    });
  });
});