import type { BaseExample } from '../examples/types'

export class ExampleBlock {
    pageTitle: string | null;
    sectionTitle: string | null;
    sectionSubtitle: string | null;

    private _descriptionLines: string[];
    private _codeLines: string[];

    constructor(pageTitle: string | null = null, sectionTitle: string | null = null, sectionSubtitle: string | null = null) {
        this.pageTitle = pageTitle;
        this.sectionTitle = sectionTitle;
        this.sectionSubtitle = sectionSubtitle;
        this._descriptionLines = [];
        this._codeLines = [];
    }

    static createEmpty(): ExampleBlock {
        return new ExampleBlock(null, null, null);
    }

    static create({ pageTitle = null, sectionTitle = null, sectionSubtitle = null, description = '', codeExample = '' }: {
        pageTitle?: string | null;
        sectionTitle?: string | null;
        sectionSubtitle?: string | null;
        description?: string;
        codeExample?: string;
    }): ExampleBlock {
        const b = new ExampleBlock(pageTitle, sectionTitle, sectionSubtitle);
        if (description && description.length > 0) {
            // Keep description as single string blocks (parser uses joined strings)
            b.setDescription(description);
        }
        if (codeExample && codeExample.length > 0) {
            b.setCode(codeExample);
        }
        return b;
    }

    hasContent(): boolean {
        if (this._codeLines.length > 0) return true;
        return this._descriptionLines.some((l) => l.trim().length > 0);
    }

    // Helpers used by the parser
    addDescriptionLine(line: string): void {
        this._descriptionLines.push(line);
    }

    addBlankParagraph(): void {
        this._descriptionLines.push('\n\n\n');
    }

    setDescription(description: string): void {
        // Replace internal lines with a single-line description (parser-specific formatting)
        this._descriptionLines = [description];
    }

    clearDescription(): void {
        this._descriptionLines = [];
    }

    addCodeLine(line: string): void {
        this._codeLines.push(line);
    }

    setCode(code: string): void {
        this._codeLines = code.split('\n');
    }

    clearCode(): void {
        this._codeLines = [];
    }

    trimCodeEdges(): void {
        while (this._codeLines.length > 0 && (this._codeLines[0] ?? '').trim() === '') this._codeLines.shift();
        while (this._codeLines.length > 0 && (this._codeLines[this._codeLines.length - 1] ?? '').trim() === '') this._codeLines.pop();
    }

    get description(): string {
        return this._descriptionLines.join(' ');
    }

    get codeExample(): string {
        return this._codeLines.join('\n');
    }
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
    let inCode = false;
    let isOutputSection = false;
    let fenceLang: string | null = null;

    // Current block we're filling
    let current = ExampleBlock.createEmpty();

    const pushBlock = (): void => {
        if (!current.hasContent()) {
            // reset current to pick up new context
            current = ExampleBlock.createEmpty();
            // ensure context propagates
            current.pageTitle = pageTitle;
            current.sectionTitle = sectionTitle;
            current.sectionSubtitle = sectionSubtitle;
            return;
        }

        if (isOutputSection) {
            // Clear any collected description/code lines, as they belong to output
            current.clearDescription();
            current.clearCode();
            isOutputSection = false;
            current = ExampleBlock.createEmpty();
            current.pageTitle = pageTitle;
            current.sectionTitle = sectionTitle;
            current.sectionSubtitle = sectionSubtitle;
            return;
        }

        // push a copy of current to avoid later mutation
        blocks.push(ExampleBlock.create({
            pageTitle: current.pageTitle,
            sectionTitle: current.sectionTitle,
            sectionSubtitle: current.sectionSubtitle,
            description: current.description,
            codeExample: current.codeExample,
        }));

        // reset
        current = ExampleBlock.createEmpty();
        current.pageTitle = pageTitle;
        current.sectionTitle = sectionTitle;
        current.sectionSubtitle = sectionSubtitle;
    };

    for (let i = 0; i < lines.length; i += 1) {
        const line = (lines[i] ?? '');

        // Consolidated heading matcher for #, ##, ### to reduce repetition
        if (!inCode) {
            const heading = line.match(/^(#{1,3})\s+(.+)/);
            if (heading && heading[1] && heading[2]) {
                pushBlock();
                const level = heading[1].length; // 1,2,3
                const text = heading[2].trim();
                if (level === 1) {
                    pageTitle = text;
                    sectionTitle = null;
                    sectionSubtitle = null;
                } else if (level === 2) {
                    sectionTitle = text;
                    sectionSubtitle = null;
                } else {
                    sectionSubtitle = text;
                }
                isOutputSection = false;
                current.pageTitle = pageTitle;
                current.sectionTitle = sectionTitle;
                current.sectionSubtitle = sectionSubtitle;
                continue;
            }
        }

        if (!inCode) {
            // contains only the word "output:" or "**output:**"
            if (line.match(/^output:\s*$/i) || line.match(/^\*\*output:\*\*\s*$/i)) {
                // ignore everything that is below output
                isOutputSection = true;
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

            // closing fence
            inCode = false;
            if (fenceLang === 'edgerules') {
                current.trimCodeEdges();
            }
            pushBlock();
            fenceLang = null;
            continue;
        }

        if (inCode) {
            current.addCodeLine(line);
        } else {
            if (line.trim() === '' && !current.hasContent()) {
                continue;
            }

            // starts with -
            const listMatch = line.match(/^\s*-\s+(.*)/);
            if (listMatch) {
                // remove - and replace with bullet
                let trimmed = line.replace(/^\s*-\s+/, '• ');
                current.addDescriptionLine(trimmed);
                current.addBlankParagraph();
                continue;
            }

            if (line.trim() === '' && current.hasContent()) {
                current.addBlankParagraph();
                continue;
            }

            current.addDescriptionLine(line);
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
}
