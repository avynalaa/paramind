import React from 'react';
import './ChatModes.css';

export type ChatMode = 'agent' | 'ask' | 'custom';

export interface ModeConfig {
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  allowActions: boolean;
  contextStrategy: 'full' | 'chunked' | 'selection';
}

interface ChatModesProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  customModeConfig?: ModeConfig;
  onCustomModeEdit?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatModes: React.FC<ChatModesProps> = (props: ChatModesProps) => {
  const { currentMode, onModeChange, customModeConfig, onCustomModeEdit, isOpen, onToggle } = props;
  const defaultModes: Record<ChatMode, ModeConfig> = {
    agent: {
      name: 'Agent',
      icon: '🤖',
      description: 'AI can directly edit and modify your document',
      systemPrompt: `You are ParaMind Agent, an AI assistant with full document editing capabilities. You can:

• Directly edit, rewrite, and restructure document content
• Make formatting changes and style improvements
• Insert new content, headings, and sections
• Fix grammar, spelling, and clarity issues
• Reorganize and optimize document structure

When the user requests changes, you should:
1. Analyze the request and document context
2. Provide specific, actionable text that can be inserted or used to replace existing content
3. Explain your reasoning briefly
4. Offer multiple options when appropriate

Be proactive and confident in making changes. The user wants you to actively improve their document.`,
      allowActions: true,
      contextStrategy: 'chunked'
    },
    ask: {
      name: 'Ask',
      icon: '💬',
      description: 'Chat with your document - read-only analysis and discussion',
      systemPrompt: `You are ParaMind Advisor, a thoughtful writing companion. You can:

• Analyze and discuss document content
• Answer questions about themes, structure, and meaning
• Provide feedback and suggestions for improvement
• Explain concepts and help with research
• Offer writing advice and creative inspiration

Your role is conversational and advisory. You should:
1. Read and understand the document thoroughly
2. Engage in thoughtful discussion about the content
3. Provide insights and analysis
4. Ask clarifying questions when helpful
5. Suggest ideas without making direct changes

Be curious, insightful, and supportive. Help the user think through their writing.`,
      allowActions: false,
      contextStrategy: 'full'
    },
    custom: {
      name: customModeConfig?.name || 'Custom',
      icon: customModeConfig?.icon || '⚙️',
      description: customModeConfig?.description || 'User-defined custom mode',
      systemPrompt: customModeConfig?.systemPrompt || 'You are a helpful AI assistant.',
      allowActions: customModeConfig?.allowActions ?? true,
      contextStrategy: customModeConfig?.contextStrategy || 'chunked'
    }
  };

  const currentModeConfig = defaultModes[currentMode];

  return (
    <div className="chat-modes">
      <button 
        onClick={onToggle}
        className={`mode-toggle ${isOpen ? 'open' : ''}`}
        title="Change chat mode"
      >
        <span className="mode-icon">{currentModeConfig.icon}</span>
        <span className="mode-name">{currentModeConfig.name}</span>
        <span className="toggle-indicator">▼</span>
      </button>
      
      {isOpen && (
        <div className="mode-dropdown">
          <div className="dropdown-header">
            <span>Chat Mode</span>
            <div className="mode-indicators">
              <span className={`indicator ${currentModeConfig.allowActions ? 'active' : ''}`} title="Can edit document">✏️</span>
              <span className={`indicator ${currentModeConfig.contextStrategy === 'full' ? 'active' : ''}`} title="Full document context">📄</span>
            </div>
          </div>
          
          {Object.entries(defaultModes).map(([mode, config]) => (
            <button
              key={mode}
              onClick={() => {
                onModeChange(mode as ChatMode);
                onToggle();
              }}
              className={`mode-option ${mode === currentMode ? 'active' : ''}`}
            >
              <div className="mode-info">
                <div className="mode-header">
                  <span className="mode-icon">{config.icon}</span>
                  <span className="mode-title">{config.name}</span>
                  <div className="mode-badges">
                    {config.allowActions && <span className="badge edit" title="Can edit">✏️</span>}
                    {config.contextStrategy === 'full' && <span className="badge context" title="Full context">📄</span>}
                    {config.contextStrategy === 'chunked' && <span className="badge chunked" title="Smart chunking">🧩</span>}
                  </div>
                </div>
                <div className="mode-description">{config.description}</div>
              </div>
            </button>
          ))}
          
          {currentMode === 'custom' && (
            <div className="custom-mode-actions">
              <button 
                onClick={onCustomModeEdit}
                className="edit-custom-btn"
              >
                ⚙️ Edit Custom Mode
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get mode-specific behavior
export const getModeSystemPrompt = (mode: ChatMode, customConfig?: ModeConfig): string => {
  const defaultModes: Record<ChatMode, ModeConfig> = {
    agent: {
      name: 'Agent',
      icon: '🤖',
      description: 'AI can directly edit and modify your document',
      systemPrompt: `You are ParaMind Agent, an AI assistant with full document editing capabilities. When the user requests changes, provide specific, actionable text that can be inserted or used to replace existing content. Be proactive and confident in making changes.`,
      allowActions: true,
      contextStrategy: 'chunked'
    },
    ask: {
      name: 'Ask',
      icon: '💬', 
      description: 'Chat with your document - read-only analysis and discussion',
      systemPrompt: `You are ParaMind Advisor, a thoughtful writing companion. Your role is conversational and advisory. Analyze, discuss, and provide insights about the document without making direct changes.`,
      allowActions: false,
      contextStrategy: 'full'
    },
    custom: {
      name: 'Custom',
      icon: '⚙️',
      description: 'User-defined custom mode',
      systemPrompt: customConfig?.systemPrompt || 'You are a helpful AI assistant.',
      allowActions: customConfig?.allowActions ?? true,
      contextStrategy: customConfig?.contextStrategy || 'chunked'
    }
  };

  return defaultModes[mode].systemPrompt;
};

export const getModeConfig = (mode: ChatMode, customConfig?: ModeConfig): ModeConfig => {
  const defaultModes: Record<ChatMode, ModeConfig> = {
    agent: {
      name: 'Agent',
      icon: '🤖',
      description: 'AI can directly edit and modify your document',
      systemPrompt: 'Agent mode system prompt...',
      allowActions: true,
      contextStrategy: 'chunked'
    },
    ask: {
      name: 'Ask',
      icon: '💬',
      description: 'Chat with your document - read-only analysis and discussion', 
      systemPrompt: 'Ask mode system prompt...',
      allowActions: false,
      contextStrategy: 'full'
    },
    custom: customConfig || {
      name: 'Custom',
      icon: '⚙️',
      description: 'User-defined custom mode',
      systemPrompt: 'You are a helpful AI assistant.',
      allowActions: true,
      contextStrategy: 'chunked'
    }
  };

  return defaultModes[mode];
}; 