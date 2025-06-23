import { WordService } from './WordService';

export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  type: 'paragraph' | 'section' | 'page';
  metadata: {
    wordCount: number;
    pageNumber?: number;
    sectionTitle?: string;
    hasImages?: boolean;
    hasTable?: boolean;
  };
}

export interface ChunkingStrategy {
  maxTokens: number;
  overlapTokens: number;
  preserveStructure: boolean;
  prioritizeSelection: boolean;
}

export class DocumentChunkingService {
  private wordService: WordService;
  private readonly APPROX_TOKENS_PER_WORD = 1.3; // Conservative estimate
  private readonly MAX_CONTEXT_TOKENS = 128000; // Claude/GPT-4 context limit
  
  constructor() {
    this.wordService = new WordService();
  }

  /**
   * Get appropriate chunking strategy based on document size and mode
   */
  getChunkingStrategy(documentStats: any, mode: 'full' | 'chunked' | 'selection'): ChunkingStrategy {
    const estimatedTokens = documentStats.wordCount * this.APPROX_TOKENS_PER_WORD;
    
    // If document is small enough, use full context
    if (estimatedTokens < this.MAX_CONTEXT_TOKENS * 0.6) {
      return {
        maxTokens: Math.floor(this.MAX_CONTEXT_TOKENS * 0.8),
        overlapTokens: 0,
        preserveStructure: true,
        prioritizeSelection: false
      };
    }

    // For large documents, use smart chunking
    return {
      maxTokens: Math.floor(this.MAX_CONTEXT_TOKENS * 0.4), // Leave room for response
      overlapTokens: 200,
      preserveStructure: true,
      prioritizeSelection: mode === 'selection'
    };
  }

  /**
   * Chunk document content based on strategy
   */
  async chunkDocument(strategy: ChunkingStrategy): Promise<DocumentChunk[]> {
    try {
      await Word.run(async (context) => {
        const document = context.document;
        const body = document.body;
        
        // Load all paragraphs with their properties
        const paragraphs = body.paragraphs;
        paragraphs.load('text,styleBuiltIn,isListItem');
        
        await context.sync();

        const chunks: DocumentChunk[] = [];
        let currentChunk: DocumentChunk | null = null;
        let currentTokenCount = 0;
        let chunkIndex = 0;

        for (let i = 0; i < paragraphs.items.length; i++) {
          const paragraph = paragraphs.items[i];
          const text = paragraph.text.trim();
          
          if (!text) continue;

          const paragraphTokens = this.estimateTokens(text);
          const isHeading = this.isHeadingStyle(paragraph.styleBuiltIn);
          const isSectionBreak = isHeading || this.isSectionBreaker(text);

          // Start new chunk if needed
          if (!currentChunk || 
              currentTokenCount + paragraphTokens > strategy.maxTokens ||
              (strategy.preserveStructure && isSectionBreak && currentTokenCount > strategy.maxTokens * 0.3)) {
            
            if (currentChunk) {
              chunks.push(currentChunk);
            }

            currentChunk = {
              id: `chunk_${chunkIndex++}`,
              content: '',
              startIndex: i,
              endIndex: i,
              type: 'section',
              metadata: {
                wordCount: 0,
                sectionTitle: isHeading ? text : undefined,
                hasImages: false,
                hasTable: false
              }
            };
            currentTokenCount = 0;
          }

          // Add paragraph to current chunk
          if (currentChunk) {
            currentChunk.content += text + '\n\n';
            currentChunk.endIndex = i;
            currentChunk.metadata.wordCount += this.countWords(text);
            currentTokenCount += paragraphTokens;

            // Update metadata
            if (isHeading && !currentChunk.metadata.sectionTitle) {
              currentChunk.metadata.sectionTitle = text;
            }
          }
        }

        // Add final chunk
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        return chunks;
      });

      return [];
    } catch (error) {
      console.error('Error chunking document:', error);
      return [];
    }
  }

  /**
   * Get relevant chunks based on user query and selection
   */
  async getRelevantChunks(
    chunks: DocumentChunk[], 
    query: string, 
    selectedText?: string,
    maxChunks: number = 3
  ): Promise<DocumentChunk[]> {
    
    // If there's selected text, prioritize chunks containing it
    if (selectedText && selectedText.trim()) {
      const relevantChunks = chunks.filter(chunk => 
        chunk.content.toLowerCase().includes(selectedText.toLowerCase().trim())
      );
      
      if (relevantChunks.length > 0) {
        return relevantChunks.slice(0, maxChunks);
      }
    }

    // Simple keyword matching for now (could be enhanced with embeddings)
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const scoredChunks = chunks.map(chunk => {
      const content = chunk.content.toLowerCase();
      let score = 0;
      
      queryWords.forEach(word => {
        const matches = (content.match(new RegExp(word, 'g')) || []).length;
        score += matches;
      });
      
      // Boost score for sections with titles
      if (chunk.metadata.sectionTitle) {
        const titleWords = chunk.metadata.sectionTitle.toLowerCase();
        queryWords.forEach(word => {
          if (titleWords.includes(word)) {
            score += 2;
          }
        });
      }
      
      return { chunk, score };
    });

    // Sort by relevance and return top chunks
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, maxChunks).map(item => item.chunk);
  }

  /**
   * Combine chunks into context string with smart truncation
   */
  combineChunksForContext(
    chunks: DocumentChunk[], 
    maxTokens: number,
    includeMetadata: boolean = true
  ): string {
    let context = '';
    let currentTokens = 0;

    for (const chunk of chunks) {
      const chunkTokens = this.estimateTokens(chunk.content);
      
      if (currentTokens + chunkTokens > maxTokens) {
        // Truncate last chunk if needed
        const remainingTokens = maxTokens - currentTokens;
        const truncatedContent = this.truncateToTokens(chunk.content, remainingTokens);
        
        if (truncatedContent.trim()) {
          if (includeMetadata && chunk.metadata.sectionTitle) {
            context += `\n## ${chunk.metadata.sectionTitle}\n\n`;
          }
          context += truncatedContent + '\n\n[... content truncated ...]\n\n';
        }
        break;
      }

      if (includeMetadata && chunk.metadata.sectionTitle) {
        context += `\n## ${chunk.metadata.sectionTitle}\n\n`;
      }
      
      context += chunk.content + '\n\n';
      currentTokens += chunkTokens;
    }

    return context.trim();
  }

  /**
   * Get document summary for context
   */
  async getDocumentSummary(): Promise<string> {
    const stats = await this.wordService.getDocumentStats();
    const structure = await this.getDocumentStructure();
    
    let summary = `Document Statistics:
- ${stats.wordCount} words across ${stats.pageCount} pages
- ${stats.paragraphCount} paragraphs
- Language: ${stats.readingLevel || 'Not specified'}

Document Structure:`;

    structure.forEach((section, index) => {
      summary += `\n${index + 1}. ${section.title} (${section.wordCount} words)`;
    });

    return summary;
  }

  /**
   * Get document structure outline
   */
  private async getDocumentStructure(): Promise<Array<{title: string, level: number, wordCount: number}>> {
    const structure: Array<{title: string, level: number, wordCount: number}> = [];
    
    try {
      await Word.run(async (context) => {
        const document = context.document;
        const body = document.body;
        const paragraphs = body.paragraphs;
        
        paragraphs.load('text,styleBuiltIn');
        await context.sync();

        for (const paragraph of paragraphs.items) {
          const text = paragraph.text.trim();
          if (!text) continue;

          const headingLevel = this.getHeadingLevel(paragraph.styleBuiltIn);
          if (headingLevel > 0) {
            structure.push({
              title: text,
              level: headingLevel,
              wordCount: this.countWords(text)
            });
          }
        }
      });
    } catch (error) {
      console.error('Error getting document structure:', error);
    }

    return structure;
  }

  // Helper methods
  private estimateTokens(text: string): number {
    return Math.ceil(this.countWords(text) * this.APPROX_TOKENS_PER_WORD);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private isHeadingStyle(style: Word.BuiltInStyleName): boolean {
    return [
      Word.BuiltInStyleName.heading1,
      Word.BuiltInStyleName.heading2,
      Word.BuiltInStyleName.heading3,
      Word.BuiltInStyleName.heading4,
      Word.BuiltInStyleName.heading5,
      Word.BuiltInStyleName.heading6,
      Word.BuiltInStyleName.title,
      Word.BuiltInStyleName.subtitle
    ].includes(style);
  }

  private getHeadingLevel(style: Word.BuiltInStyleName): number {
    switch (style) {
      case Word.BuiltInStyleName.title: return 1;
      case Word.BuiltInStyleName.heading1: return 1;
      case Word.BuiltInStyleName.heading2: return 2;
      case Word.BuiltInStyleName.heading3: return 3;
      case Word.BuiltInStyleName.heading4: return 4;
      case Word.BuiltInStyleName.heading5: return 5;
      case Word.BuiltInStyleName.heading6: return 6;
      default: return 0;
    }
  }

  private isSectionBreaker(text: string): boolean {
    // Check for common section breakers
    const sectionBreakers = [
      /^chapter\s+\d+/i,
      /^section\s+\d+/i,
      /^part\s+\d+/i,
      /^appendix/i,
      /^conclusion/i,
      /^introduction/i,
      /^abstract/i,
      /^summary/i
    ];

    return sectionBreakers.some(pattern => pattern.test(text.trim()));
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    const words = text.split(/\s+/);
    const maxWords = Math.floor(maxTokens / this.APPROX_TOKENS_PER_WORD);
    
    if (words.length <= maxWords) {
      return text;
    }

    return words.slice(0, maxWords).join(' ') + '...';
  }
} 