export interface ExampleBlock {
    pageTitle: string | null;
    sectionTitle: string | null;
    sectionSubtitle: string | null;
    description: string;
    codeExample: string;
}

/**
 * Parse BASE_EXAMPLES.md into structured blocks.
 * A new block is created for each fenced code block, with context derived from the nearest preceding headings.
 */
export function parseBaseExamplesMarkdown(markdown: string): ExampleBlock[] {
    const lines = markdown.split(/\r?\n/);
    const blocks: ExampleBlock[] = [];

    let pageTitle: string | null = null;
    let sectionTitle: string | null = null;
    let sectionSubtitle: string | null = null;
    let descriptionLines: string[] = [];
    let inCode = false;
    let codeLines: string[] = [];

    const pushBlock = (): void => {
        const description = descriptionLines.join("\n").trim();
        const codeExample = codeLines.join("\n");
        blocks.push({ pageTitle, sectionTitle, sectionSubtitle, description, codeExample });
        descriptionLines = [];
        codeLines = [];
    };

    for (let i = 0; i < lines.length; i += 1) {
        const line = (lines[i] ?? "");

        if (!inCode) {
            const m1 = line.match(/^#\s+(.+)/);
            if (m1 && m1[1]) {
                pageTitle = m1[1].trim();
                sectionTitle = null;
                sectionSubtitle = null;
                descriptionLines = [];
                continue;
            }

            const m2 = line.match(/^##\s+(.+)/);
            if (m2 && m2[1]) {
                sectionTitle = m2[1].trim();
                sectionSubtitle = null;
                descriptionLines = [];
                continue;
            }

            const m3 = line.match(/^###\s+(.+)/);
            if (m3 && m3[1]) {
                sectionSubtitle = m3[1].trim();
                descriptionLines = [];
                continue;
            }
        }

        const isFence = /^```(\w+)?\s*$/.test(line);
        if (isFence) {
            if (!inCode) {
                inCode = true;
                continue;
            }
            inCode = false;
            pushBlock();
            continue;
        }

        if (inCode) {
            codeLines.push(line);
        } else {
            if (line.trim() === "" && descriptionLines.length === 0) {
                continue;
            }
            descriptionLines.push(line);
        }
    }

    return blocks;
}
