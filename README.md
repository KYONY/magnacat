# Magnacat Translator

Chrome Extension (Manifest V3) for translating text between Ukrainian and English using the Gemini API.

## Features

- **Translate selected text** — highlight text on any page, see translation in a floating tooltip
- **HTML-preserving translation** — preserves bold, italic, underline, headings, lists and other formatting
- **Text-to-Speech** — listen to translations via Gemini TTS
- **Spell check** — check spelling in input fields via `Ctrl+Shift+S`
- **Input replacement** — type in Ukrainian/English, press `Ctrl+Shift+T` to translate and replace in-place (inputs, textareas, contenteditable)
- **Context menu** — right-click selected text → "Translate with Magnacat"
- **Customizable keyboard shortcuts** — configure translation and spell check hotkeys in settings
- **Auto language detection** — automatically detects Ukrainian (Cyrillic) vs English (Latin)
- **Dynamic model selection** — fetches available Gemini models from API, choose translation and TTS models
- **YouTube subtitle translation** — click words in YouTube subtitles to translate; shift+click to select multiple words; video auto-pauses during translation
- **Resizable tooltip** — drag to move, resize from the corner
- **Shadow DOM tooltip** — UI is fully isolated from page styles
- **Dark/light theme** — switch between themes in popup settings

## Tech Stack

| Tool | Purpose |
|------|---------|
| TypeScript | Language |
| Vite + @crxjs/vite-plugin | Build |
| Vitest + jsdom | Unit tests |
| Playwright | E2E tests |
| Gemini API | Translation, spell check, TTS, model discovery |

## Project Structure

```
src/
├── background/
│   ├── service-worker.ts    # Extension service worker entry point
│   ├── handlers.ts          # Message routing (TRANSLATE, TTS, DETECT_LANG, SPELL_CHECK, etc.)
│   ├── context-menu.ts      # Right-click context menu setup & handler
│   └── types.ts             # Message type definitions
├── content/
│   ├── content.ts           # Content script entry point
│   ├── tooltip.ts           # Floating tooltip (Shadow DOM), sanitizeHtml
│   ├── selection.ts         # Text selection detection, getSelectedHtml
│   ├── input-replacer.ts    # Input/textarea/contenteditable monitoring & replacement
│   └── youtube/
│       ├── youtube-detector.ts      # YouTube page & subtitle container detection
│       ├── subtitle-processor.ts    # MutationObserver, word wrapping in subtitles
│       ├── word-selector.ts         # Click/shift+click word selection
│       ├── video-controller.ts      # Pause/resume with state preservation
│       ├── subtitle-styles.ts       # CSS injection for word highlighting
│       └── youtube-integration.ts   # Orchestrator connecting all YouTube modules
├── popup/
│   ├── popup.html           # Extension popup page
│   ├── popup.ts             # Popup logic (API key, language, model, theme, shortcut settings)
│   └── popup.css            # Popup styles
├── services/
│   ├── gemini-translate.ts  # Gemini translation API client (plain text & HTML-aware)
│   ├── gemini-tts.ts        # Gemini TTS API client + PCM→WAV conversion
│   ├── gemini-spellcheck.ts # Gemini spell check API client
│   └── gemini-models.ts     # Fetch and categorize available Gemini models
├── utils/
│   ├── language-detect.ts   # Ukrainian/English detection via Unicode ranges
│   ├── models.ts            # Default models, base URL, ModelOption interface
│   ├── shortcut.ts          # Keyboard shortcut parsing and matching
│   └── storage.ts           # Typed chrome.storage.local wrapper
└── test-setup.ts            # Chrome API mocks for Vitest
e2e/
└── extension.spec.ts        # Playwright E2E tests
```

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite dev server with HMR. Load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` directory

### Build

```bash
npm run build
```

Produces a production build in `dist/` ready to load as an unpacked extension.

### Configure

1. Click the Magnacat icon in the Chrome toolbar
2. Enter your Gemini API key
3. Choose source/target languages (default: Auto → Ukrainian)
4. Select translation and TTS models
5. Enable YouTube subtitles toggle (optional)
6. Customize keyboard shortcuts (optional)
7. Click Save

## Usage

### Translate selected text

1. Select any text on a page
2. Click the trigger icon (or use keyboard shortcut)
3. A tooltip appears with the translation (HTML formatting preserved)
4. Click the speaker icon to hear the translation
5. Click the clipboard icon to copy

### Translate in input fields

1. Type text in any input, textarea, or contenteditable element
2. Press `Ctrl+Shift+T` (or your custom shortcut)
3. The text is translated and replaced in-place

### Spell check in input fields

1. Focus any input, textarea, or contenteditable element
2. Press `Ctrl+Shift+S` (or your custom shortcut)
3. The text is spell-checked and corrected

### YouTube subtitle translation

1. Enable "YouTube subtitles" in extension settings
2. Open a YouTube video with subtitles/captions enabled
3. Click any word in the subtitles — video pauses, translation appears
4. Shift+click to select a range of words
5. Close the tooltip to resume playback

### Context menu

1. Select text on any page
2. Right-click → "Translate with Magnacat"

## Testing

### Unit tests

```bash
npm test              # run once
npm run test:watch    # watch mode
```

**295 tests** across 21 test files covering all modules.

### E2E tests

```bash
npm run test:e2e
```

**4 E2E tests** using Playwright with a real Chromium instance loading the built extension.

## Architecture

```
┌─────────────────────────┐
│     Popup (popup.ts)    │ ← Settings UI
└────────┬────────────────┘
         │ chrome.runtime.sendMessage
         ▼
┌─────────────────────────┐
│   Service Worker        │ ← Message router
│   (handlers.ts)         │
└──┬──────┬──────┬────────┘
   │      │      │
   ▼      ▼      ▼
┌──────┐┌─────┐┌───────────┐
│Trans-││ TTS ││ Spell /   │
│late  ││     ││ Models /  │
│      ││     ││ Storage   │
└──────┘└─────┘└───────────┘
   │      │
   ▼      ▼
┌─────────────────────────┐
│   Gemini REST API       │
└─────────────────────────┘
         ▲
         │ chrome.runtime.sendMessage
┌────────┴────────────────┐
│   Content Script        │
│   ┌─────────┐           │
│   │ Tooltip │ (Shadow DOM, resizable)
│   └─────────┘           │
│   ┌───────────────────┐ │
│   │ Selection Handler │ (text + HTML)
│   └───────────────────┘ │
│   ┌───────────────────┐ │
│   │ Input Replacer    │ (translate + spell check)
│   └───────────────────┘ │
│   ┌───────────────────┐ │
│   │ YouTube Subtitles │ (word select + auto-pause)
│   └───────────────────┘ │
└─────────────────────────┘
```

## Permissions

| Permission | Reason |
|------------|--------|
| `activeTab` | Access current tab for content script |
| `storage` | Store API key and language settings |
| `contextMenus` | Add "Translate with Magnacat" to right-click menu |
| `host_permissions: generativelanguage.googleapis.com` | Call Gemini API |

## License

MIT
