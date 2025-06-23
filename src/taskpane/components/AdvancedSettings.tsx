import React, { useState } from 'react';
import { AppConfig } from './App';
import './AdvancedSettings.css';

interface AdvancedSettingsProps {
  config: Partial<AppConfig>;
  onChange: (updates: Partial<AppConfig>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  config,
  onChange,
  isOpen,
  onToggle
}) => {
  const [temperature, setTemperature] = useState(config.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens ?? 2000);
  const [topP, setTopP] = useState(config.topP ?? 1.0);
  const [frequencyPenalty, setFrequencyPenalty] = useState(config.frequencyPenalty ?? 0.0);
  const [presencePenalty, setPresencePenalty] = useState(config.presencePenalty ?? 0.0);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || '');

  const handleParameterChange = (param: keyof AppConfig, value: number | string) => {
    const updates = { [param]: value };
    onChange(updates);
    
    // Update local state
    switch (param) {
      case 'temperature':
        setTemperature(value as number);
        break;
      case 'maxTokens':
        setMaxTokens(value as number);
        break;
      case 'topP':
        setTopP(value as number);
        break;
      case 'frequencyPenalty':
        setFrequencyPenalty(value as number);
        break;
      case 'presencePenalty':
        setPresencePenalty(value as number);
        break;
      case 'systemPrompt':
        setSystemPrompt(value as string);
        break;
    }
  };

  const resetToDefaults = () => {
    const defaults = {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      systemPrompt: ''
    };
    
    setTemperature(defaults.temperature);
    setMaxTokens(defaults.maxTokens);
    setTopP(defaults.topP);
    setFrequencyPenalty(defaults.frequencyPenalty);
    setPresencePenalty(defaults.presencePenalty);
    setSystemPrompt(defaults.systemPrompt);
    
    onChange(defaults);
  };

  const parameterDescriptions = {
    temperature: "Controls randomness. Lower values (0.1) are more focused, higher values (1.0) are more creative.",
    maxTokens: "Maximum number of tokens in the response. Higher values allow longer responses.",
    topP: "Alternative to temperature. Lower values (0.1) focus on likely tokens, higher values (1.0) consider more options.",
    frequencyPenalty: "Reduces repetition. Positive values discourage repeated phrases.",
    presencePenalty: "Encourages topic diversity. Positive values discourage repeating topics.",
    systemPrompt: "Custom instructions for the AI. Leave empty to use the default prompt."
  };

  return (
    <div className="advanced-settings">
      <button 
        onClick={onToggle}
        className="advanced-toggle"
        type="button"
      >
        <span>🔧 Advanced Parameters</span>
        <span className={`toggle-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="advanced-content">
          <div className="settings-header">
            <h4>AI Parameters</h4>
            <button 
              onClick={resetToDefaults}
              className="reset-button"
              type="button"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Temperature */}
          <div className="parameter-group">
            <label htmlFor="temperature">
              Temperature: <span className="param-value">{temperature}</span>
            </label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
              className="param-slider"
            />
            <small className="param-description">{parameterDescriptions.temperature}</small>
          </div>

          {/* Max Tokens */}
          <div className="parameter-group">
            <label htmlFor="maxTokens">
              Max Tokens: <span className="param-value">{maxTokens}</span>
            </label>
            <input
              id="maxTokens"
              type="range"
              min="100"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
              className="param-slider"
            />
            <small className="param-description">{parameterDescriptions.maxTokens}</small>
          </div>

          {/* Top P */}
          <div className="parameter-group">
            <label htmlFor="topP">
              Top P: <span className="param-value">{topP}</span>
            </label>
            <input
              id="topP"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={topP}
              onChange={(e) => handleParameterChange('topP', parseFloat(e.target.value))}
              className="param-slider"
            />
            <small className="param-description">{parameterDescriptions.topP}</small>
          </div>

          {/* Frequency Penalty */}
          <div className="parameter-group">
            <label htmlFor="frequencyPenalty">
              Frequency Penalty: <span className="param-value">{frequencyPenalty}</span>
            </label>
            <input
              id="frequencyPenalty"
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={frequencyPenalty}
              onChange={(e) => handleParameterChange('frequencyPenalty', parseFloat(e.target.value))}
              className="param-slider"
            />
            <small className="param-description">{parameterDescriptions.frequencyPenalty}</small>
          </div>

          {/* Presence Penalty */}
          <div className="parameter-group">
            <label htmlFor="presencePenalty">
              Presence Penalty: <span className="param-value">{presencePenalty}</span>
            </label>
            <input
              id="presencePenalty"
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={presencePenalty}
              onChange={(e) => handleParameterChange('presencePenalty', parseFloat(e.target.value))}
              className="param-slider"
            />
            <small className="param-description">{parameterDescriptions.presencePenalty}</small>
          </div>

          {/* System Prompt */}
          <div className="parameter-group">
            <label htmlFor="systemPrompt">
              Custom System Prompt
            </label>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => handleParameterChange('systemPrompt', e.target.value)}
              placeholder="Enter custom instructions for the AI (optional)"
              className="system-prompt-textarea"
              rows={4}
            />
            <small className="param-description">{parameterDescriptions.systemPrompt}</small>
          </div>

          {/* Presets */}
          <div className="parameter-group">
            <label>Quick Presets</label>
            <div className="preset-buttons">
              <button
                type="button"
                onClick={() => onChange({
                  temperature: 0.3,
                  topP: 0.8,
                  frequencyPenalty: 0.1,
                  presencePenalty: 0.1
                })}
                className="preset-btn"
              >
                🎯 Focused
              </button>
              <button
                type="button"
                onClick={() => onChange({
                  temperature: 0.7,
                  topP: 1.0,
                  frequencyPenalty: 0.0,
                  presencePenalty: 0.0
                })}
                className="preset-btn"
              >
                ⚖️ Balanced
              </button>
              <button
                type="button"
                onClick={() => onChange({
                  temperature: 1.0,
                  topP: 1.0,
                  frequencyPenalty: -0.2,
                  presencePenalty: 0.3
                })}
                className="preset-btn"
              >
                🎨 Creative
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 