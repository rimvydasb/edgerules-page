## Dev

- Prerequisites: Node 20+ and npm.
- Install: `npm install`
- Run dev: `npm run dev`
- Build: `npm run build` (output in `dist/`)

## GitHub Pages

- This repo includes a GitHub Actions workflow to build and deploy from `main` to GitHub Pages.
- Ensure repository Pages is set to “GitHub Actions”.
- If your repo name differs, update `base` in `vite.config.js` (e.g., `/your-repo-name/`).

## Editor

- Uses `react-simple-code-editor` with `prismjs` highlighting.
- Start from `src/App.tsx` to customize the editor and examples.

## Project Structure

- `src/App.tsx`: top-level page composition and state for examples.
- `src/components/Footer.tsx`: extracted footer component.
- `src/examples/index.ts`: base examples data (`BASE_EXAMPLES`).
- `src/examples/types.ts`: shared `BaseExample` and `Example` types.
- `src/styles.css`: global styles (including footer and examples layout).

## Code Style

- Indentation: 4 spaces.
- Maximum line length: 120 characters.
- TypeScript strict mode is enabled; prefer explicit types on public APIs.
- Keep components small, focused, and colocate related code.
- Avoid unnecessary dependencies; prefer Vite-native patterns.

## Working With Examples

- Add or edit seed examples in `src/examples/index.ts` (`BASE_EXAMPLES`).
- `App.tsx` maps `BASE_EXAMPLES` into runtime `Example` state, adding `input`, `output`, and `error`.

## WASM Integration

- The EdgeRules WASM module is exposed on `window.__edgeRules` from `index.html`.
- `App.tsx` listens for `edgerules-ready` / `edgerules-error` and updates outputs when ready.
