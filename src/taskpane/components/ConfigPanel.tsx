import React, { useState, useEffect } from 'react';
import { AppConfig } from './App';
import { AIService } from '../services/AIService';
import './ConfigPanel.css';

interface ConfigPanelProps {
  config?: AppConfig;
  onSave: (config: AppConfig) => void;
  onClose: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onSave, onClose }) => {
  const [apiEndpoint, setApiEndpoint] = useState(config?.apiEndpoint || 'https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [model, setModel] = useState(config?.model || 'gpt-4');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);

  const predefinedEndpoints = [
    { name: 'OpenAI', url: 'https://api.openai.com/v1' },
    { name: 'Azure OpenAI', url: 'https://your-resource.openai.azure.com' },
    { name: 'Anthropic', url: 'https://api.anthropic.com' },
    { name: 'Together AI', url: 'https://api.together.xyz/v1' },
    { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
    { name: 'Local (Ollama)', url: 'http://localhost:11434/v1' },
    { name: 'Custom', url: '' }
  ];

  // Fallback models if API fetch fails
  const fallbackModels = [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-3.5-turbo',
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
    'llama-2-70b-chat',
    'mixtral-8x7b-instruct'
  ];

  const handleEndpointChange = (endpoint: string) => {
    setApiEndpoint(endpoint);
    setConnectionStatus('idle');
    setAvailableModels([]); // Clear models when endpoint changes
  };

  const fetchAvailableModels = async () => {
    if (!apiEndpoint || !apiKey) {
      setAvailableModels(fallbackModels);
      return;
    }

    setIsLoadingModels(true);
    try {
      // Create temporary AI service to fetch models
      const tempAIService = new AIService();
      tempAIService.setConfig({ apiEndpoint, apiKey, model: 'temp' });
      
      const models = await tempAIService.getAvailableModels();
      
      if (models.length > 0) {
        setAvailableModels(models);
        // If current model is not in the list, select the first available model
        if (!models.includes(model)) {
          setModel(models[0]);
        }
      } else {
        // Fallback to predefined models
        setAvailableModels(fallbackModels);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setAvailableModels(fallbackModels);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Fetch models when endpoint or API key changes
  useEffect(() => {
    if (apiEndpoint && apiKey) {
      fetchAvailableModels();
    } else {
      setAvailableModels(fallbackModels);
    }
  }, [apiEndpoint, apiKey]);

  const testConnection = async () => {
    if (!apiEndpoint || !apiKey) {
      setConnectionStatus('error');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const response = await fetch(`${apiEndpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (!apiEndpoint || !apiKey || !model) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      apiEndpoint: apiEndpoint.replace(/\/$/, ''), // Remove trailing slash
      apiKey,
      model
    });
  };

  return (
    <div className="config-overlay">
      <div className="config-panel">
        <div className="config-header">
          <h3>AI Provider Configuration</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="config-content">
          <div className="form-group">
            <label htmlFor="endpoint">API Endpoint</label>
            <select 
              id="endpoint"
              value={predefinedEndpoints.find(e => e.url === apiEndpoint)?.name || 'Custom'}
              onChange={(e) => {
                const selected = predefinedEndpoints.find(ep => ep.name === e.target.value);
                if (selected && selected.url) {
                  handleEndpointChange(selected.url);
                }
              }}
              className="form-select"
            >
              {predefinedEndpoints.map(endpoint => (
                <option key={endpoint.name} value={endpoint.name}>
                  {endpoint.name}
                </option>
              ))}
            </select>
            {(predefinedEndpoints.find(e => e.url === apiEndpoint)?.name === 'Custom' || 
              !predefinedEndpoints.find(e => e.url === apiEndpoint)) && (
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => handleEndpointChange(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="form-input"
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Model</label>
            <div className="model-selection">
              {isLoadingModels ? (
                <div className="loading-models">
                  <span>Loading available models...</span>
                </div>
              ) : (
                <>
                  <select
                    id="model"
                    value={useCustomModel ? 'custom' : model}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setUseCustomModel(true);
                      } else {
                        setUseCustomModel(false);
                        setModel(e.target.value);
                      }
                    }}
                    className="form-select"
                  >
                    {availableModels.map(modelName => (
                      <option key={modelName} value={modelName}>
                        {modelName}
                      </option>
                    ))}
                    <option value="custom">Custom Model...</option>
                  </select>
                  
                  {useCustomModel && (
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Enter custom model name"
                      className="form-input"
                      style={{ marginTop: '8px' }}
                    />
                  )}
                </>
              )}
            </div>
            <small className="form-hint">
              {availableModels.length > 0 && !isLoadingModels
                ? `${availableModels.length} models available from your API endpoint`
                : 'Using fallback model list'
              }
            </small>
            <button
              type="button"
              onClick={fetchAvailableModels}
              disabled={!apiEndpoint || !apiKey || isLoadingModels}
              className="refresh-models-btn"
            >
              🔄 Refresh Models
            </button>
          </div>

          <div className="form-group">
            <button 
              onClick={testConnection}
              disabled={isTestingConnection || !apiEndpoint || !apiKey}
              className={`test-button ${connectionStatus}`}
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            {connectionStatus === 'success' && (
              <div className="status-message success">✅ Connection successful!</div>
            )}
            {connectionStatus === 'error' && (
              <div className="status-message error">❌ Connection failed. Check your settings.</div>
            )}
          </div>
        </div>

        <div className="config-actions">
          <button onClick={onClose} className="cancel-button">Cancel</button>
          <button onClick={handleSave} className="save-button">Save Configuration</button>
        </div>
      </div>
    </div>
  );
}; 