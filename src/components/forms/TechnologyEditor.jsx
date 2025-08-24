import React, { useState, useCallback, useRef } from 'react';

/**
 * Interactive technology stack editor component
 * Allows users to review, modify, add, and remove detected technologies
 */
const TechnologyEditor = ({ 
  detectedTechnologies = [], 
  onModify,
  onConfirm,
  isLoading = false 
}) => {
  const [technologies, setTechnologies] = useState(detectedTechnologies);
  const [selectedTechnologies, setSelectedTechnologies] = useState(new Set());
  const [isAddingTechnology, setIsAddingTechnology] = useState(false);
  const [newTechnology, setNewTechnology] = useState({
    name: '',
    category: 'framework',
    version: '',
    confidence: 1.0,
    source: 'manual',
    evidence: ['User added'],
    isModified: true
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const dragCounter = useRef(0);

  // Handle technology modification
  const handleModifyTechnology = useCallback((id, updates) => {
    const updatedTechnologies = technologies.map(tech => 
      tech.id === id 
        ? { ...tech, ...updates, isModified: true }
        : tech
    );
    setTechnologies(updatedTechnologies);
    onModify?.(updatedTechnologies);
  }, [technologies, onModify]);

  // Handle technology removal
  const handleRemoveTechnology = useCallback((id) => {
    const updatedTechnologies = technologies.filter(tech => tech.id !== id);
    setTechnologies(updatedTechnologies);
    setSelectedTechnologies(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    onModify?.(updatedTechnologies);
  }, [technologies, onModify]);

  // Handle adding new technology
  const handleAddTechnology = useCallback(() => {
    if (!newTechnology.name.trim()) return;

    const technology = {
      ...newTechnology,
      id: `manual-${Date.now()}`,
      name: newTechnology.name.trim()
    };

    const updatedTechnologies = [...technologies, technology];
    setTechnologies(updatedTechnologies);
    setNewTechnology({
      name: '',
      category: 'framework',
      version: '',
      confidence: 1.0,
      source: 'manual',
      evidence: ['User added'],
      isModified: true
    });
    setIsAddingTechnology(false);
    onModify?.(updatedTechnologies);
  }, [newTechnology, technologies, onModify]);

  // Handle bulk selection
  const handleSelectTechnology = useCallback((id) => {
    setSelectedTechnologies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Handle bulk removal
  const handleBulkRemove = useCallback(() => {
    const updatedTechnologies = technologies.filter(tech => !selectedTechnologies.has(tech.id));
    setTechnologies(updatedTechnologies);
    setSelectedTechnologies(new Set());
    onModify?.(updatedTechnologies);
  }, [technologies, selectedTechnologies, onModify]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, technology) => {
    setDraggedItem(technology);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.dataTransfer.setDragImage(e.target, 0, 0);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, targetTechnology) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetTechnology.id) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = technologies.findIndex(tech => tech.id === draggedItem.id);
    const targetIndex = technologies.findIndex(tech => tech.id === targetTechnology.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newTechnologies = [...technologies];
    const [removed] = newTechnologies.splice(draggedIndex, 1);
    newTechnologies.splice(targetIndex, 0, removed);

    setTechnologies(newTechnologies);
    setDraggedItem(null);
    onModify?.(newTechnologies);
  }, [draggedItem, technologies, onModify]);

  // Get confidence level display
  const getConfidenceDisplay = (confidence) => {
    if (confidence >= 0.8) return { text: 'High', color: 'text-green-600' };
    if (confidence >= 0.5) return { text: 'Medium', color: 'text-yellow-600' };
    return { text: 'Low', color: 'text-red-600' };
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      language: '🔤',
      framework: '🏗️',
      database: '🗄️',
      tool: '🔧',
      service: '☁️'
    };
    return icons[category] || '📦';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review Technology Stack
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and modify the detected technologies for your project
          </p>
        </div>
        
        {selectedTechnologies.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTechnologies.size} selected
            </span>
            <button
              onClick={handleBulkRemove}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              Remove Selected
            </button>
          </div>
        )}
      </div>

      {/* Technology List */}
      <div className="space-y-3">
        {technologies.map((technology) => {
          const confidence = getConfidenceDisplay(technology.confidence);
          const isSelected = selectedTechnologies.has(technology.id);
          
          return (
            <div
              key={technology.id}
              className={`p-4 transition-all duration-200 cursor-move border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              } ${draggedItem?.id === technology.id ? 'opacity-50' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, technology)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, technology)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Selection checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectTechnology(technology.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    aria-label={`Select ${technology.name}`}
                  />
                  
                  {/* Drag handle */}
                  <div className="text-gray-400 cursor-move" aria-label="Drag to reorder">
                    ⋮⋮
                  </div>
                  
                  {/* Technology info */}
                  <div className="flex items-center space-x-2">
                    <span className="text-lg" role="img" aria-label={technology.category}>
                      {getCategoryIcon(technology.category)}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {technology.name}
                        </span>
                        {technology.version && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            v{technology.version}
                          </span>
                        )}
                        {technology.isModified && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Modified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="capitalize">{technology.category}</span>
                        <span className={`font-medium ${confidence.color}`}>
                          {confidence.text} confidence
                        </span>
                        <span>Source: {technology.source.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {/* Evidence tooltip */}
                  <div className="relative group">
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1"
                      aria-label="View evidence"
                    >
                      ℹ️
                    </button>
                    <div className="absolute right-0 top-8 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="text-sm">
                        <div className="font-medium mb-1">Evidence:</div>
                        <ul className="space-y-1">
                          {technology.evidence.map((evidence, index) => (
                            <li key={`${technology.id}-evidence-${index}`} className="text-gray-600 dark:text-gray-400">
                              • {evidence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveTechnology(technology.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                    aria-label={`Remove ${technology.name}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Technology Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        {!isAddingTechnology ? (
          <button
            onClick={() => setIsAddingTechnology(true)}
            className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            + Add Technology
          </button>
        ) : (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Add New Technology
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tech-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Technology Name *
                </label>
                <input
                  id="tech-name"
                  type="text"
                  value={newTechnology.name}
                  onChange={(e) => setNewTechnology(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., React, Node.js, PostgreSQL"
                />
              </div>
              
              <div>
                <label htmlFor="tech-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  id="tech-category"
                  value={newTechnology.category}
                  onChange={(e) => setNewTechnology(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="language">Language</option>
                  <option value="framework">Framework</option>
                  <option value="database">Database</option>
                  <option value="tool">Tool</option>
                  <option value="service">Service</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="tech-version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version (optional)
                </label>
                <input
                  id="tech-version"
                  type="text"
                  value={newTechnology.version}
                  onChange={(e) => setNewTechnology(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 18.2.0"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setIsAddingTechnology(false);
                  setNewTechnology({
                    name: '',
                    category: 'framework',
                    version: '',
                    confidence: 1.0,
                    source: 'manual',
                    evidence: ['User added'],
                    isModified: true
                  });
                }}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTechnology}
                disabled={!newTechnology.name.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Technology
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {technologies.length} technologies selected
          {technologies.some(t => t.isModified) && (
            <span className="ml-2 text-blue-600">• Modified</span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setTechnologies(detectedTechnologies);
              setSelectedTechnologies(new Set());
              onModify?.(detectedTechnologies);
            }}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset Changes
          </button>
          <button
            onClick={() => onConfirm?.(technologies)}
            disabled={isLoading || technologies.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : 'Continue to Recommendations'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnologyEditor;