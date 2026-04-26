# Frontend Audit Extension

Frontend Audit Extension is a production-style Chrome extension that audits the active webpage for core frontend quality signals. It provides a React + TypeScript popup UI, runs client-side analysis through a content script, scores the page across multiple categories, stores audit history locally, and exports audit reports as JSON or CSV.

## Key Features

- React + TypeScript popup UI built with Vite and Tailwind CSS
- Manifest V3 Chrome extension architecture
- Content script page analysis against the active tab
- SEO, accessibility, and image audit checks
- Audit scoring for overall, SEO, accessibility, and image quality
- Issue severity system with `pass`, `warning`, and `fail` states
- Audit history using the Chrome Storage API
- JSON and CSV export for current and saved audit reports
- Friendly handling for restricted Chrome pages where content scripts cannot run

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Chrome Extension Manifest V3
- Chrome Storage API

## Architecture Overview

The project is split into focused extension layers:

- `popup`: React-based extension UI for triggering audits, viewing scores, reviewing issues, opening recent audits, and exporting reports
- `content script`: DOM analysis layer that inspects the active webpage and returns audit metrics
- `background service worker`: Manifest V3 background entry for extension lifecycle handling
- `shared utilities`: reusable logic for scoring, issue generation, export formatting, storage, messaging, and TypeScript models

## Folder Structure

```text
frontend-audit-extension/
|- public/
|  |- manifest.json
|- src/
|  |- background/
|  |  |- index.ts
|  |- content/
|  |  |- index.ts
|  |- popup/
|  |  |- App.tsx
|  |  |- main.tsx
|  |  |- presentation.ts
|  |  |- styles.css
|  |- shared/
|  |  |- auditExport.ts
|  |  |- auditIssues.ts
|  |  |- auditScoring.ts
|  |  |- auditStorage.ts
|  |  |- messages.ts
|  |  |- types.ts
|- popup.html
|- package.json
|- postcss.config.js
|- tailwind.config.js
|- tsconfig.app.json
|- tsconfig.json
|- tsconfig.node.json
|- vite.config.ts
```

## How It Works

1. The user opens the popup and clicks `Analyze Current Page`.
2. The popup sends a message to the content script running on the active tab.
3. The content script inspects page-level signals such as title, meta description, headings, images, and links.
4. Shared utilities calculate audit scores and generate categorized issues with severity levels.
5. Successful audits are saved to `chrome.storage.local` as history entries.
6. The popup renders the current result, recent audits, and export actions.
7. The selected audit can be exported as JSON or CSV directly in the browser.

## Install Dependencies

```bash
npm install
```

## Build

```bash
npm run build
```

This generates the production-ready extension bundle in `dist/`.

## Load In Chrome

1. Run `npm install`
2. Run `npm run build`
3. Open `chrome://extensions`
4. Enable `Developer mode`
5. Click `Load unpacked`
6. Select the `dist` folder from this project

## Manual Testing Checklist

- Load the unpacked extension in Chrome and verify the popup opens correctly
- Run an audit on a normal website and confirm scores, details, and issues appear
- Verify SEO checks for title, meta description, and H1 count
- Verify accessibility checks for unlabeled links and missing image alt text
- Confirm image scoring changes based on alt-text coverage
- Open a restricted page such as `chrome://extensions` and verify the friendly restriction error
- Run multiple audits and confirm recent history is saved and clickable
- Clear history and confirm the list resets
- Export the active audit as JSON and confirm the file contains result, score, and issue data
- Export the active audit as CSV and confirm the file includes summary rows, detail rows, and issue rows
- Select a saved audit from history and confirm both JSON and CSV exports still work

## Screenshots

- Popup initial state
- Audit result with score
- Recent audits history
- JSON/CSV export buttons

## Chrome Web Store Listing Draft

**Extension name**

Frontend Audit Extension

**Short description**

Analyze the current webpage for SEO, accessibility, and image quality issues with scoring, history, and export tools.

**Detailed description**

Frontend Audit Extension helps developers, QA engineers, and frontend teams quickly review the quality of the current webpage without leaving the browser. The extension runs locally in the tab, inspects core DOM-based signals such as page title, meta description, H1 usage, image alt coverage, and accessible links, then presents a structured report with category scores and severity-based issues. It also stores recent audits in browser history for quick review and supports exporting reports as JSON or CSV for documentation, handoff, or follow-up work.

**Category suggestion**

Developer Tools

**Privacy note**

"This extension analyzes the current webpage locally in the browser. It does not send page data to any external server."

## Future Improvements

- Add performance profiling beyond DOM checks, including Core Web Vitals and resource timing
- Add page-by-page comparison between audit runs
- Add filtering and search within audit history
- Add richer accessibility checks for landmarks, form labels, and heading hierarchy
- Add downloadable PDF or shareable report views
- Add optional brandable themes for agency or consulting usage

## Resume Bullet

**Concise version**

Built a Manifest V3 Chrome extension with React and TypeScript that audits live webpages for SEO, accessibility, and image quality, with scoring, local audit history, and JSON/CSV export.

**Detailed version**

Engineered a production-style Chrome Extension using React, TypeScript, Vite, and Manifest V3 to analyze live webpages through content scripts, generate severity-based SEO and accessibility findings, calculate multi-category audit scores, persist audit history with the Chrome Storage API, and export structured reports in JSON and CSV for debugging, QA, and stakeholder handoff.

## Resume Bullet Example

Built a frontend audit Chrome extension with React, TypeScript, and Manifest V3 that analyzes active webpages for SEO, accessibility, and image issues, computes category scores, stores audit history locally, and exports reports as JSON and CSV.
