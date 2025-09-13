import type { BaseExample } from '../examples/types'

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

/** Public content menu configuration item. */
export interface ContentMenuItem {
    menuTitle: string;
    contentReference: string; // relative path under public/, e.g., "BASE_EXAMPLES.md"
}

/** Compute the app base URL from Vite env, normalized with trailing slash. */
export function getBaseUrl(): string {
    const env = (import.meta as unknown as { env?: Record<string, unknown> })?.env
    const base = env ? (env['BASE_URL'] as unknown) : undefined
    const val = typeof base === 'string' && base.length > 0 ? base : '/'
    return val.endsWith('/') ? val : `${val}/`
}

/** Create a slug id from a title. */
export function toSlug(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Map parsed blocks to BaseExample records. */
export function mapBlocksToBaseExamples(blocks: ExampleBlock[]): BaseExample[] {
    return blocks.map((b, idx): BaseExample => {
        const title = b.sectionTitle
            ? (b.sectionSubtitle ? `${b.sectionTitle} · ${b.sectionSubtitle}` : b.sectionTitle)
            : (b.pageTitle ?? `Example ${idx + 1}`)
        const idBase = b.sectionTitle
            ? [b.sectionTitle, b.sectionSubtitle].filter(Boolean).join(' ')
            : (b.pageTitle ?? `example-${idx + 1}`)
        const id = toSlug(idBase)
        return { id, title, description: b.description, codeExample: b.codeExample }
    })
}

/** Fetch a markdown file from public by relative reference. */
export async function fetchMarkdown(reference: string): Promise<string> {
    // Prefer relative fetch for correct resolution under Vite base path in dev/prod
    const normalized = reference.replace(/^\/+/, '')

    const tryUrls: string[] = [normalized]
    // Fallback to explicit base prefix if relative path fails in some hosting setups
    const base = getBaseUrl()
    if (base && base !== '/' && !base.endsWith(normalized)) {
        tryUrls.push(`${base}${normalized}`)
    }

    let lastStatus: string | number = 'unknown'
    for (const url of tryUrls) {
        try {
            const resp = await fetch(url)
            if (resp.ok) return await resp.text()
            lastStatus = resp.status
        } catch (e) {
            lastStatus = (e as Error)?.message || String(e)
        }
    }
    throw new Error(`Failed to fetch ${reference}: ${lastStatus}`)
}

/** Fetch a markdown page and return mapped BaseExamples. */
export async function fetchAndParseBaseExamples(reference: string): Promise<BaseExample[]> {
    const md = await fetchMarkdown(reference)
    const blocks = parseBaseExamplesMarkdown(md)
    return mapBlocksToBaseExamples(blocks)
}
