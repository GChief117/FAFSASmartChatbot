# FAFSA Navigator

Smart financial aid guidance and FAFSA technical support chatbot built with React and Google Gemini 2.0 Flash.

Can either: 

1. Download and play with this lcoally after instlal npm install in the right directory of the rpoejct

or

2. See the live working app deployed via Railway for live production demo: https://fafsasmartchatbot-production.up.railway.app


<img width="1530" height="1125" alt="Screenshot 2026-02-04 at 11 36 27 AM" src="https://github.com/user-attachments/assets/c34eb29b-cdfe-4769-b7b8-675e96624f3b" />


## File Structure

```
fafsa-project/
|-- index.html              Entry HTML, loads Source Sans 3 font
|-- package.json            Dependencies (React 18, Vite 5, Serve)
|-- vite.config.js          Vite build configuration
|-- railway.json            Deployment configuration
|-- .gitignore              Git ignore rules
|
|-- public/                 Static assets (currently empty)
|
|-- src/
    |-- main.jsx            React root mount point
    |-- index.css           Global stylesheet, all fn-* prefixed classes
    |-- App.jsx             Main component: chat UI, Gemini API integration,
                            image handling, session management, markdown parser
```

### src/App.jsx

Contains all application logic in a single component:

- API configuration and Gemini 2.0 Flash endpoint
- System prompt defining the dual-domain FAFSA expert persona
- Suggested chat topics and prompts
- Markdown parser with bold, italic, link, heading, and list support
- File-to-base64 conversion for image uploads
- Session state management (create, switch, delete conversations)
- Drag-and-drop and file picker image handling
- Message sending with multimodal support (text + images)

### src/index.css

All styling configurations located here:

- Global resets, scrollbar styling, and keyframe animations
- Layout structure (sidebar, header, messages area, input bar)
- Chat bubble styling for user and assistant messages
- Markdown rendering classes (bold, italic, headings, lists, links)
- Drag-and-drop overlay and image preview thumbnails
- Mobile responsive breakpoints at 768px and 400px

## Prerequisites

- Node.js v18 or later
- npm (included with Node.js)

## Local Development

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. The API key is hardcoded -- no environment variables needed.

## Production Build

```bash
npm run build
npm run preview
```

Output goes to the dist/ directory.

## Testing

### Mobile Layout

Open Chrome DevTools (F12), toggle Device Toolbar (Ctrl+Shift+M), and drag the viewport below 768px. The sidebar auto-collapses and the hamburger menu appears.

### Image Upload

Drag and drop any JPEG, PNG, GIF, or WebP onto the chat area, or click the paperclip icon to open a file picker. Images appear as thumbnails in the preview bar above the input. Click x to remove before sending.

### Suggested Topics

On the welcome screen, click any of the four topic tiles to send a pre-written prompt. The welcome content and suggestions are bottom-aligned and shift up as the input area expands.

## API Key

The current key is hardcoded in src/App.jsx for demonstration. To replace it:

1. Go to aistudio.google.com/apikey
2. Generate a new key or use an existing one
3. Enable billing on the associated Google Cloud project to avoid free-tier quota limits
4. Replace the API_KEY constant in src/App.jsx
