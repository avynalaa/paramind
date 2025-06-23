import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './App';
import './ChatPanel.css';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onInsertText: (text: string) => void;
  onReplaceSelection: (text: string) => void;
  onInsertComment: (comment: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onInsertText,
  onReplaceSelection,
  onInsertComment
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
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

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageActions = (message: ChatMessage) => {
    if (message.role !== 'assistant') return null;

    return (
      <div className="message-actions">
        <button
          onClick={() => onInsertText(message.content)}
          className="action-button"
          title="Insert at cursor"
        >
          📝
        </button>
        <button
          onClick={() => onReplaceSelection(message.content)}
          className="action-button"
          title="Replace selection"
        >
          🔄
        </button>
        <button
          onClick={() => onInsertComment(message.content)}
          className="action-button"
          title="Add as comment"
        >
          💬
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(message.content)}
          className="action-button"
          title="Copy to clipboard"
        >
          📋
        </button>
      </div>
    );
  };

  return (
    <div className="chat-panel">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <h4>Start a conversation</h4>
            <p>Ask me anything about your document, or get help with writing and editing.</p>
            <div className="example-prompts">
              <button onClick={() => setInputMessage("Summarize this document")}>
                Summarize this document
              </button>
              <button onClick={() => setInputMessage("Check grammar and style")}>
                Check grammar and style
              </button>
              <button onClick={() => setInputMessage("Suggest improvements")}>
                Suggest improvements
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? '👤' : '🤖'} 
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <span className="message-time">{formatTimestamp(message.timestamp)}</span>
              </div>
              <div className="message-content">
                {message.content}
              </div>
              {renderMessageActions(message)}
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant">
            <div className="message-header">
              <span className="message-role">🤖 AI Assistant</span>
            </div>
            <div className="message-content loading-message">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your document..."
            className="message-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
}; 