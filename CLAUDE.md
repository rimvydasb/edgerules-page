# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Vite + React (TypeScript) app that renders an interactive reference/playground for the EdgeRules language.
Content comes from Markdown files in `public/docs/` parsed at runtime. Examples are evaluated in-browser
via the EdgeRules WebAssembly module. Deployed to GitHub Pages: https://rimvydasb.github.io/edgerules-page/

## Commands

- Install: `npm install`
- Build (verify changes): `npm run build` — output in `dist/`
- Preview build: `npm run preview`
- Typecheck: `npm run typecheck` (`tsc --noEmit`)
- Test: `npm test` (Jest, runs files under `tests/**/*.test.ts`)
- Backtest doc examples against the engine: `npm run check:docs`
- Run a single test file: `npx jest tests/parseBaseExamples.test.ts`
- Dev server: `npm run dev` — **do not run this yourself**; use `npm run build` to verify code instead.
  `tests/devServerSmoke.test.ts` expects a dev server already running at `http://localhost:5173/edgerules-page/`
  (override with `EDGE_RULES_BASE_URL`), so it will fail without one.

## Architecture

### Markdown-driven content pipeline

- `src/content/pages.ts`: menu definition — each entry is either a content page (`contentReference` →
  a path under `public/`) or one of the special `{ type: 'index' }` / `{ type: 'playground' }` entries.
  Pages are addressed by URL hash slugs derived from `menuTitle` (`# User Types` → `#user-types`); menu and
  in-page links are plain `#slug` anchors, and `App.tsx` follows `hashchange`. With no hash the front page
  (`#index`) opens, unless a shared `?h=` playground link is present.
- `src/utils/parseBaseExamples.ts`:
  - `fetchMarkdown` — loads a markdown file, respecting the Vite base URL via `getBaseUrl()` (works in
    dev and on GitHub Pages).
  - `parseBaseExamplesMarkdown` — parses markdown into blocks: `#` sets page title, `##` section title,
    `###` section subtitle. Each fenced code block becomes one example (language tag optional; for
    `edgerules` blocks, leading/trailing blank lines inside the fence are trimmed). Text between a
    heading and the next code fence becomes the example description.
  - `mapBlocksToBaseExamples` — turns parsed blocks into `BaseExample` items with a slug `id` and a
    computed `title` (`Section · Subtitle`, or falls back to page title / `Example n`).
  - `fetchAndParseBaseExamples` — combines fetch + parse + map.
- `src/examples/types.ts`: shared `BaseExample` and `Example` types (`Example` adds `input`, `output`,
  `isError` for the editable/evaluated state).
- To add a new example: edit the relevant Markdown file under `public/docs/`; no rebuild needed in dev.
  To add a new page: create the Markdown file and register it in `src/content/pages.ts`.

### Front page (`#index`)

- `src/components/FrontPage.tsx` renders the landing page; its copy and examples live in `src/content/frontPage.ts`
  (adapted from the core repo README, up to "Built-in Function Library").
- The Introduction example is not duplicated: it is the first code block of `public/docs/BASE_EXAMPLES.md`.
- `src/components/LiveExample.tsx` is a self-contained editable input ↦ evaluated output pair used by the front page;
  `src/components/CodeEditor.tsx` holds the shared editor component, style, and Prism highlighter.

### App shell and evaluation flow (`src/App.tsx`)

- Loads the markdown for the active page, converts each `BaseExample` into an `Example`, and renders two
  CodeMirror/`react-simple-code-editor` panes per example: editable input (left) and read-only output
  (right).
- Evaluation: once the engine is loaded, every example is evaluated asynchronously via `evaluateSource`; results
  and errors are rendered via `formatWasmResult` in the output panel.
- Playground tab (`type: 'playground'` page, `src/components/Playground.tsx`): seeded from
  `public/docs/PLAYGROUND.md`'s first code block. Supports sharing state via the `?h=` URL query param,
  compressed/decompressed with `lz-string` (`LZString.compressToEncodedURIComponent` /
  `decompressFromEncodedURIComponent`).

### EdgeRules engine (npm)

- The engine comes from the `@edgerules/web` npm package (plus `@edgerules/portable` types); keep its version in
  sync with `edgerules-react`. Check for updates with `npm view @edgerules/web dist-tags`.
- `src/utils/engine.ts`: `loadEngine()` awaits `init()` (fetches the WASM, bundled by Vite) and returns a service
  factory. Models declaring an `optimise` element (`service.requiresSolver()`) get highs-js registered as solver;
  `highs` and its WASM are lazy-loaded only then.
- `src/utils/evaluate.ts`: `evaluateSource` runs a `{ ... }` model as-is and wraps a bare expression as
  `{ result: <expr> }`, returning only `result` (same convention as the core repo's reference backtest).
  `execute` is async; thrown parse/link errors are normalized to `{ '@kind': 'error', type, message }`.
- `vite.config.js` excludes `@edgerules/web` and `highs` from `optimizeDeps` so their `.wasm` files resolve.
- Reference docs in `public/docs/` are copied from the core repo's `doc/reference/` (excluding `_REFERENCE.md` and
  host-facing `OPTIMISE_SOLVER_HOSTING.md`). `npm run check:docs` backtests every example that has an
  `**output:**` (or `**output (`field`):**`) block against `@edgerules/node` + highs-js.

### Deployment

- GitHub Actions (`.github/workflows/`) builds and deploys `main` to GitHub Pages on push.
- `base` in `vite.config.js` must match the GitHub Pages path (`/edgerules-page/`) — update both if the
  repo name or path changes.

## Code Style

- Indentation: 4 spaces.
- Maximum line length: 120 characters.
- TypeScript strict mode; prefer explicit types on public APIs.
- Keep components small and colocate related code.
- Avoid unnecessary dependencies; prefer Vite-native patterns. The markdown parser is intentionally simple
  — avoid adding heavy Markdown libraries unless necessary.
