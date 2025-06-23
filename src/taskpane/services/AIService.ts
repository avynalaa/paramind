import axios, { AxiosInstance } from 'axios';
import { AppConfig } from '../components/App';
import { WordService } from './WordService';

export interface DocumentAction {
  type: 'find_replace' | 'insert_at_start' | 'insert_at_end' | 'insert_after_heading' | 'insert_at_paragraph' | 'format_text' | 'create_table' | 'format_paragraphs' | 'indent_paragraphs' | 'analyze_formatting';
  params: any;
}

export class AIService {
  private config: AppConfig | null = null;
  private client: AxiosInstance | null = null;
  private wordService: WordService;

  constructor() {
    this.wordService = new WordService();
  }

  setConfig(config: AppConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiEndpoint,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
  }

  async sendMessage(message: string, documentContext?: string): Promise<string> {
    if (!this.config || !this.client) {
      throw new Error('AI service not configured. Please set up your API credentials.');
    }

    try {
      const systemPrompt = this.buildSystemPrompt(documentContext);
      
      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 2000,
        top_p: this.config.topP ?? 1.0,
        frequency_penalty: this.config.frequencyPenalty ?? 0.0,
        presence_penalty: this.config.presencePenalty ?? 0.0,
        stream: false
      });

      if (response.data?.choices?.[0]?.message?.content) {
        const aiResponse = response.data.choices[0].message.content.trim();
        
        // Check if the AI wants to perform document actions
        await this.extractAndExecuteDocumentActions(aiResponse);
        
        return aiResponse;
      } else {
        throw new Error('Invalid response format from AI service');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your credentials.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.status >= 500) {
          throw new Error('AI service is temporarily unavailable. Please try again.');
        } else {
          throw new Error(`API Error: ${error.response?.data?.error?.message || error.message}`);
        }
      } else {
        throw new Error(`Failed to communicate with AI service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Enhanced AI with autonomous document editing capabilities
   */
  async sendMessageWithAutonomousEditing(message: string, documentContext?: string, allowAutonomousEditing: boolean = true): Promise<{response: string, actionsPerformed: DocumentAction[]}> {
    if (!this.config || !this.client) {
      throw new Error('AI service not configured. Please set up your API credentials.');
    }

    try {
      // Get document structure for better context
      const paragraphs = await this.wordService.getAllParagraphs();
      const documentStructure = paragraphs.map((p, i) => `[${i}] ${p.text.substring(0, 100)}${p.text.length > 100 ? '...' : ''}`).join('\n');
      
      const enhancedSystemPrompt = this.buildAutonomousSystemPrompt(documentContext, documentStructure, allowAutonomousEditing);
      
      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 2000,
        top_p: this.config.topP ?? 1.0,
        frequency_penalty: this.config.frequencyPenalty ?? 0.0,
        presence_penalty: this.config.presencePenalty ?? 0.0,
        stream: false
      });

      if (response.data?.choices?.[0]?.message?.content) {
        const aiResponse = response.data.choices[0].message.content.trim();
        
        // Process autonomous document actions if enabled
        const actionsPerformed: DocumentAction[] = [];
        if (allowAutonomousEditing) {
          const actions = await this.extractAndExecuteDocumentActions(aiResponse);
          actionsPerformed.push(...actions);
        }
        
        return {
          response: aiResponse,
          actionsPerformed
        };
      } else {
        throw new Error('Invalid response format from AI service');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your credentials.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.status >= 500) {
          throw new Error('AI service is temporarily unavailable. Please try again.');
        } else {
          throw new Error(`API Error: ${error.response?.data?.error?.message || error.message}`);
        }
      } else {
        throw new Error(`Failed to communicate with AI service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private buildAutonomousSystemPrompt(documentContext?: string, documentStructure?: string, allowAutonomousEditing: boolean = true): string {
    let prompt = `You are ParaMind, an advanced AI assistant integrated into Microsoft Word with autonomous document editing capabilities. You can:

1. **Analyze and understand** the entire document structure and content
2. **Make direct edits** to any part of the document without requiring manual cursor positioning
3. **Find and replace** text throughout the document
4. **Insert content** at specific locations (beginning, end, after headings, at paragraph indices)
5. **Apply formatting** to specific text ranges
6. **Create tables** and structured content
7. **Restructure and reorganize** document content

${allowAutonomousEditing ? `
**AUTONOMOUS EDITING INSTRUCTIONS:**
When the user requests changes that require document editing, you can perform the following actions:

- **FIND_REPLACE**: Use this to find and replace text anywhere in the document
  Format: [ACTION:FIND_REPLACE:"old text":"new text":options]
  Example: [ACTION:FIND_REPLACE:"color":"colour":{"replaceAll":true}]

- **INSERT_AT_START**: Insert content at the beginning of the document
  Format: [ACTION:INSERT_AT_START:"content to insert"]

- **INSERT_AT_END**: Insert content at the end of the document
  Format: [ACTION:INSERT_AT_END:"content to insert"]

- **INSERT_AFTER_HEADING**: Insert content after a specific heading
  Format: [ACTION:INSERT_AFTER_HEADING:"heading text":"content to insert"]

- **INSERT_AT_PARAGRAPH**: Insert content at a specific paragraph index
  Format: [ACTION:INSERT_AT_PARAGRAPH:index:"content":"position"]
  Position can be: "before", "after", or "replace"

- **FORMAT_TEXT**: Apply formatting to specific text
  Format: [ACTION:FORMAT_TEXT:"text to format":{"bold":true,"italic":false,"fontSize":14}]

- **CREATE_TABLE**: Create a table
  Format: [ACTION:CREATE_TABLE:rows:columns:"location"]

- **FORMAT_PARAGRAPHS**: Apply rich text formatting to paragraphs
  Format: [ACTION:FORMAT_PARAGRAPHS:criteria:formatting]
  Example: [ACTION:FORMAT_PARAGRAPHS:{"excludeHeadings":true}:{"indentation":{"firstLine":36},"alignment":"Left"}]

- **INDENT_PARAGRAPHS**: Add indentation to non-heading paragraphs
  Format: [ACTION:INDENT_PARAGRAPHS:indentAmount]
  Example: [ACTION:INDENT_PARAGRAPHS:36]

- **ANALYZE_FORMATTING**: Analyze document formatting structure
  Format: [ACTION:ANALYZE_FORMATTING]

**RICH TEXT CAPABILITIES:**
You can analyze and modify:
- **Paragraph indentation** (first line, hanging, left, right)
- **Line spacing** and paragraph spacing
- **Text alignment** (left, center, right, justify)
- **Font properties** (name, size, bold, italic, color)
- **Paragraph styles** (Normal, Heading1-6, etc.)
- **Document structure** and formatting consistency

**IMPORTANT**: Include these action commands in your response when you want to make changes. The system will execute them automatically.
` : ''}

Guidelines:
- **Be proactive**: If you can improve the document, do it autonomously
- **Explain your actions**: Tell the user what changes you're making and why
- **Maintain document integrity**: Preserve the overall structure and purpose
- **Consider context**: Make changes that fit the document's style and purpose
- **Rich text aware**: Understand and work with paragraph formatting, indentation, alignment, and styles
- **Ask for confirmation** only for major structural changes

${documentContext ? `\n**Current Document Content:**\n${documentContext}` : ''}
${documentStructure ? `\n**Document Structure (Paragraph Index: Content Preview):**\n${documentStructure}` : ''}`;

    return prompt;
  }

  private async extractAndExecuteDocumentActions(aiResponse: string): Promise<DocumentAction[]> {
    const actions: DocumentAction[] = [];
    const actionRegex = /\[ACTION:([^:]+):([^\]]+)\]/g;
    let match;

    while ((match = actionRegex.exec(aiResponse)) !== null) {
      const actionType = match[1];
      const actionParams = match[2];

      try {
        switch (actionType) {
          case 'FIND_REPLACE':
            const replaceParams = actionParams.split('":"');
            if (replaceParams.length >= 2) {
              const searchText = replaceParams[0].replace(/^"/, '');
              const replaceText = replaceParams[1];
              const options = replaceParams[2] ? JSON.parse(replaceParams[2].replace(/"$/, '')) : {};
              
              await this.wordService.findAndReplace(searchText, replaceText, options);
              actions.push({ type: 'find_replace', params: { searchText, replaceText, options } });
            }
            break;

          case 'INSERT_AT_START':
            const startContent = actionParams.replace(/^"|"$/g, '');
            await this.wordService.insertAtDocumentStart(startContent);
            actions.push({ type: 'insert_at_start', params: { content: startContent } });
            break;

          case 'INSERT_AT_END':
            const endContent = actionParams.replace(/^"|"$/g, '');
            await this.wordService.insertAtDocumentEnd(endContent);
            actions.push({ type: 'insert_at_end', params: { content: endContent } });
            break;

          case 'INSERT_AFTER_HEADING':
            const headingParams = actionParams.split('":"');
            if (headingParams.length >= 2) {
              const headingText = headingParams[0].replace(/^"/, '');
              const content = headingParams[1].replace(/"$/, '');
              
              await this.wordService.insertAfterHeading(headingText, content);
              actions.push({ type: 'insert_after_heading', params: { headingText, content } });
            }
            break;

          case 'INSERT_AT_PARAGRAPH':
            const paragraphParams = actionParams.split(':');
            if (paragraphParams.length >= 3) {
              const index = parseInt(paragraphParams[0]);
              const content = paragraphParams[1].replace(/^"|"$/g, '');
              const position = paragraphParams[2].replace(/^"|"$/g, '') as 'before' | 'after' | 'replace';
              
              await this.wordService.insertAtParagraph(index, content, position);
              actions.push({ type: 'insert_at_paragraph', params: { index, content, position } });
            }
            break;

          case 'FORMAT_TEXT':
            const formatParams = actionParams.split('":');
            if (formatParams.length >= 2) {
              const textToFormat = formatParams[0].replace(/^"/, '');
              const formatting = JSON.parse(formatParams[1]);
              
              await this.wordService.formatTextRange(textToFormat, formatting);
              actions.push({ type: 'format_text', params: { textToFormat, formatting } });
            }
            break;

          case 'CREATE_TABLE':
            const tableParams = actionParams.split(':');
            if (tableParams.length >= 3) {
              const rows = parseInt(tableParams[0]);
              const columns = parseInt(tableParams[1]);
              const location = tableParams[2].replace(/^"|"$/g, '') as 'start' | 'end' | 'cursor';
              
              await this.wordService.insertTable(rows, columns, location);
              actions.push({ type: 'create_table', params: { rows, columns, location } });
            }
            break;

          case 'FORMAT_PARAGRAPHS':
            const formatParagraphParams = actionParams.split(':');
            if (formatParagraphParams.length >= 2) {
              const criteria = JSON.parse(formatParagraphParams[0]);
              const formatting = JSON.parse(formatParagraphParams[1]);
              
              const formattedCount = await this.wordService.formatParagraphs(criteria, formatting);
              actions.push({ type: 'format_paragraphs', params: { criteria, formatting, count: formattedCount } });
            }
            break;

          case 'INDENT_PARAGRAPHS':
            const indentAmount = parseInt(actionParams) || 36;
            const indentedCount = await this.wordService.indentNonHeadingParagraphs(indentAmount);
            actions.push({ type: 'indent_paragraphs', params: { indentAmount, count: indentedCount } });
            break;

          case 'ANALYZE_FORMATTING':
            const analysis = await this.wordService.getFormattingAnalysis();
            actions.push({ type: 'analyze_formatting', params: { analysis } });
            break;
        }
      } catch (error) {
        console.error(`Failed to execute action ${actionType}:`, error);
      }
    }

    return actions;
  }

  private buildSystemPrompt(documentContext?: string): string {
    // Use custom system prompt if provided, otherwise use default
    let prompt = this.config?.systemPrompt || `You are ParaMind, an AI assistant integrated into Microsoft Word. You help users with document creation, editing, analysis, and improvement. You can:

1. Analyze and summarize document content
2. Suggest improvements for writing style, grammar, and clarity
3. Help with document structure and organization
4. Answer questions about the document content
5. Generate new content based on user requests
6. Provide writing assistance and creative suggestions

Guidelines:
- Be helpful, accurate, and concise
- Focus on the document context when available
- Provide actionable suggestions
- Maintain a professional and friendly tone
- If asked to generate content, make it relevant to the document's purpose and style
- When providing suggestions, explain your reasoning briefly`;

    if (documentContext) {
      prompt += `\n\nCurrent document context:\n${documentContext}`;
    }

    return prompt;
  }

  async testConnection(): Promise<boolean> {
    if (!this.config || !this.client) {
      return false;
    }

    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    if (!this.config || !this.client) {
      return [];
    }

    try {
      const response = await this.client.get('/models');
      if (response.data?.data) {
        return response.data.data.map((model: any) => model.id);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return [];
    }
  }
} 