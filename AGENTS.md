## Overview

- Vite + React app that renders interactive EdgeRules examples.
- Content comes from Markdown files in `public/` and is parsed at runtime.
- Examples are evaluated in-browser via the EdgeRules WebAssembly module.

> Do not run the dev server. Run npm run build to verify the code instead.

## Dev

- Prerequisites: Node 20+ and npm.
- Install: `npm install`
- Run dev: `npm run dev`
- Build: `npm run build` (output in `dist/`)

## Maintenance

```bash
ncu -u            # update dependencies
npm install       # install updated deps
```

## GitHub Pages

- GitHub Actions builds and deploys `main` to GitHub Pages.
- In repo settings, set Pages to “GitHub Actions”.
- If the repo name or path changes, update `base` in `vite.config.js`.

## Editor & Highlighting

- Uses `react-simple-code-editor` with `prismjs` (JavaScript grammar).
- See `src/styles.css` for the custom bright theme.

## Project Structure

- `src/App.tsx`: top-level UI, loads Markdown pages, runs examples, renders editors.
- `src/components/Footer.tsx`: footer component.
- `src/content/pages.ts`: menu with Markdown page references.
- `src/utils/parseBaseExamples.ts`: Markdown parsing and mapping to examples.
- `src/examples/types.ts`: shared `BaseExample` and `Example` types.
- `public/*.md`: content pages (Introduction, Lists, Strings, etc.).

## How Markdown Is Read and Displayed (Chrome front page)

- Menu: `src/content/pages.ts` lists pages with `contentReference` paths under `public/`.
- Fetch: `src/utils/parseBaseExamples.ts#fetchMarkdown` loads the file. It respects the Vite base URL
  via `getBaseUrl()` so it works in dev and on GitHub Pages in Chrome.
- Parse: `parseBaseExamplesMarkdown` reads the Markdown into blocks:
  - `#` sets page title, `##` section title, `###` section subtitle.
  - Each fenced code block becomes one example. Language tag is optional; when `edgerules` is used,
    leading and trailing blank lines are trimmed inside the fence.
  - Text between headings and the next code fence becomes the example description.
- Map: `mapBlocksToBaseExamples` creates `BaseExample` items with a slug `id` and a computed `title`:
  - If section + subtitle exist → `Section · Subtitle`.
  - Else falls back to the page title (or `Example n`).
- Display: `src/App.tsx` loads the selected page, converts each `BaseExample` to an `Example` with
  `input`, then renders two editors per example: editable input (left) and read-only output (right).
- Evaluate: When the WASM module is ready, `evaluateExpression` is used for a single non-empty line,
otherwise `evaluateAll`. Errors are shown in the output panel.
Tip: To add a new example, edit the Markdown under `public/`. Use headings for titles and fenced code
blocks (check the existing files for examples).

## WASM Integration

- `index.html` loads the EdgeRules WASM (see `public/pkg-web/`).
- On success it dispatches `window.dispatchEvent(new CustomEvent('edgerules-ready'))`.
- `src/App.tsx` listens for `edgerules-ready` / `edgerules-error` and stores the module in a ref.
- All evaluation happens client-side in the browser.

## Code Style

- Indentation: 4 spaces.
- Maximum line length: 120 characters.
- TypeScript strict mode; prefer explicit types on public APIs.
- Keep components small and colocate related code.
- Avoid unnecessary dependencies; prefer Vite-native patterns.

## Notes for Agents / Contributors

- Content is driven by Markdown under `public/`; no rebuild is required to tweak examples during dev.
- The parser is intentionally simple; avoid adding heavy Markdown libs unless necessary.
- When adding pages, include them in `src/content/pages.ts` so they appear in the header menu.
