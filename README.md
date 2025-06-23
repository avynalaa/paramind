# ParaMind AI Assistant for Microsoft Word


A powerful Microsoft Word add-in that integrates AI capabilities directly into your document workflow. ParaMind allows you to interact with AI models through OpenAI-compatible APIs to help with document creation, editing, analysis, and rich text formatting.

## ✨ **What Makes ParaMind Special**

ParaMind was designed to bring advanced AI assistance directly into Microsoft Word, with features like:

- 🎨 **Rich Text Formatting Awareness**: Understands and can manipulate paragraph indentation, alignment, spacing, and styles
- 🤖 **Autonomous Document Editing**: AI can edit any part of your document without manual cursor positioning
- 💬 **Intelligent Chat Interface**: Natural conversation with AI about your document content
- 📄 **Document Context Awareness**: AI understands your document structure and selected text
- 🔄 **Multiple AI Providers**: Works with OpenAI, Azure OpenAI, Anthropic, and other compatible APIs
- 📊 **Real-time Document Statistics**: Track word count, paragraphs, and pages
- 🎯 **Smart Formatting Commands**: "Make sure there's indentation in every paragraph that's not a header" - and it does it!

## 🚀 **Rich Text Capabilities**

ParaMind can autonomously:
- Add indentation to all non-header paragraphs
- Apply consistent formatting across document sections
- Analyze and fix formatting inconsistencies
- Adjust line spacing, alignment, and paragraph styles
- Recognize and preserve heading hierarchies
- Format documents to professional standards

## Installation

### Prerequisites
- Microsoft Word (Office 365, Word 2019, or Word 2021)
- Node.js (v16 or later)
- An API key for an OpenAI-compatible service

### Setup Instructions

1. **Clone this repository**:
   ```bash
   git clone https://github.com/avynalaa/paramind.git
   cd paramind
   npm install
   ```

2. **Install Office development tools**:
   ```bash
   npm install -g @microsoft/office-addin-dev-certs
   npx office-addin-dev-certs install
   ```

3. **Build and start**:
   ```bash
   npm run build:dev
   npm run dev-server
   ```

4. **Load in Word**:
   - Open Microsoft Word
   - Go to **Insert** > **My Add-ins** > **Upload My Add-in**
   - Select the `manifest.xml` file from the project root

## Configuration

1. Open the ParaMind panel in Word
2. Click the settings gear icon (⚙️)
3. Configure your preferred AI provider:

### Supported AI Providers
- **OpenAI**: `https://api.openai.com/v1`
- **Azure OpenAI**: `https://your-resource.openai.azure.com`
- **Anthropic**: `https://api.anthropic.com`
- **Together AI**: `https://api.together.xyz/v1`
- **OpenRouter**: `https://openrouter.ai/api/v1`
- **Local (Ollama)**: `http://localhost:11434/v1`

## Usage Examples

### Rich Text Formatting
- *"Make sure there's indentation in every paragraph that's not a header"*
- *"Format this document like a professional academic paper"*
- *"Fix any formatting inconsistencies in this document"*
- *"Make all body paragraphs justified with 1.5 line spacing"*

### Content Assistance
- *"Summarize this document"*
- *"Improve the writing style of this section"*
- *"Generate an introduction for this topic"*
- *"Check grammar and suggest improvements"*

### Document Analysis
- *"Analyze the structure of this document"*
- *"What formatting issues need to be fixed?"*
- *"How can I improve the organization of this content?"*

## 🛠️ **Development Scripts**

- `npm run build:dev` - Build for development
- `npm run dev-server` - Start development server  
- `npm start` - Start with debugging
- `npm run validate` - Validate manifest

## 📁 **Project Structure**

```
paramind/
├── src/
│   ├── taskpane/
│   │   ├── components/     # React UI components
│   │   └── services/       # AI and Word integration services
│   ├── commands/           # Ribbon commands
│   └── assets/            # Icons and resources
├── manifest.xml           # Office add-in manifest
└── package.json          # Project configuration
```

## 🤝 **Using ParaMind**

ParaMind is open source and available for anyone to use. If you find it helpful:

- ⭐ **Star the repository** if you like the project
- 🐛 **Report issues** if you find bugs
- 💡 **Suggest features** for future improvements
- 🔧 **Contribute improvements** via pull requests

## 📄 **License**

This project is licensed under the MIT License. You're free to use, modify, and distribute ParaMind, but please maintain attribution to the original creator.

## 🙏 **Credits**

**ParaMind** was created by **Vanya** as a powerful AI assistant for Microsoft Word.

- Inspired by development tools like Cursor and RooCode
- Built with Microsoft Office.js APIs and React
- Powered by OpenAI-compatible APIs

---

**© 2024 Vanya - ParaMind AI Assistant** 
