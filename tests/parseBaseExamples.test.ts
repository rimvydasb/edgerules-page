import * as fs from "node:fs";
import * as path from "node:path";
import { parseBaseExamplesMarkdown, ExampleBlock } from "../src/utils/parseBaseExamples";

describe("BASE_EXAMPLES.md parsing (basic)", () => {
    const mdPath = path.join(process.cwd(), "public", "docs/BASE_EXAMPLES.md");
    const markdown = fs.readFileSync(mdPath, "utf8");
    const blocks: ExampleBlock[] = parseBaseExamplesMarkdown(markdown);

    test("collects all code blocks", () => {
        expect(blocks.length).toBe(14);
    });

    test("each block has titles, description, and code", () => {
        for (const b of blocks) {
            // Titles may be null, but must be present and of correct type
            expect("pageTitle" in b).toBe(true);
            expect(b.pageTitle === null || typeof b.pageTitle === "string").toBe(true);
            expect("sectionTitle" in b).toBe(true);
            expect(b.sectionTitle === null || typeof b.sectionTitle === "string").toBe(true);

            // Description and code should be strings (may be empty for some blocks)
            expect(typeof b.description).toBe("string");
            expect(typeof b.codeExample).toBe("string");
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
        const b = smallBlocks[0]!; // non-null assertion for TS strict checks
        // Should be an instance of the exported ExampleBlock class
        expect(b).toBeInstanceOf(ExampleBlock);
        expect(b.pageTitle).toBe("Test Page");
        expect(b.sectionTitle).toBe("Test Section");
        // ### heading should appear in description (no subtitle support)
        expect(b.description).toContain("Test Subtitle");
        expect(typeof b.description).toBe("string");
        expect(b.description).toContain("short description");
        expect(typeof b.codeExample).toBe("string");
        expect(b.codeExample).toContain("a: 1");
        expect(b.hasContent()).toBe(true);
    });

    test("collects output lines after 'output:' marker", () => {
        const md = `# Page\n## Section\nSome desc\n\noutput:\nThis is output line 1\nThis is output line 2\n\n\`\`\`edgerules\n{ x: 2 }\n\`\`\`\n`;
        const res = parseBaseExamplesMarkdown(md);
        expect(res.length).toBe(1);
        const b = res[0]!; // non-null assertion
        expect(b.description).toContain("Some desc");
        // getOutput() is a method on ExampleBlock
        // @ts-ignore access to method for test
        expect(typeof (b as any).getOutput).toBe("function");
        // call it and inspect output
        expect((b as any).getOutput()).toContain("This is output line 1");
        expect((b as any).getOutput()).toContain("This is output line 2");
    });
});
