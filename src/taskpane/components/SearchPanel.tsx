import React, { useState, useRef, useEffect } from 'react';
import { WebSearchService, SearchResponse, SearchResult } from '../services/WebSearchService';
import './SearchPanel.css';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertResult: (text: string) => void;
  onSearchComplete?: (results: SearchResponse) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
  onInsertResult,
  onSearchComplete
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'general' | 'academic' | 'news' | 'factcheck'>('general');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const searchService = useRef(new WebSearchService());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      let searchResults: SearchResponse;

      switch (searchType) {
        case 'academic':
          searchResults = await searchService.current.smartSearch(queryToSearch, undefined, 'academic');
          break;
        case 'news':
          searchResults = await searchService.current.currentEventsSearch(queryToSearch);
          break;
        case 'factcheck':
          searchResults = await searchService.current.factCheck(queryToSearch);
          break;
        default:
          searchResults = await searchService.current.smartSearch(queryToSearch, undefined, 'general');
      }

      setResults(searchResults);
      if (onSearchComplete) {
        onSearchComplete(searchResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleResultInsert = (result: SearchResult, insertType: 'citation' | 'summary' | 'quote') => {
    let textToInsert = '';

    switch (insertType) {
      case 'citation':
        textToInsert = `[${result.title}](${result.url}) - ${result.source}`;
        break;
      case 'summary':
        textToInsert = `According to ${result.source}, ${result.snippet}`;
        break;
      case 'quote':
        textToInsert = `"${result.snippet}" - [${result.title}](${result.url})`;
        break;
    }

    onInsertResult(textToInsert);
  };

  const handleQuickSearch = async (quickQuery: string) => {
    setQuery(quickQuery);
    await handleSearch(quickQuery);
  };

  if (!isOpen) return null;

  return (
    <div className="search-panel-overlay">
      <div className="search-panel">
        <div className="search-header">
          <h3>🔍 Web Search</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="search-controls">
          <div className="search-input-container">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search the web..."
              className="search-input"
            />
            <button 
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="search-button"
            >
              {isSearching ? '⏳' : '🔍'}
            </button>
          </div>

          <div className="search-type-selector">
            <button
              onClick={() => setSearchType('general')}
              className={`type-button ${searchType === 'general' ? 'active' : ''}`}
            >
              🌐 General
            </button>
            <button
              onClick={() => setSearchType('academic')}
              className={`type-button ${searchType === 'academic' ? 'active' : ''}`}
            >
              🎓 Academic
            </button>
            <button
              onClick={() => setSearchType('news')}
              className={`type-button ${searchType === 'news' ? 'active' : ''}`}
            >
              📰 News
            </button>
            <button
              onClick={() => setSearchType('factcheck')}
              className={`type-button ${searchType === 'factcheck' ? 'active' : ''}`}
            >
              ✅ Fact Check
            </button>
          </div>
        </div>

        {/* Quick Search Suggestions */}
        <div className="quick-searches">
          <span className="quick-label">Quick:</span>
          <button onClick={() => handleQuickSearch('latest news')} className="quick-button">
            📰 Latest News
          </button>
          <button onClick={() => handleQuickSearch('research studies')} className="quick-button">
            📊 Research
          </button>
          <button onClick={() => handleQuickSearch('definitions')} className="quick-button">
            📖 Definitions
          </button>
        </div>

        {error && (
          <div className="search-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            {error.includes('not configured') && (
              <button className="config-button" onClick={() => {/* Open config */}}>
                Configure Search
              </button>
            )}
          </div>
        )}

        {isSearching && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <span>Searching the web...</span>
          </div>
        )}

        {results && (
          <div className="search-results">
            <div className="results-header">
              <span className="results-count">
                {results.totalResults.toLocaleString()} results ({results.searchTime}ms)
              </span>
              {results.suggestions && results.suggestions.length > 0 && (
                <div className="search-suggestions">
                  <span>Did you mean: </span>
                  {results.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="results-list">
              {results.results.map((result, index) => (
                <div key={index} className="search-result">
                  <div className="result-header">
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="result-title"
                    >
                      {result.title}
                    </a>
                    <span className="result-source">{result.source}</span>
                  </div>
                  
                  <div className="result-snippet">{result.snippet}</div>
                  
                  <div className="result-url">{result.displayUrl}</div>
                  
                  <div className="result-actions">
                    <button
                      onClick={() => handleResultInsert(result, 'citation')}
                      className="action-button citation"
                      title="Insert as citation"
                    >
                      📎 Cite
                    </button>
                    <button
                      onClick={() => handleResultInsert(result, 'summary')}
                      className="action-button summary"
                      title="Insert as summary"
                    >
                      📝 Summarize
                    </button>
                    <button
                      onClick={() => handleResultInsert(result, 'quote')}
                      className="action-button quote"
                      title="Insert as quote"
                    >
                      💬 Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searchService.current.isConfigured() && (
          <div className="search-setup">
            <div className="setup-info">
              <h4>🔧 Setup Web Search</h4>
              <p>To enable web search, you need to configure Google Custom Search:</p>
              <ol>
                <li>Get a Google Custom Search API key</li>
                <li>Create a Custom Search Engine ID</li>
                <li>Add credentials in Settings</li>
              </ol>
              <button className="setup-button">Configure Search API</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 