import React, { useState, useEffect } from 'react';
import { ConfigPanel } from './ConfigPanel';
import { ChatPanel } from './ChatPanel';
import { DocumentPanel } from './DocumentPanel';
import { AIService } from '../services/AIService';
import { WordService } from '../services/WordService';
import { DocumentChunkingService } from '../services/DocumentChunkingService';
import { ChatMode, getModeSystemPrompt, getModeConfig } from './ChatModes';
import './App.css';

export interface AppConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [documentStats, setDocumentStats] = useState<{
    wordCount: number;
    paragraphCount: number;
    pageCount: number;
  }>({ wordCount: 0, paragraphCount: 0, pageCount: 0 });
  const [currentMode, setCurrentMode] = useState<ChatMode>('agent');

  const aiService = new AIService();
  const wordService = new WordService();
  const chunkingService = new DocumentChunkingService();

  useEffect(() => {
    // Load saved configuration
    loadConfig();
    
    // Initialize document stats
    updateDocumentStats();
    
    // Set up document change listener
    wordService.onDocumentChange(() => {
      updateDocumentStats();
    });

    // Set up selection change listener
    wordService.onSelectionChange((text) => {
      setSelectedText(text);
    });
  }, []);

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('paramind-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        aiService.setConfig(parsed);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
  };

  const saveConfig = (newConfig: AppConfig) => {
    localStorage.setItem('paramind-config', JSON.stringify(newConfig));
    setConfig(newConfig);
    aiService.setConfig(newConfig);
    setIsConfigOpen(false);
  };

  const updateDocumentStats = async () => {
    try {
      const stats = await wordService.getDocumentStats();
      setDocumentStats(stats);
    } catch (error) {
      console.error('Failed to update document stats:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!config) {
      setIsConfigOpen(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get document context if needed
      const documentContext = await wordService.getDocumentContext();
      
      // Prepare context for AI
      const contextualMessage = selectedText 
        ? `Selected text: "${selectedText}"\n\nUser query: ${message}`
        : message;

      // Use autonomous editing capabilities for Agent mode
      const modeConfig = getModeConfig(currentMode);
      const useAutonomousEditing = modeConfig.allowActions && currentMode === 'agent';

      let response: string;
      let actionsPerformed: any[] = [];

      if (useAutonomousEditing) {
        // Use enhanced AI with autonomous editing
        const result = await aiService.sendMessageWithAutonomousEditing(
          contextualMessage, 
          documentContext, 
          true
        );
        response = result.response;
        actionsPerformed = result.actionsPerformed;
      } else {
        // Use regular AI for Ask mode or when autonomous editing is disabled
        response = await aiService.sendMessage(contextualMessage, documentContext);
      }
      
      // Create AI message with action summary if actions were performed
      let aiMessageContent = response;
      if (actionsPerformed.length > 0) {
        const actionSummary = actionsPerformed.map(action => {
          switch (action.type) {
            case 'find_replace':
              return `✅ Replaced "${action.params.searchText}" with "${action.params.replaceText}"`;
            case 'insert_at_start':
              return `✅ Inserted content at document beginning`;
            case 'insert_at_end':
              return `✅ Inserted content at document end`;
            case 'insert_after_heading':
              return `✅ Inserted content after heading "${action.params.headingText}"`;
            case 'insert_at_paragraph':
              return `✅ Modified paragraph ${action.params.index}`;
            case 'format_text':
              return `✅ Applied formatting to "${action.params.textToFormat}"`;
                         case 'create_table':
               return `✅ Created ${action.params.rows}x${action.params.columns} table`;
             case 'format_paragraphs':
               return `✅ Applied formatting to ${action.params.count} paragraphs`;
             case 'indent_paragraphs':
               return `✅ Added indentation to ${action.params.count} paragraphs`;
             case 'analyze_formatting':
               return `✅ Analyzed document formatting (${action.params.analysis.totalParagraphs} paragraphs, ${action.params.analysis.stylesUsed.length} styles)`;
             default:
               return `✅ Performed ${action.type}`;
          }
        }).join('\n');
        
        aiMessageContent += `\n\n**Actions Performed:**\n${actionSummary}`;
      }
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiMessageContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update document stats after autonomous edits
      if (actionsPerformed.length > 0) {
        setTimeout(() => updateDocumentStats(), 500);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertText = async (text: string) => {
    try {
      await wordService.insertText(text);
    } catch (error) {
      console.error('Failed to insert text:', error);
    }
  };

  const handleReplaceSelection = async (text: string) => {
    try {
      await wordService.replaceSelection(text);
    } catch (error) {
      console.error('Failed to replace selection:', error);
    }
  };

  const handleInsertComment = async (comment: string) => {
    try {
      await wordService.insertComment(comment);
    } catch (error) {
      console.error('Failed to insert comment:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!config) {
    return (
      <div className="app">
        <div className="welcome-screen">
          <h2>Welcome to ParaMind AI Assistant</h2>
          <p>Configure your AI provider to get started.</p>
          <button onClick={() => setIsConfigOpen(true)} className="config-button">
            Configure AI Provider
          </button>
        </div>
        {isConfigOpen && (
          <ConfigPanel 
            onSave={saveConfig}
            onClose={() => setIsConfigOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h3>ParaMind AI Assistant</h3>
        <div className="header-actions">
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="icon-button"
            title="Settings"
          >
            ⚙️
          </button>
          <button 
            onClick={clearChat}
            className="icon-button"
            title="Clear Chat"
          >
            🗑️
          </button>
        </div>
      </div>

      <DocumentPanel 
        stats={documentStats}
        selectedText={selectedText}
      />

      <ChatPanel 
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onInsertText={handleInsertText}
        onReplaceSelection={handleReplaceSelection}
        onInsertComment={handleInsertComment}
      />

      {isConfigOpen && (
        <ConfigPanel 
          config={config}
          onSave={saveConfig}
          onClose={() => setIsConfigOpen(false)}
        />
      )}
    </div>
  );
}; 