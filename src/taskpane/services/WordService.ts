declare const Word: any;
declare const Office: any;

export class WordService {
  private documentChangeCallbacks: (() => void)[] = [];
  private selectionChangeCallbacks: ((text: string) => void)[] = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    try {
      if (typeof Office !== 'undefined' && Office.context && Office.context.document) {
        // Set up document change listener
        Office.context.document.addHandlerAsync(
          Office.EventType.DocumentSelectionChanged,
          this.handleSelectionChange.bind(this)
        );
      }
    } catch (error) {
      console.error('Failed to setup Word event listeners:', error);
    }
  }

  private async handleSelectionChange() {
    try {
      const selectedText = await this.getSelectedText();
      this.selectionChangeCallbacks.forEach(callback => callback(selectedText));
    } catch (error) {
      console.error('Error handling selection change:', error);
    }
  }

  onDocumentChange(callback: () => void) {
    this.documentChangeCallbacks.push(callback);
  }

  onSelectionChange(callback: (text: string) => void) {
    this.selectionChangeCallbacks.push(callback);
  }

  async getDocumentStats(): Promise<{
    wordCount: number;
    paragraphCount: number;
    pageCount: number;
  }> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const body = context.document.body;
          const paragraphs = body.paragraphs;
          
          // Load properties we need
          body.load('text');
          paragraphs.load('items');
          
          await context.sync();

          // Count words (rough estimate by splitting on whitespace)
          const text = body.text || '';
          const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
          
          // Count paragraphs
          const paragraphCount = paragraphs.items ? paragraphs.items.length : 0;
          
          // Page count is harder to get accurately, so we'll estimate
          // Average 250 words per page as a rough estimate
          const pageCount = Math.max(1, Math.ceil(wordCount / 250));

          resolve({
            wordCount,
            paragraphCount,
            pageCount
          });
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  async getSelectedText(): Promise<string> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const selection = context.document.getSelection();
          selection.load('text');
          
          await context.sync();
          
          resolve(selection.text || '');
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  async getDocumentContext(): Promise<string> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const body = context.document.body;
          body.load('text');
          
          await context.sync();
          
          const fullText = body.text || '';
          
          // Return first 2000 characters as context to avoid token limits
          const contextText = fullText.length > 2000 
            ? fullText.substring(0, 2000) + '...'
            : fullText;
            
          resolve(contextText);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  async insertText(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const selection = context.document.getSelection();
          selection.insertText(text, Word.InsertLocation.after);
          
          await context.sync();
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  async replaceSelection(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const selection = context.document.getSelection();
          selection.insertText(text, Word.InsertLocation.replace);
          
          await context.sync();
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  async insertComment(comment: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const selection = context.document.getSelection();
          
          // Check if there's selected text to comment on
          selection.load('text');
          await context.sync();
          
          if (selection.text && selection.text.trim()) {
            // Insert comment on selected text
            const commentRange = selection.insertComment(comment);
            await context.sync();
          } else {
            // If no selection, insert as a text comment at cursor
            selection.insertText(`[Comment: ${comment}]`, Word.InsertLocation.after);
            await context.sync();
          }
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve();
        } catch (error) {
          // Fallback: insert as regular text if comments API fails
          try {
            const selection = context.document.getSelection();
            selection.insertText(`[Comment: ${comment}]`, Word.InsertLocation.after);
            await context.sync();
            resolve();
          } catch (fallbackError) {
            reject(fallbackError);
          }
        }
      }).catch(reject);
    });
  }

  async highlightText(text: string, color: string = 'yellow'): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const searchResults = context.document.body.search(text);
          searchResults.load('font');
          
          await context.sync();
          
          searchResults.items.forEach((item: any) => {
            item.font.highlightColor = color;
          });
          
          await context.sync();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  async formatText(formatting: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontColor?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const selection = context.document.getSelection();
          const font = selection.font;
          
          if (formatting.bold !== undefined) font.bold = formatting.bold;
          if (formatting.italic !== undefined) font.italic = formatting.italic;
          if (formatting.underline !== undefined) {
            font.underline = formatting.underline ? Word.UnderlineType.solid : Word.UnderlineType.none;
          }
          if (formatting.fontSize !== undefined) font.size = formatting.fontSize;
          if (formatting.fontColor !== undefined) font.color = formatting.fontColor;
          
          await context.sync();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  // AUTONOMOUS DOCUMENT EDITING METHODS

  /**
   * Find and replace text anywhere in the document
   */
  async findAndReplace(searchText: string, replaceText: string, options?: {
    matchCase?: boolean;
    matchWholeWord?: boolean;
    replaceAll?: boolean;
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const searchOptions = {
            matchCase: options?.matchCase || false,
            matchWholeWord: options?.matchWholeWord || false
          };

          const searchResults = context.document.body.search(searchText, searchOptions);
          searchResults.load('text');
          
          await context.sync();
          
          const replacementCount = searchResults.items.length;
          
          if (options?.replaceAll !== false) {
            // Replace all instances
            searchResults.items.forEach((item: any) => {
              item.insertText(replaceText, Word.InsertLocation.replace);
            });
          } else {
            // Replace only first instance
            if (searchResults.items.length > 0) {
              searchResults.items[0].insertText(replaceText, Word.InsertLocation.replace);
            }
          }
          
          await context.sync();
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve(replacementCount);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Insert text at a specific paragraph index
   */
  async insertAtParagraph(paragraphIndex: number, text: string, position: 'before' | 'after' | 'replace' = 'after'): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const paragraphs = context.document.body.paragraphs;
          paragraphs.load('items');
          
          await context.sync();
          
          if (paragraphIndex >= 0 && paragraphIndex < paragraphs.items.length) {
            const targetParagraph = paragraphs.items[paragraphIndex];
            
            let insertLocation: any;
            switch (position) {
              case 'before':
                insertLocation = Word.InsertLocation.before;
                break;
              case 'after':
                insertLocation = Word.InsertLocation.after;
                break;
              case 'replace':
                insertLocation = Word.InsertLocation.replace;
                break;
            }
            
            targetParagraph.insertText(text, insertLocation);
            await context.sync();
            
            // Trigger document change callbacks
            this.documentChangeCallbacks.forEach(callback => callback());
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Insert text at the beginning of the document
   */
  async insertAtDocumentStart(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const body = context.document.body;
          body.insertText(text, Word.InsertLocation.start);
          
          await context.sync();
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Insert text at the end of the document
   */
  async insertAtDocumentEnd(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const body = context.document.body;
          body.insertText(text, Word.InsertLocation.end);
          
          await context.sync();
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Insert a new paragraph with specific styling
   */
  async insertStyledParagraph(text: string, style?: string, location: 'start' | 'end' | 'cursor' = 'cursor'): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          let insertLocation: any;
          let targetRange: any;
          
          switch (location) {
            case 'start':
              targetRange = context.document.body;
              insertLocation = Word.InsertLocation.start;
              break;
            case 'end':
              targetRange = context.document.body;
              insertLocation = Word.InsertLocation.end;
              break;
            case 'cursor':
            default:
              targetRange = context.document.getSelection();
              insertLocation = Word.InsertLocation.after;
              break;
          }
          
          const newParagraph = targetRange.insertParagraph(text, insertLocation);
          
          if (style) {
            newParagraph.styleBuiltIn = style;
          }
          
          await context.sync();
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Get all paragraphs with their text and indices for AI analysis
   */
  async getAllParagraphs(): Promise<Array<{index: number, text: string, style?: string}>> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const paragraphs = context.document.body.paragraphs;
          paragraphs.load('text,styleBuiltIn');
          
          await context.sync();
          
          const paragraphData = paragraphs.items.map((paragraph: any, index: number) => ({
            index,
            text: paragraph.text || '',
            style: paragraph.styleBuiltIn
          }));
          
          resolve(paragraphData);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Insert content after finding a specific heading or section
   */
  async insertAfterHeading(headingText: string, contentToInsert: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const searchResults = context.document.body.search(headingText, {
            matchCase: false,
            matchWholeWord: false
          });
          searchResults.load('text');
          
          await context.sync();
          
          if (searchResults.items.length > 0) {
            const headingRange = searchResults.items[0];
            headingRange.insertText('\n' + contentToInsert, Word.InsertLocation.after);
            
            await context.sync();
            
            // Trigger document change callbacks
            this.documentChangeCallbacks.forEach(callback => callback());
            
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Create a table at the specified location
   */
  async insertTable(rowCount: number, columnCount: number, location: 'start' | 'end' | 'cursor' = 'cursor', headerData?: string[][]): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          let targetRange: any;
          let insertLocation: any;
          
          switch (location) {
            case 'start':
              targetRange = context.document.body;
              insertLocation = Word.InsertLocation.start;
              break;
            case 'end':
              targetRange = context.document.body;
              insertLocation = Word.InsertLocation.end;
              break;
            case 'cursor':
            default:
              targetRange = context.document.getSelection();
              insertLocation = Word.InsertLocation.after;
              break;
          }
          
          const table = targetRange.insertTable(rowCount, columnCount, insertLocation, headerData || []);
          
          await context.sync();
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Apply formatting to specific text ranges
   */
  async formatTextRange(searchText: string, formatting: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontColor?: string;
    highlightColor?: string;
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const searchResults = context.document.body.search(searchText, {
            matchCase: false,
            matchWholeWord: false
          });
          searchResults.load('font');
          
          await context.sync();
          
          searchResults.items.forEach((item: any) => {
            const font = item.font;
            if (formatting.bold !== undefined) font.bold = formatting.bold;
            if (formatting.italic !== undefined) font.italic = formatting.italic;
            if (formatting.underline !== undefined) {
              font.underline = formatting.underline ? Word.UnderlineType.solid : Word.UnderlineType.none;
            }
            if (formatting.fontSize !== undefined) font.size = formatting.fontSize;
            if (formatting.fontColor !== undefined) font.color = formatting.fontColor;
            if (formatting.highlightColor !== undefined) font.highlightColor = formatting.highlightColor;
          });
          
          await context.sync();
          
          resolve(searchResults.items.length);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  // RICH TEXT AND PARAGRAPH FORMATTING METHODS

  /**
   * Get detailed paragraph information including formatting
   */
  async getParagraphsWithFormatting(): Promise<Array<{
    index: number;
    text: string;
    style: string;
    isHeading: boolean;
    indentation: {
      firstLine: number;
      hanging: number;
      left: number;
      right: number;
    };
    spacing: {
      before: number;
      after: number;
      lineSpacing: number;
    };
    alignment: string;
    font: {
      name: string;
      size: number;
      bold: boolean;
      italic: boolean;
      color: string;
    };
  }>> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const paragraphs = context.document.body.paragraphs;
          paragraphs.load('text,styleBuiltIn,alignment,firstLineIndent,leftIndent,rightIndent,spaceAfter,spaceBefore,lineSpacing,font');
          
          await context.sync();
          
          const paragraphData = paragraphs.items.map((paragraph: any, index: number) => {
            const isHeading = this.isHeadingStyleBuiltIn(paragraph.styleBuiltIn);
            
            return {
              index,
              text: paragraph.text || '',
              style: paragraph.styleBuiltIn || 'Normal',
              isHeading,
              indentation: {
                firstLine: paragraph.firstLineIndent || 0,
                hanging: paragraph.hangingIndent || 0,
                left: paragraph.leftIndent || 0,
                right: paragraph.rightIndent || 0
              },
              spacing: {
                before: paragraph.spaceBefore || 0,
                after: paragraph.spaceAfter || 0,
                lineSpacing: paragraph.lineSpacing || 1
              },
              alignment: paragraph.alignment || 'Left',
              font: {
                name: paragraph.font?.name || 'Calibri',
                size: paragraph.font?.size || 11,
                bold: paragraph.font?.bold || false,
                italic: paragraph.font?.italic || false,
                color: paragraph.font?.color || '#000000'
              }
            };
          });
          
          resolve(paragraphData);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Apply paragraph formatting to specific paragraphs
   */
  async formatParagraphs(criteria: {
    excludeHeadings?: boolean;
    includeOnly?: number[];
    excludeIndexes?: number[];
    styleFilter?: string[];
  }, formatting: {
    indentation?: {
      firstLine?: number;
      hanging?: number;
      left?: number;
      right?: number;
    };
    spacing?: {
      before?: number;
      after?: number;
      lineSpacing?: number;
    };
    alignment?: 'Left' | 'Center' | 'Right' | 'Justify';
    style?: string;
    font?: {
      name?: string;
      size?: number;
      bold?: boolean;
      italic?: boolean;
      color?: string;
    };
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const paragraphs = context.document.body.paragraphs;
          paragraphs.load('text,styleBuiltIn,alignment,firstLineIndent,leftIndent,rightIndent,spaceAfter,spaceBefore,lineSpacing,font');
          
          await context.sync();
          
          let formattedCount = 0;
          
          for (let i = 0; i < paragraphs.items.length; i++) {
            const paragraph = paragraphs.items[i];
            
            // Apply criteria filters
            if (criteria.excludeHeadings && this.isHeadingStyleBuiltIn(paragraph.styleBuiltIn)) {
              continue;
            }
            
            if (criteria.includeOnly && !criteria.includeOnly.includes(i)) {
              continue;
            }
            
            if (criteria.excludeIndexes && criteria.excludeIndexes.includes(i)) {
              continue;
            }
            
            if (criteria.styleFilter && !criteria.styleFilter.includes(paragraph.styleBuiltIn)) {
              continue;
            }
            
            // Apply formatting
            if (formatting.indentation) {
              if (formatting.indentation.firstLine !== undefined) {
                paragraph.firstLineIndent = formatting.indentation.firstLine;
              }
              if (formatting.indentation.hanging !== undefined) {
                paragraph.hangingIndent = formatting.indentation.hanging;
              }
              if (formatting.indentation.left !== undefined) {
                paragraph.leftIndent = formatting.indentation.left;
              }
              if (formatting.indentation.right !== undefined) {
                paragraph.rightIndent = formatting.indentation.right;
              }
            }
            
            if (formatting.spacing) {
              if (formatting.spacing.before !== undefined) {
                paragraph.spaceBefore = formatting.spacing.before;
              }
              if (formatting.spacing.after !== undefined) {
                paragraph.spaceAfter = formatting.spacing.after;
              }
              if (formatting.spacing.lineSpacing !== undefined) {
                paragraph.lineSpacing = formatting.spacing.lineSpacing;
              }
            }
            
            if (formatting.alignment) {
              paragraph.alignment = formatting.alignment;
            }
            
            if (formatting.style) {
              paragraph.styleBuiltIn = formatting.style;
            }
            
            if (formatting.font) {
              const font = paragraph.font;
              if (formatting.font.name) font.name = formatting.font.name;
              if (formatting.font.size) font.size = formatting.font.size;
              if (formatting.font.bold !== undefined) font.bold = formatting.font.bold;
              if (formatting.font.italic !== undefined) font.italic = formatting.font.italic;
              if (formatting.font.color) font.color = formatting.font.color;
            }
            
            formattedCount++;
          }
          
          await context.sync();
          
          // Trigger document change callbacks
          this.documentChangeCallbacks.forEach(callback => callback());
          
          resolve(formattedCount);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Add indentation to all non-heading paragraphs
   */
  async indentNonHeadingParagraphs(indentAmount: number = 36): Promise<number> {
    return this.formatParagraphs(
      { excludeHeadings: true },
      { indentation: { firstLine: indentAmount } }
    );
  }

  /**
   * Apply consistent formatting to all paragraphs of a specific style
   */
  async formatParagraphsByStyle(style: string, formatting: {
    indentation?: {
      firstLine?: number;
      hanging?: number;
      left?: number;
      right?: number;
    };
    spacing?: {
      before?: number;
      after?: number;
      lineSpacing?: number;
    };
    alignment?: 'Left' | 'Center' | 'Right' | 'Justify';
    font?: {
      name?: string;
      size?: number;
      bold?: boolean;
      italic?: boolean;
      color?: string;
    };
  }): Promise<number> {
    return this.formatParagraphs(
      { styleFilter: [style] },
      formatting
    );
  }

  /**
   * Get document formatting analysis
   */
  async getFormattingAnalysis(): Promise<{
    totalParagraphs: number;
    headingCount: number;
    bodyParagraphs: number;
    indentedParagraphs: number;
    stylesUsed: string[];
    fontAnalysis: {
      [fontName: string]: number;
    };
    alignmentAnalysis: {
      [alignment: string]: number;
    };
  }> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const paragraphs = context.document.body.paragraphs;
          paragraphs.load('text,styleBuiltIn,alignment,firstLineIndent,font');
          
          await context.sync();
          
          const analysis = {
            totalParagraphs: paragraphs.items.length,
            headingCount: 0,
            bodyParagraphs: 0,
            indentedParagraphs: 0,
            stylesUsed: [] as string[],
            fontAnalysis: {} as { [fontName: string]: number },
            alignmentAnalysis: {} as { [alignment: string]: number }
          };
          
          const stylesSet = new Set<string>();
          
          paragraphs.items.forEach((paragraph: any) => {
            const isHeading = this.isHeadingStyleBuiltIn(paragraph.styleBuiltIn);
            
            if (isHeading) {
              analysis.headingCount++;
            } else {
              analysis.bodyParagraphs++;
            }
            
            if (paragraph.firstLineIndent > 0) {
              analysis.indentedParagraphs++;
            }
            
            // Track styles
            if (paragraph.styleBuiltIn) {
              stylesSet.add(paragraph.styleBuiltIn);
            }
            
            // Track fonts
            const fontName = paragraph.font?.name || 'Unknown';
            analysis.fontAnalysis[fontName] = (analysis.fontAnalysis[fontName] || 0) + 1;
            
            // Track alignment
            const alignment = paragraph.alignment || 'Left';
            analysis.alignmentAnalysis[alignment] = (analysis.alignmentAnalysis[alignment] || 0) + 1;
          });
          
          analysis.stylesUsed = Array.from(stylesSet);
          
          resolve(analysis);
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }

  /**
   * Check if a style is a heading style
   */
  private isHeadingStyleBuiltIn(style: any): boolean {
    const headingStyles = [
      'Heading1', 'Heading2', 'Heading3', 'Heading4', 'Heading5', 'Heading6',
      'Title', 'Subtitle'
    ];
    return headingStyles.includes(style);
  }

  /**
   * Apply table formatting
   */
  async formatTable(tableIndex: number, formatting: {
    headerRow?: boolean;
    bandedRows?: boolean;
    bandedColumns?: boolean;
    style?: string;
    alignment?: 'Left' | 'Center' | 'Right';
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      Word.run(async (context: any) => {
        try {
          const tables = context.document.body.tables;
          tables.load('items');
          
          await context.sync();
          
          if (tableIndex >= 0 && tableIndex < tables.items.length) {
            const table = tables.items[tableIndex];
            
            if (formatting.headerRow !== undefined) {
              table.headerRowCount = formatting.headerRow ? 1 : 0;
            }
            
            if (formatting.bandedRows !== undefined) {
              table.shadingColor = formatting.bandedRows ? '#F2F2F2' : 'transparent';
            }
            
            if (formatting.style) {
              table.styleBuiltIn = formatting.style;
            }
            
            if (formatting.alignment) {
              table.alignment = formatting.alignment;
            }
            
            await context.sync();
            
            // Trigger document change callbacks
            this.documentChangeCallbacks.forEach(callback => callback());
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  }
} 