import { WordService } from './WordService';
import { DocumentChunkingService, DocumentChunk } from './DocumentChunkingService';

export interface ScanTrigger {
  type: 'character_reference' | 'plot_consistency' | 'terminology' | 'timeline' | 'cross_reference' | 'style_consistency';
  confidence: number;
  keywords: string[];
  suggestedSections: string[];
}

export interface ContextualScanResult {
  primaryChunk: DocumentChunk;
  relatedChunks: DocumentChunk[];
  scanTriggers: ScanTrigger[];
  scanReason: string;
  totalTokensUsed: number;
}

export class ContextualScanningService {
  private wordService: WordService;
  private chunkingService: DocumentChunkingService;
  
  // Patterns that trigger broader document scanning
  private readonly SCAN_TRIGGERS = {
    // Character/entity references
    character_reference: [
      /\b(he|she|they|him|her|them)\s+(said|replied|thought|remembered|decided)/gi,
      /\b(character|protagonist|antagonist|narrator)/gi,
      /\b[A-Z][a-z]+\s+(said|replied|thought|walked|ran|smiled)/gi, // Proper names + actions
    ],
    
    // Plot consistency triggers
    plot_consistency: [
      /\b(earlier|previously|before|after|later|meanwhile|subsequently)/gi,
      /\b(chapter|section|part)\s+\d+/gi,
      /\b(flashback|foreshadowing|callback|reference)/gi,
      /\b(timeline|chronology|sequence|order)/gi,
    ],
    
    // Terminology consistency
    terminology: [
      /\b(define|definition|term|concept|explain|meaning)/gi,
      /\b(technical|jargon|terminology|vocabulary)/gi,
      /\b(acronym|abbreviation|initialism)/gi,
    ],
    
    // Cross-references
    cross_reference: [
      /\b(see|refer to|as mentioned|as discussed|as shown)/gi,
      /\b(above|below|previous|following|next)/gi,
      /\b(figure|table|chart|diagram|appendix)/gi,
      /\b(page|section|chapter)\s*\d+/gi,
    ],
    
    // Style consistency
    style_consistency: [
      /\b(tone|style|voice|perspective|tense)/gi,
      /\b(formal|informal|academic|casual|professional)/gi,
      /\b(first person|second person|third person)/gi,
    ]
  };

  constructor() {
    this.wordService = new WordService();
    this.chunkingService = new DocumentChunkingService();
  }

  /**
   * Analyze user query and current context to determine if broader scanning is needed
   */
  async analyzeContextualNeeds(
    userQuery: string, 
    currentSelection: string,
    currentChapter?: string
  ): Promise<ContextualScanResult> {
    
    // Get current working chunk (where user is focused)
    const primaryChunk = await this.getCurrentWorkingChunk(currentSelection);
    
    // Analyze query and content for scan triggers
    const scanTriggers = this.detectScanTriggers(userQuery, currentSelection);
    
    // Determine if we need to scan beyond current chunk
    const needsBroaderScan = this.shouldExpandScan(scanTriggers, userQuery);
    
    let relatedChunks: DocumentChunk[] = [];
    let scanReason = "Processing current section only";
    
    if (needsBroaderScan) {
      const scanResult = await this.performContextualScan(
        primaryChunk, 
        scanTriggers, 
        userQuery,
        currentChapter
      );
      
      relatedChunks = scanResult.chunks;
      scanReason = scanResult.reason;
    }

    // Calculate total tokens used
    const totalTokens = this.calculateTokenUsage(primaryChunk, relatedChunks);

    return {
      primaryChunk,
      relatedChunks,
      scanTriggers,
      scanReason,
      totalTokensUsed: totalTokens
    };
  }

  /**
   * Detect triggers that suggest need for broader document scanning
   */
  private detectScanTriggers(userQuery: string, currentContent: string): ScanTrigger[] {
    const triggers: ScanTrigger[] = [];
    const combinedText = `${userQuery} ${currentContent}`.toLowerCase();

    Object.entries(this.SCAN_TRIGGERS).forEach(([type, patterns]) => {
      const matches: string[] = [];
      let totalMatches = 0;

      patterns.forEach(pattern => {
        const found = combinedText.match(pattern);
        if (found) {
          matches.push(...found);
          totalMatches += found.length;
        }
      });

      if (totalMatches > 0) {
        triggers.push({
          type: type as any,
          confidence: Math.min(totalMatches * 0.2, 1.0), // Scale confidence
          keywords: [...new Set(matches)], // Remove duplicates
          suggestedSections: this.getSuggestedSections(type, matches)
        });
      }
    });

    return triggers;
  }

  /**
   * Determine if we should expand scan based on triggers and query intent
   */
  private shouldExpandScan(triggers: ScanTrigger[], userQuery: string): boolean {
    // High-confidence triggers that definitely need broader scanning
    const highConfidenceTriggers = triggers.filter(t => t.confidence > 0.6);
    if (highConfidenceTriggers.length > 0) return true;

    // Specific query patterns that suggest cross-document needs
    const crossDocumentPatterns = [
      /\b(consistency|inconsistent|contradicts?|conflicts?)/gi,
      /\b(throughout|across|entire|whole|all)/gi,
      /\b(other|previous|earlier|later|different)\s+(chapter|section|part)/gi,
      /\b(character|plot|story|narrative)\s+(development|arc|consistency)/gi,
      /\b(check|verify|ensure|confirm|validate)/gi,
    ];

    return crossDocumentPatterns.some(pattern => pattern.test(userQuery));
  }

  /**
   * Perform intelligent contextual scanning
   */
  private async performContextualScan(
    primaryChunk: DocumentChunk,
    triggers: ScanTrigger[],
    userQuery: string,
    currentChapter?: string
  ): Promise<{ chunks: DocumentChunk[], reason: string }> {
    
    const allChunks = await this.chunkingService.chunkDocument({
      maxTokens: 4000,
      overlapTokens: 200,
      preserveStructure: true,
      prioritizeSelection: false
    });

    let relevantChunks: DocumentChunk[] = [];
    let scanReasons: string[] = [];

    // 1. Character/Entity consistency scanning
    const characterTriggers = triggers.filter(t => t.type === 'character_reference');
    if (characterTriggers.length > 0) {
      const characterChunks = await this.findCharacterReferences(allChunks, characterTriggers);
      relevantChunks.push(...characterChunks);
      scanReasons.push(`Character consistency check (${characterChunks.length} references found)`);
    }

    // 2. Plot/Timeline consistency
    const plotTriggers = triggers.filter(t => t.type === 'plot_consistency');
    if (plotTriggers.length > 0) {
      const plotChunks = await this.findPlotReferences(allChunks, plotTriggers, currentChapter);
      relevantChunks.push(...plotChunks);
      scanReasons.push(`Plot consistency check (${plotChunks.length} timeline references)`);
    }

    // 3. Terminology consistency
    const termTriggers = triggers.filter(t => t.type === 'terminology');
    if (termTriggers.length > 0) {
      const termChunks = await this.findTerminologyUsage(allChunks, termTriggers);
      relevantChunks.push(...termChunks);
      scanReasons.push(`Terminology consistency (${termChunks.length} definitions found)`);
    }

    // 4. Cross-references
    const crossRefTriggers = triggers.filter(t => t.type === 'cross_reference');
    if (crossRefTriggers.length > 0) {
      const crossRefChunks = await this.findCrossReferences(allChunks, crossRefTriggers);
      relevantChunks.push(...crossRefChunks);
      scanReasons.push(`Cross-reference validation (${crossRefChunks.length} references)`);
    }

    // Remove duplicates and limit to most relevant
    relevantChunks = this.deduplicateAndRank(relevantChunks, userQuery).slice(0, 5);

    const reason = scanReasons.length > 0 
      ? `Expanded scan: ${scanReasons.join(', ')}`
      : 'Contextual scanning based on query analysis';

    return { chunks: relevantChunks, reason };
  }

  /**
   * Find character references across document
   */
  private async findCharacterReferences(
    chunks: DocumentChunk[], 
    triggers: ScanTrigger[]
  ): Promise<DocumentChunk[]> {
    const characterNames = this.extractCharacterNames(triggers);
    
    return chunks.filter(chunk => {
      const content = chunk.content.toLowerCase();
      return characterNames.some(name => 
        content.includes(name.toLowerCase()) && 
        // Ensure it's actually a character reference, not just the word
        /\b(said|replied|thought|walked|ran|smiled|decided|remembered)/gi.test(content)
      );
    });
  }

  /**
   * Find plot/timeline references
   */
  private async findPlotReferences(
    chunks: DocumentChunk[], 
    triggers: ScanTrigger[],
    currentChapter?: string
  ): Promise<DocumentChunk[]> {
    const timelineKeywords = triggers.reduce((acc, t) => acc.concat(t.keywords), [] as string[]);
    
    return chunks.filter(chunk => {
      // Skip current chapter unless specifically needed
      if (currentChapter && chunk.metadata.sectionTitle === currentChapter) {
        return false;
      }
      
      const content = chunk.content.toLowerCase();
      return timelineKeywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
  }

  /**
   * Find terminology usage across document
   */
  private async findTerminologyUsage(
    chunks: DocumentChunk[], 
    triggers: ScanTrigger[]
  ): Promise<DocumentChunk[]> {
    const terms = this.extractTerminology(triggers);
    
    return chunks.filter(chunk => {
      const content = chunk.content.toLowerCase();
      return terms.some(term => content.includes(term.toLowerCase()));
    });
  }

  /**
   * Find cross-references
   */
  private async findCrossReferences(
    chunks: DocumentChunk[], 
    triggers: ScanTrigger[]
  ): Promise<DocumentChunk[]> {
    const references = triggers.reduce((acc, t) => acc.concat(t.keywords), [] as string[]);
    
    return chunks.filter(chunk => {
      const content = chunk.content.toLowerCase();
      return references.some(ref => content.includes(ref.toLowerCase()));
    });
  }

  /**
   * Get current working chunk based on selection
   */
  private async getCurrentWorkingChunk(selection: string): Promise<DocumentChunk> {
    // This would get the chunk containing the current selection
    // For now, return a mock chunk
    return {
      id: 'current',
      content: selection || 'Current working section',
      startIndex: 0,
      endIndex: 0,
      type: 'section',
      metadata: {
        wordCount: selection ? selection.split(' ').length : 0,
        sectionTitle: 'Current Section'
      }
    };
  }

  /**
   * Helper methods
   */
  private getSuggestedSections(type: string, matches: string[]): string[] {
    // Logic to suggest which sections might be relevant
    switch (type) {
      case 'character_reference':
        return ['Character Introductions', 'Previous Chapters', 'Character Development'];
      case 'plot_consistency':
        return ['Timeline', 'Previous Events', 'Plot Outline'];
      case 'terminology':
        return ['Glossary', 'Definitions', 'Technical Sections'];
      default:
        return ['Related Sections'];
    }
  }

  private extractCharacterNames(triggers: ScanTrigger[]): string[] {
    // Extract potential character names from triggers
    const names: string[] = [];
    triggers.forEach(trigger => {
      trigger.keywords.forEach(keyword => {
        // Simple heuristic: capitalized words that might be names
        if (/^[A-Z][a-z]+$/.test(keyword)) {
          names.push(keyword);
        }
      });
    });
    return [...new Set(names)];
  }

  private extractTerminology(triggers: ScanTrigger[]): string[] {
    // Extract terminology from triggers
    return [...new Set(triggers.reduce((acc, t) => acc.concat(t.keywords), [] as string[]))];
  }

  private deduplicateAndRank(chunks: DocumentChunk[], query: string): DocumentChunk[] {
    // Remove duplicates and rank by relevance
    const unique = chunks.filter((chunk, index, self) => 
      index === self.findIndex(c => c.id === chunk.id)
    );

    // Simple ranking by query keyword matches
    const queryWords = query.toLowerCase().split(/\s+/);
    return unique.sort((a, b) => {
      const aScore = queryWords.reduce((score, word) => 
        score + (a.content.toLowerCase().includes(word) ? 1 : 0), 0
      );
      const bScore = queryWords.reduce((score, word) => 
        score + (b.content.toLowerCase().includes(word) ? 1 : 0), 0
      );
      return bScore - aScore;
    });
  }

  private calculateTokenUsage(primary: DocumentChunk, related: DocumentChunk[]): number {
    const estimate = (text: string) => Math.ceil(text.split(/\s+/).length * 1.3);
    
    return estimate(primary.content) + 
           related.reduce((total, chunk) => total + estimate(chunk.content), 0);
  }

  /**
   * Get contextual scanning summary for user
   */
  getScanSummary(result: ContextualScanResult): string {
    const { primaryChunk, relatedChunks, scanTriggers, scanReason, totalTokensUsed } = result;
    
    let summary = `📍 **Context Scan Results:**\n`;
    summary += `• Primary focus: ${primaryChunk.metadata.sectionTitle || 'Current section'}\n`;
    
    if (relatedChunks.length > 0) {
      summary += `• Additional context: ${relatedChunks.length} related sections\n`;
      summary += `• Scan reason: ${scanReason}\n`;
      summary += `• Triggers detected: ${scanTriggers.map(t => t.type).join(', ')}\n`;
    } else {
      summary += `• Scope: Current section only (no cross-references needed)\n`;
    }
    
    summary += `• Total context: ~${Math.round(totalTokensUsed / 1000)}k tokens\n`;
    
    return summary;
  }
} 