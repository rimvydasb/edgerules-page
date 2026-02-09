# EdgeRules Examples Page

Interactive reference and playground for the EdgeRules language, built with Vite and React. Deployed to GitHub Pages.

Live site: https://rimvydasb.github.io/edgerules-page/

## Quick Start

- see [AGENTS.md](AGENTS.md)

## Page Contents

- `src/examples/index.ts`: seed list of examples (`BASE_EXAMPLES`)

## WASM

- The EdgeRules WASM module is copied from the [main repo](https://github.com/rimvydasb/edgerules) after each release
  manually.

## Next Steps:

You will add a possibility to share and receive examples via URL query parameters, and then you will be able to share
your own examples with others by sharing the URL.

- [ ] Add support of resetting `# Playground` to either default example or state provided by URL query parameter (e.g.
  `?h=compressedExampleString`). Add button `Reset` to the right side of the header on `# Playground` page.
- [ ] Add share button only on `# Playground` page Playground.tsx on the right side of the header on the right side of
  `Reset` button.
- [ ] When user clicks `Share` button, the current state of the playground (e.g. content of the editor) should be
  compressed and encoded into a string (e.g. using LZString library) and added to the URL as a query parameter (e.g.
  `?h=compressedExampleString`). The URL should be copied to the clipboard and shown to the user in a tooltip or
  modal.
- [ ] When the page loads, it should check if the query parameter (e.g. `h`) is present in the URL. If it is, it should
  decode and decompress the string to get the original state of the playground and set it as the current state. User can
  share parameter such as
  `http://localhost:5173/edgerules-page/?h=compressedExampleString` with others, and when they open the URL, they will
  see the same state in their playground.

Examples:

```typescript
import LZString from 'lz-string';

const data = {ruleId: 123, action: 'block', pattern: '*.js'};
const jsonString = JSON.stringify(data);

const compressed = LZString.compressToEncodedURIComponent(jsonString);
const url = `http://localhost:5173/edgerules-page/?h=${compressed}`;
```

```typescript
import LZString from 'lz-string';

// Assuming you are using a router or native URLSearchParams
const params = new URLSearchParams(window.location.search);
const hParam = params.get('h');

if (hParam) {
    const decompressed = LZString.decompressFromEncodedURIComponent(hParam);

    if (decompressed) {
        const originalData = JSON.parse(decompressed);
        console.log(originalData);
    } else {
        console.error("Failed to decompress data: string might be corrupted or truncated.");
    }
}
```
