# Privacy Policy for Magnacat Translator

**Last updated:** January 28, 2025

## Overview

Magnacat Translator is a browser extension that translates text between Ukrainian and English using the Google Gemini API. This privacy policy explains what data the extension collects, how it's used, and how it's protected.

## Data Collection

### Data stored locally

The extension stores the following data locally on your device using Chrome's storage API (`chrome.storage.local`):

- **API Key** — Your Google Gemini API key, required for translation and text-to-speech functionality
- **User preferences** — Language settings, theme preference, keyboard shortcut configuration, selected AI models

This data **never leaves your device** except as described below.

### Data sent to external services

When you use the translation or text-to-speech features, the following data is sent to Google's Gemini API:

- **Text you select for translation** — sent to `generativelanguage.googleapis.com` for processing
- **Your API key** — used to authenticate requests to the Gemini API

**Important:** The extension does not send any data to the developer or any third parties other than Google's Gemini API.

## Data NOT Collected

The extension does **NOT** collect or transmit:

- Browsing history
- Personal information
- Analytics or usage statistics
- Cookies or tracking data
- Any data to the extension developer

## Data Storage

All user data is stored locally using Chrome's built-in storage API:

- Data is stored only on your device
- Data is synced across your Chrome browsers only if you have Chrome Sync enabled
- Data can be cleared by uninstalling the extension or clearing extension data in Chrome settings

## Third-Party Services

### Google Gemini API

The extension uses Google's Gemini API for:
- Text translation
- Text-to-speech synthesis
- Spell checking

When using these features, your selected text is sent to Google's servers. Google's privacy policy applies to this data: https://policies.google.com/privacy

## Permissions

The extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current page to detect selected text and display translation tooltip |
| `storage` | Store your API key and preferences locally |
| `contextMenus` | Add "Translate with Magnacat" option to right-click menu |
| `host_permissions: generativelanguage.googleapis.com` | Make requests to the Gemini API |

## Your Rights

You can:
- **View your data** — Open the extension popup to see your stored settings
- **Delete your data** — Uninstall the extension or clear its data in Chrome settings
- **Control what's translated** — The extension only translates text you explicitly select

## Security

- Your API key is stored locally and only transmitted to Google's API servers
- The extension uses HTTPS for all API communications
- No data is stored on external servers controlled by the developer

## Children's Privacy

This extension does not knowingly collect any personal information from children under 13 years of age.

## Changes to This Policy

If this privacy policy is updated, the changes will be reflected in the "Last updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/KYONY/magnacat/issues

## Open Source

This extension is open source. You can review the complete source code at:
https://github.com/KYONY/magnacat
