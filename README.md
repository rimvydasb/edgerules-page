# edgerules-page
EdgeRules interactive examples page

## Dev

- Prerequisites: Node 18+ and npm.
- Install: `npm install`
- Run dev: `npm run dev`
- Build: `npm run build` (output in `dist/`)

## GitHub Pages

- This repo includes a GitHub Actions workflow to build and deploy from `main` to GitHub Pages.
- Ensure repository Pages is set to “GitHub Actions”.
- If your repo name differs, update `base` in `vite.config.js` (e.g., `/your-repo-name/`).

## Editor

- Uses `react-simple-code-editor` with `prismjs` highlighting.
- Start from `src/App.jsx` to customize the editor and examples.
