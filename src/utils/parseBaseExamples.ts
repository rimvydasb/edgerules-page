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
    let fenceLang: string | null = null;

    const hasPendingContent = (): boolean => {
        if (codeLines.length > 0) return true;
        return descriptionLines.some((line) => line.trim().length > 0);
    };

    const pushBlock = (): void => {
        if (!hasPendingContent()) {
            descriptionLines = [];
            codeLines = [];
            return;
        }
        const description = descriptionLines.join(" ");
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
                pushBlock();
                pageTitle = m1[1].trim();
                sectionTitle = null;
                sectionSubtitle = null;
                descriptionLines = [];
                continue;
            }

            const m2 = line.match(/^##\s+(.+)/);
            if (m2 && m2[1]) {
                pushBlock();
                sectionTitle = m2[1].trim();
                sectionSubtitle = null;
                descriptionLines = [];
                continue;
            }

            const m3 = line.match(/^###\s+(.+)/);
            if (m3 && m3[1]) {
                pushBlock();
                sectionSubtitle = m3[1].trim();
                descriptionLines = [];
                continue;
            }
        }

        const fenceOpen = line.match(/^```(\w+)?\s*$/);
        if (fenceOpen) {
            if (!inCode) {
                inCode = true;
                fenceLang = (fenceOpen[1] ?? '').toLowerCase() || null;
                continue;
            }

            inCode = false;
            if (fenceLang === 'edgerules') {
                while (codeLines.length > 0 && (codeLines[0] ?? '').trim() === '') codeLines.shift();
                while (codeLines.length > 0 && (codeLines[codeLines.length - 1] ?? '').trim() === '') codeLines.pop();
            }
            pushBlock();
            fenceLang = null;
            continue;
        }

        if (inCode) {
            codeLines.push(line);
        } else {
            if (line.trim() === "" && descriptionLines.length === 0) {
                continue;
            }

            // starts with -
            const listMatch = line.match(/^\s*-\s+(.*)/);
            if (listMatch) {
                // remove -
                let trimmed = line.replace(/^\s*-\s+/, '• ');
                descriptionLines.push(trimmed);
                descriptionLines.push("\n\n\n");
                continue;
            }

            if (line.trim() === "" && descriptionLines.length > 0) {
                descriptionLines.push("\n\n\n");
                continue;
            }

            descriptionLines.push(line);
        }
    }

    pushBlock();

    return blocks;
}

/** Public content menu configuration item. */
export interface MarkdownContentMenuItem {
    menuTitle: string;
    type?: 'markdown';
    contentReference: string; // relative path under public/, e.g., "BASE_EXAMPLES.md"
}

export interface PlaygroundContentMenuItem {
    menuTitle: string;
    type: 'playground';
}

export type ContentMenuItem = MarkdownContentMenuItem | PlaygroundContentMenuItem;

export function isMarkdownContentMenuItem(item: ContentMenuItem): item is MarkdownContentMenuItem {
    return (item as MarkdownContentMenuItem).contentReference !== undefined;
}

/** Compute the app base URL from Vite env, normalized with trailing slash. */
export function getBaseUrl(): string {
    const globalBase = typeof globalThis !== 'undefined'
        ? (globalThis as typeof globalThis & { __VITE_BASE_URL__?: unknown }).__VITE_BASE_URL__
        : undefined
    const val = typeof globalBase === 'string' && globalBase.length > 0 ? globalBase : '/'
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

// Pretty objects, but NEVER wrap arrays (inline them).
export function stringifyNoWrapLists(value: unknown, indent = 2): string {
    const pad = (n: number) => ' '.repeat(n * indent);

    const prim = (v: unknown) =>
        v === null || ['string', 'number', 'boolean'].includes(typeof v);

    const fmt = (v: unknown, lvl: number): string => {
        if (v === null) return 'null';
        const t = typeof v;

        if (t === 'string') return JSON.stringify(v);
        if (t === 'number' || t === 'boolean') return String(v);
        if (t === 'bigint') return `"${String(v)}"`; // keep JSON-safe

        if (Array.isArray(v)) {
            // Always inline arrays
            const parts = v.map((x) =>
                prim(x) ? fmt(x, 0) : fmt(x, lvl + 1) // complex items still allowed
            );
            // If any complex item expanded to multi-line, keep commas with a space
            return `[${parts.join(', ')}]`;
        }

        if (t === 'object') {
            const o = v as Record<string, unknown>;
            const keys = Object.keys(o);
            if (keys.length === 0) return '{}';
            const body = keys
                .map((k) => `${JSON.stringify(k)}: ${fmt(o[k], lvl + 1)}`)
                .map((line) => pad(lvl + 1) + line)
                .join('\n');
            return `{\n${body}\n${pad(lvl)}}`;
        }

        // functions/symbol/undefined -> stringify safely
        return JSON.stringify(String(v));
    };

    return fmt(value, 0);
}

// Use it in your existing function
export function formatWasmResult(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return String(value);
    }
    if (value instanceof Error) return value.message;

    try {
        return stringifyNoWrapLists(value, 2);
    } catch {
        return String(value);
    }
};
