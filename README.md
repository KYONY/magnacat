# Magnacat Translator

Chrome Extension (Manifest V3) for translating text between Ukrainian and English using the Gemini API.

## Features

- **Translate selected text** — highlight text on any page, see translation in a floating tooltip
- **Text-to-Speech** — listen to translations via Gemini TTS
- **Input replacement** — type in Ukrainian/English, press `Ctrl+Shift+T` to translate and replace in-place
- **Context menu** — right-click selected text → "Translate with Magnacat"
- **Auto language detection** — automatically detects Ukrainian (Cyrillic) vs English (Latin)
- **Shadow DOM tooltip** — UI is fully isolated from page styles

## Tech Stack

| Tool | Purpose |
|------|---------|
| TypeScript | Language |
| Vite + @crxjs/vite-plugin | Build |
| Vitest + jsdom | Unit tests |
| Playwright | E2E tests |
| Gemini 2.5 Flash | Translation API |
| Gemini 2.5 Flash Preview TTS | Text-to-Speech API |

## Project Structure

```
src/
├── background/
│   ├── service-worker.ts    # Extension service worker entry point
│   ├── handlers.ts          # Message routing (TRANSLATE, TTS, DETECT_LANG, etc.)
│   ├── context-menu.ts      # Right-click context menu setup & handler
│   └── types.ts             # Message type definitions
├── content/
│   ├── content.ts           # Content script entry point
│   ├── tooltip.ts           # Floating tooltip (Shadow DOM)
│   ├── selection.ts         # Text selection detection
│   └── input-replacer.ts    # Input/textarea monitoring & replacement
├── popup/
│   ├── popup.html           # Extension popup page
│   ├── popup.ts             # Popup logic (API key, language settings)
│   └── popup.css            # Popup styles
├── services/
│   ├── gemini-translate.ts  # Gemini translation API client
│   └── gemini-tts.ts        # Gemini TTS API client + PCM→WAV conversion
├── utils/
│   ├── language-detect.ts   # Ukrainian/English detection via Unicode ranges
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
4. Click Save

## Usage

### Translate selected text

1. Select any text on a page
2. A tooltip appears with the translation
3. Click the speaker icon to hear the translation
4. Click the clipboard icon to copy

### Translate in input fields

1. Type text in any input, textarea, or contenteditable element
2. Press `Ctrl+Shift+T`
3. The text is detected, translated, and a tooltip offers replacement

### Context menu

1. Select text on any page
2. Right-click → "Translate with Magnacat"

## Testing

### Unit tests

```bash
npm test              # run once
npm run test:watch    # watch mode
```

**79 tests** across 12 test files covering all modules.

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
│Trans-││ TTS ││ Storage / │
│late  ││     ││ Detect    │
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
│   │ Tooltip │ (Shadow DOM)
│   └─────────┘           │
│   ┌───────────────────┐ │
│   │ Selection Handler │ │
│   └───────────────────┘ │
│   ┌───────────────────┐ │
│   │ Input Replacer    │ │
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

ISC
