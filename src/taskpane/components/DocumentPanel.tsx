import React from 'react';
import './DocumentPanel.css';

interface DocumentPanelProps {
  stats: {
    wordCount: number;
    paragraphCount: number;
    pageCount: number;
  };
  selectedText: string;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({ stats, selectedText }) => {
  return (
    <div className="document-panel">
      <div className="document-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.wordCount.toLocaleString()}</span>
          <span className="stat-label">Words</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.paragraphCount}</span>
          <span className="stat-label">Paragraphs</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.pageCount}</span>
          <span className="stat-label">Pages</span>
        </div>
      </div>
      
      {selectedText && (
        <div className="selection-info">
          <div className="selection-header">
            <span className="selection-icon">📄</span>
            <span className="selection-title">Selected Text</span>
            <span className="selection-count">{selectedText.split(' ').length} words</span>
          </div>
          <div className="selection-content">
            {selectedText.length > 200 
              ? `${selectedText.substring(0, 200)}...`
              : selectedText
            }
          </div>
        </div>
      )}
    </div>
  );
}; 