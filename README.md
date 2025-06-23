# ParaMind AI Assistant for Microsoft Word

A powerful Microsoft Word add-in that integrates AI capabilities directly into your document workflow. Similar to tools like RooCode, ParaMind allows you to interact with AI models through OpenAI-compatible APIs to help with document creation, editing, analysis, and improvement.

## Features

- 🤖 **AI-Powered Document Assistance**: Get help with writing, editing, and document analysis
- 💬 **Interactive Chat Interface**: Natural conversation with AI about your document
- 📄 **Document Context Awareness**: AI understands your document content and selected text
- 🔄 **Multiple Integration Options**: Insert, replace, or comment on text directly in Word
- ⚙️ **Flexible API Configuration**: Works with OpenAI, Azure OpenAI, Anthropic, and other compatible endpoints
- 📊 **Real-time Document Statistics**: Track word count, paragraphs, and pages
- 🎨 **Modern UI**: Clean, responsive interface inspired by modern development tools

## Screenshots

## Prerequisites

- Microsoft Word (Office 365, Word 2019, or Word 2021)
- Node.js (v16 or later)
- An API key for an OpenAI-compatible service

## Installation & Development

### 1. Clone and Setup

```bash
git clone https://github.com/avynalaa/paramind.git
cd paramind
npm install
```

### 2. Install Office Add-in Development Tools

```bash
npm install -g @microsoft/office-addin-dev-certs
npm install -g office-addin-debugging
```

### 3. Setup HTTPS Certificates (Required for Office Add-ins)

```bash
npx office-addin-dev-certs install
```

### 4. Build the Project

```bash
npm run build:dev
```

### 5. Start Development Server

```bash
npm run dev-server
```

This will start the development server at `https://localhost:3000`.

### 6. Sideload the Add-in

You have several options to sideload the add-in for testing:

#### Option A: Using Office Add-in Debugging Tools
```bash
npm start
```

#### Option B: Manual Sideloading
1. Open Microsoft Word
2. Go to **Insert** > **My Add-ins** > **Upload My Add-in**
3. Browse and select the `manifest.xml` file from your project root
4. Click **Upload**

#### Option C: For Microsoft 365 (Recommended for development)
```bash
npm run sideload
```

## Configuration

### Setting up AI Provider

1. Open Microsoft Word with the add-in loaded
2. Click the **ParaMind AI** button in the Home ribbon
3. Click the settings gear icon (⚙️) in the add-in panel
4. Configure your AI provider:

#### OpenAI
- **API Endpoint**: `https://api.openai.com/v1`
- **API Key**: Your OpenAI API key
- **Model**: `gpt-4` or `gpt-3.5-turbo`

#### Azure OpenAI
- **API Endpoint**: `https://your-resource.openai.azure.com`
- **API Key**: Your Azure OpenAI key
- **Model**: Your deployed model name

#### Other Providers
The add-in supports any OpenAI-compatible API. Popular options include:
- **Anthropic**: `https://api.anthropic.com`
- **Together AI**: `https://api.together.xyz/v1`
- **OpenRouter**: `https://openrouter.ai/api/v1`
- **Local (Ollama)**: `http://localhost:11434/v1`

## Usage

### Basic Chat
1. Open a Word document
2. Open the ParaMind AI Assistant panel
3. Start chatting with the AI about your document
4. Use suggested prompts or ask custom questions

### Document-Specific Features

#### Working with Selected Text
1. Select text in your document
2. The selected text will appear in the Document Panel
3. Ask the AI questions about the selected text
4. Use action buttons to insert AI responses directly into your document

#### Quick Actions
- **📝 Insert at Cursor**: Add AI response at your current cursor position
- **🔄 Replace Selection**: Replace selected text with AI response
- **💬 Add as Comment**: Insert AI response as a Word comment
- **📋 Copy to Clipboard**: Copy AI response to clipboard

#### Example Prompts
- "Summarize this document"
- "Check grammar and style"
- "Suggest improvements for this paragraph"
- "Make this text more professional"
- "Explain this concept in simpler terms"
- "Generate an introduction for this topic"

## Project Structure

```
paramind/
├── src/
│   ├── taskpane/
│   │   ├── components/
│   │   │   ├── App.tsx                 # Main application component
│   │   │   ├── ChatPanel.tsx          # Chat interface
│   │   │   ├── ConfigPanel.tsx        # AI provider configuration
│   │   │   └── DocumentPanel.tsx      # Document statistics
│   │   ├── services/
│   │   │   ├── AIService.ts           # AI API communication
│   │   │   └── WordService.ts         # Word document interaction
│   │   ├── taskpane.tsx               # Entry point
│   │   └── taskpane.html              # HTML template
│   ├── commands/
│   │   ├── commands.ts                # Ribbon command handlers
│   │   └── commands.html              # Commands HTML
│   └── assets/                        # Icons and static assets
├── manifest.xml                       # Add-in manifest
├── webpack.config.js                  # Build configuration
├── package.json                       # Dependencies and scripts
└── README.md                          # This file
```

## Development Scripts

- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run dev-server` - Start development server
- `npm start` - Start add-in with debugging
- `npm run stop` - Stop debugging
- `npm run validate` - Validate manifest
- `npm run sideload` - Sideload add-in

## Customization

### Adding New AI Providers
1. Edit `src/taskpane/components/ConfigPanel.tsx`
2. Add your provider to the `predefinedEndpoints` array
3. Update any provider-specific logic in `src/taskpane/services/AIService.ts`

### Modifying the System Prompt
Edit the `buildSystemPrompt` method in `src/taskpane/services/AIService.ts` to customize how the AI behaves.

### Styling
- Main app styles: `src/taskpane/components/App.css`
- Chat interface: `src/taskpane/components/ChatPanel.css`
- Configuration panel: `src/taskpane/components/ConfigPanel.css`
- Document panel: `src/taskpane/components/DocumentPanel.css`

## Deployment

### For Testing
The add-in runs locally during development. For sharing with others:

1. Build the production version: `npm run build`
2. Host the `dist/` folder on a secure HTTPS server
3. Update the URLs in `manifest.xml` to point to your hosted version
4. Distribute the updated `manifest.xml` file

### For Production Distribution
Consider these options for production deployment:

1. **Microsoft AppSource** - Official marketplace for Office add-ins
2. **SharePoint App Catalog** - For enterprise deployments
3. **Direct Distribution** - Share manifest files directly

## Troubleshooting

### Common Issues

#### Add-in won't load
- Ensure HTTPS certificates are installed: `npx office-addin-dev-certs install`
- Check that the development server is running on port 3000
- Verify manifest.xml is valid: `npm run validate`

#### API Connection Issues
- Verify API key and endpoint in settings
- Check network connectivity
- Test connection using the "Test Connection" button in settings

#### TypeScript/Build Errors
- Run `npm install` to ensure all dependencies are installed
- Clear build cache: Delete `dist/` folder and rebuild

### Getting Help

1. Check the browser developer console for errors
2. Use Word's add-in debugging tools
3. Review the Office.js documentation
4. Check the project's issue tracker

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by development tools like RooCode and Cursor
- Built with Microsoft Office.js APIs
- Uses React for the user interface
- Powered by OpenAI-compatible APIs

## Roadmap

- [ ] Support for more document formats
- [ ] Advanced formatting and styling options  
- [ ] Document templates and presets
- [ ] Collaborative features
- [ ] Plugin system for custom commands
- [ ] Integration with other Office applications

---

**Note**: This add-in requires an active internet connection and a valid API key for the AI service. API usage costs are determined by your chosen provider. 