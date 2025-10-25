import * as fs from "node:fs";
import * as path from "node:path";
import { parseBaseExamplesMarkdown, ExampleBlock } from "../src/utils/parseBaseExamples";

describe("BASE_EXAMPLES.md parsing (basic)", () => {
    const mdPath = path.join(process.cwd(), "public", "docs/BASE_EXAMPLES.md");
    const markdown = fs.readFileSync(mdPath, "utf8");
    const blocks: ExampleBlock[] = parseBaseExamplesMarkdown(markdown);

    test("collects all code blocks", () => {
        expect(blocks.length).toBe(13);
    });

    test("each block has titles, description, and code", () => {
        for (const b of blocks) {
            // Titles may be null, but must be present and of correct type
            expect("pageTitle" in b).toBe(true);
            expect(b.pageTitle === null || typeof b.pageTitle === "string").toBe(true);
            expect("sectionTitle" in b).toBe(true);
            expect(b.sectionTitle === null || typeof b.sectionTitle === "string").toBe(true);
            expect("sectionSubtitle" in b).toBe(true);
            expect(b.sectionSubtitle === null || typeof b.sectionSubtitle === "string").toBe(true);

            // Description and code must be non-empty strings
            expect(typeof b.description).toBe("string");
            expect(b.description.length).toBeGreaterThan(0);
            expect(typeof b.codeExample).toBe("string");
            expect(b.codeExample.length).toBeGreaterThan(0);
        }
    });

    test("parses inline markdown string into ExampleBlock instances", () => {
        const smallMd = `# Test Page
## Test Section
### Test Subtitle
This is a short description line.

\`\`\`edgerules
{
  a: 1
}
\`\`\`
`;
        const smallBlocks = parseBaseExamplesMarkdown(smallMd);
        expect(smallBlocks.length).toBe(1);
        const b = smallBlocks[0];
        // Should be an instance of the exported ExampleBlock class
        expect(b).toBeInstanceOf(ExampleBlock);
        expect(b.pageTitle).toBe("Test Page");
        expect(b.sectionTitle).toBe("Test Section");
        expect(b.sectionSubtitle).toBe("Test Subtitle");
        expect(typeof b.description).toBe("string");
        expect(b.description).toContain("short description");
        expect(typeof b.codeExample).toBe("string");
        expect(b.codeExample).toContain("a: 1");
        expect(b.hasContent()).toBe(true);
    });
});
