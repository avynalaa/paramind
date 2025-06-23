import React, { useState, useRef, useEffect } from 'react';
import { AppConfig } from './App';
import { ChatModes, ChatMode, getModeConfig, ModeConfig } from './ChatModes';
import './EnhancedChatInput.css';

interface EnhancedChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  isLoading: boolean;
  config: AppConfig | null;
  availableModels: string[];
  currentModel: string;
  onModelChange: (model: string) => void;
  onAcceptSuggestion?: () => void;
  onRejectSuggestion?: () => void;
  hasPendingSuggestion?: boolean;
  suggestionStats?: {
    wordsAdded: number;
    wordsRemoved: number;
    wordsChanged: number;
  };
  value: string;
  onChange: (value: string) => void;
  onImageDrop: (e: React.DragEvent) => void;
  disabled?: boolean;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  onSendMessage,
  isLoading,
  config,
  availableModels,
  currentModel,
  onModelChange,
  onAcceptSuggestion,
  onRejectSuggestion,
  hasPendingSuggestion = false,
  suggestionStats,
  value,
  onChange,
  onImageDrop,
  disabled = false
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentMode, setCurrentMode] = useState<ChatMode>('agent');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [customModeConfig, setCustomModeConfig] = useState<ModeConfig | undefined>();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load custom mode config from localStorage
  useEffect(() => {
    const savedCustomMode = localStorage.getItem('paramind_custom_mode');
    if (savedCustomMode) {
      try {
        setCustomModeConfig(JSON.parse(savedCustomMode));
      } catch (error) {
        console.error('Error loading custom mode config:', error);
      }
    }
  }, []);

  // Save mode changes to localStorage
  useEffect(() => {
    localStorage.setItem('paramind_current_mode', currentMode);
  }, [currentMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
      setInputMessage('');
      setAttachedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setAttachedFiles(prev => [...prev, ...imageFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setAttachedFiles(prev => [...prev, ...imageFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isMultimodalModel = () => {
    return currentModel.includes('gpt-4') && (currentModel.includes('vision') || currentModel.includes('v'));
  };

  const handleModeChange = (mode: ChatMode) => {
    setCurrentMode(mode);
    setIsModeDropdownOpen(false);
    
    // Update system prompt based on mode
    const modeConfig = getModeConfig(mode, customModeConfig);
    // You might want to emit this to parent component
    console.log('Mode changed to:', mode, 'Config:', modeConfig);
  };

  const handleCustomModeEdit = () => {
    // Open custom mode editor - you might want to implement this in parent
    console.log('Edit custom mode');
  };

  const currentModeConfig = getModeConfig(currentMode, customModeConfig);

  return (
    <div className="enhanced-chat-input">
      <div className="input-header">
        <ChatModes
          currentMode={currentMode}
          onModeChange={handleModeChange}
          customModeConfig={customModeConfig}
          onCustomModeEdit={handleCustomModeEdit}
          isOpen={isModeDropdownOpen}
          onToggle={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
        />
        
        <div className="model-selector">
          <select 
            value={currentModel} 
            onChange={(e) => onModelChange(e.target.value)}
            className="model-dropdown"
          >
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode-specific UI hints */}
      <div className="mode-indicator">
        <span className="mode-status">
          {currentModeConfig.icon} {currentModeConfig.name} Mode
        </span>
        {currentMode === 'agent' && (
          <span className="mode-hint">AI can edit your document</span>
        )}
        {currentMode === 'ask' && (
          <span className="mode-hint">Read-only conversation</span>
        )}
      </div>

      {/* Suggestion Stats Bar */}
      {hasPendingSuggestion && suggestionStats && (
        <div className="suggestion-stats-bar">
          <div className="stats">
            <span className="stat-item added">+{suggestionStats.wordsAdded}</span>
            <span className="stat-item removed">-{suggestionStats.wordsRemoved}</span>
            <span className="stat-item changed">~{suggestionStats.wordsChanged}</span>
          </div>
          <div className="suggestion-actions">
            <button 
              onClick={onAcceptSuggestion}
              className="accept-btn"
              title="Accept suggestions (Ctrl+Enter)"
            >
              ✓ Accept
            </button>
            <button 
              onClick={onRejectSuggestion}
              className="reject-btn"
              title="Reject suggestions (Ctrl+Shift+⌫)"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      )}

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="attached-files">
          {attachedFiles.map((file, index) => (
            <div key={index} className="file-chip">
              <img 
                src={URL.createObjectURL(file)} 
                alt={file.name}
                className="file-preview"
              />
              <span className="file-name">{file.name}</span>
              <button 
                onClick={() => removeFile(index)}
                className="remove-file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Area */}
      <form onSubmit={handleSubmit} className="input-form">
        <div 
          className={`input-container ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Input Textarea */}
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isMultimodalModel() 
                ? "Ask me anything about your document or drag images here..."
                : "Ask me anything about your document..."
            }
            className="message-input"
            rows={1}
            disabled={isLoading}
          />

          {/* Action Buttons */}
          <div className="action-buttons">
            {/* Image Upload */}
            {isMultimodalModel() && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="action-button image-button"
                title="Attach image"
              >
                📷
              </button>
            )}
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      </form>

      {/* Help Text */}
      <div className="input-help">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {isMultimodalModel() && (
          <span> • Drag & drop images for visual analysis</span>
        )}
        {config && (
          <span> • Using {config.apiEndpoint.includes('openai') ? 'OpenAI' : 'Custom'} API</span>
        )}
      </div>
    </div>
  );
}; 