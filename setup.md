# Quick Setup Guide

This guide will get you up and running with ParaMind AI Assistant for Word in just a few minutes.

## Prerequisites Check

Before starting, make sure you have:
- ✅ Microsoft Word (Office 365, 2019, or 2021)
- ✅ Node.js v16+ installed
- ✅ An API key for OpenAI or compatible service

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Office Development Tools
```bash
npm install -g @microsoft/office-addin-dev-certs
npx office-addin-dev-certs install
```

### 3. Start Development
```bash
npm run dev-server
```

### 4. Sideload in Word (Choose one method)

#### Method A: Automatic (Recommended)
```bash
# In a new terminal window
npm start
```

#### Method B: Manual
1. Open Word
2. Go to **Insert** > **My Add-ins** > **Upload My Add-in**
3. Select `manifest.xml` from this folder
4. Click **Upload**

### 5. Configure AI Provider
1. Click the **ParaMind AI** button in Word's ribbon
2. Click the settings gear (⚙️) in the panel
3. Enter your API details:
   - **Endpoint**: `https://api.openai.com/v1` (for OpenAI)
   - **API Key**: Your API key
   - **Model**: `gpt-4` or `gpt-3.5-turbo`

## Test It Out

1. Type some text in Word
2. Select the text
3. In the ParaMind panel, ask: "Improve this text"
4. Use the action buttons to insert the AI's response

## Troubleshooting

### Common Issues:

**Add-in won't appear:**
- Ensure development server is running on https://localhost:3000
- Try restarting Word
- Check browser console for errors (F12)

**HTTPS Certificate Issues:**
```bash
npx office-addin-dev-certs install --machine
```

**Build Errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Customize the AI prompts in `src/taskpane/services/AIService.ts`
- Modify the UI in the component files
- Add new AI providers in `ConfigPanel.tsx`
- Check the full README.md for advanced features

Happy coding! 🚀 