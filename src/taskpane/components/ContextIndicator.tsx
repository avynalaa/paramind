import React from 'react';
import './ContextIndicator.css';

export interface ContextIndicatorProps {
  isScanning: boolean;
  scanReason?: string;
  sectionsScanned?: string[];
  totalTokens?: number;
  primarySection?: string;
}

export const ContextIndicator: React.FC<ContextIndicatorProps> = ({
  isScanning,
  scanReason,
  sectionsScanned = [],
  totalTokens = 0,
  primarySection
}) => {
  if (!isScanning && !scanReason) return null;

  return (
    <div className={`context-indicator ${isScanning ? 'scanning' : 'complete'}`}>
      <div className="context-header">
        <span className="context-icon">
          {isScanning ? '🔍' : '✅'}
        </span>
        <span className="context-title">
          {isScanning ? 'Analyzing Context...' : 'Context Analysis Complete'}
        </span>
      </div>

      {primarySection && (
        <div className="primary-focus">
          <span className="focus-label">📍 Primary Focus:</span>
          <span className="focus-section">{primarySection}</span>
        </div>
      )}

      {scanReason && (
        <div className="scan-reason">
          <span className="reason-label">🎯 Scan Reason:</span>
          <span className="reason-text">{scanReason}</span>
        </div>
      )}

      {sectionsScanned.length > 0 && (
        <div className="sections-scanned">
          <span className="sections-label">📚 Additional Sections:</span>
          <div className="sections-list">
            {sectionsScanned.map((section, index) => (
              <span key={index} className="section-tag">
                {section}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="context-stats">
        <span className="stats-item">
          <span className="stats-icon">📊</span>
          <span className="stats-text">
            ~{Math.round(totalTokens / 1000)}k tokens
          </span>
        </span>
        
        {sectionsScanned.length > 0 && (
          <span className="stats-item">
            <span className="stats-icon">🔗</span>
            <span className="stats-text">
              {sectionsScanned.length + 1} sections
            </span>
          </span>
        )}
      </div>

      {isScanning && (
        <div className="scanning-animation">
          <div className="scanning-bar"></div>
        </div>
      )}
    </div>
  );
}; 