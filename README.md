# Code Stand

Code Stand is a Chrome extension popup that scans code from the current tab and sends it to Gemini for a precise explanation, review, or improvement pass.

## What it is

- A real Chrome extension, not a standalone web app
- A popup UI built with React and Vite
- A content script that reads selected code or the largest visible `pre` or `code` block on the page
- A client-side Gemini integration that uses your own API key stored in Chrome local extension storage

## Features

- `Explain` mode for understanding code flow
- `Review` mode for bugs, edge cases, and risky logic
- `Improve` mode for cleanup and refactor suggestions
- `Optimize` mode for a rewritten, cleaner code version
- Page scan for code blocks on the active tab
- Manual paste fallback if the page scan is not enough
- Copy or paste optimized code back into the active page editor

## Project structure

```text
public/manifest.json   Chrome extension manifest
src/App.tsx            Popup UI and Gemini analysis flow
src/content.ts         Content script that extracts code from the page
src/index.css          Popup styling
index.html             Popup entry
vite.config.ts         Vite build config for popup + content script
```

## Requirements

- Node.js 20 or later
- Google Chrome or a Chromium-based browser
- A Gemini API key

## Install dependencies

```bash
npm install
```

## Build the extension

```bash
npm run build
```

This creates the unpacked extension output in `dist/`.

## Development

```bash
npm run dev
```

This runs Vite in watch mode and rebuilds the extension files when you change the source.

## Load in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `dist/` folder from this project
5. Pin the extension if you want quick access

After code changes:

1. Run `npm run build` or keep `npm run dev` running
2. Go back to `chrome://extensions`
3. Click the refresh icon on the loaded extension

## How to use

1. Open a webpage containing code
2. Click the Code Stand extension icon
3. Paste your Gemini API key and save it
4. Click `Scan tab`
5. Choose `Explain`, `Review`, or `Improve`
6. Click `Analyze code`

If you use `Optimize`, the popup also shows:

- `Copy code` to move the rewritten version to your clipboard
- `Paste in editor` to insert the rewritten code into the active page editor

If the page scan does not capture the right code, paste code manually into the popup and analyze it from there.

## Permissions

- `activeTab`: needed to scan the current page
- `storage`: needed to save your Gemini API key locally

## Notes

- The API key is stored in Chrome extension local storage on your machine.
- Some browser pages cannot be scanned, including many Chrome internal pages such as `chrome://extensions`.
- The extension prefers selected text first. If you highlight a specific code snippet before opening the popup, that selection is used.
- For paste-back to work reliably, click inside the target editor on the page before opening the popup.
