import type { BaseExample } from '../examples/types'

export class ExampleBlock {
    pageTitle: string | null;
    sectionTitle: string | null;

    private _descriptionLines: string[];
    private _codeLines: string[];
    private _outputLines: string[];

    constructor(pageTitle: string | null = null, sectionTitle: string | null = null) {
        this.pageTitle = pageTitle;
        this.sectionTitle = sectionTitle;
        this._descriptionLines = [];
        this._codeLines = [];
        this._outputLines = [];
    }

    static createEmpty(): ExampleBlock {
        return new ExampleBlock(null, null);
    }

    static create({ pageTitle = null, sectionTitle = null, description = '', codeExample = '', output = '' }: {
        pageTitle?: string | null;
        sectionTitle?: string | null;
        description?: string;
        codeExample?: string;
        output?: string;
    }): ExampleBlock {
        const b = new ExampleBlock(pageTitle, sectionTitle);
        if (description && description.length > 0) {
            b.setDescription(description);
        }
        if (codeExample && codeExample.length > 0) {
            b.setCode(codeExample);
        }
        if (output && output.length > 0) {
            b.setOutput(output);
        }
        return b;
    }

    hasContent(): boolean {
        if (this._codeLines.length > 0) return true;
        if (this._outputLines.some((l) => l.trim().length > 0)) return true;
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

    addOutputLine(line: string): void {
        this._outputLines.push(line);
    }

    setOutput(output: string): void {
        this._outputLines = output.split('\n');
    }

    clearOutput(): void {
        this._outputLines = [];
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

    getOutput(): string {
        return this._outputLines.join('\n');
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
    let inCode = false;
    let isOutputSection = false;
    let fenceLang: string | null = null;
    let pendingPush = false; // true when we've just closed an edgerules block and await possible output

    // Current block we're filling
    let current = ExampleBlock.createEmpty();

    const pushBlock = (): void => {
        // If there's nothing meaningful in this block (no desc/code/output), just reset context
        if (!current.hasContent()) {
            current = ExampleBlock.createEmpty();
            current.pageTitle = pageTitle;
            current.sectionTitle = sectionTitle;
            pendingPush = false;
            return;
        }

        // push a copy of current to avoid later mutation
        blocks.push(ExampleBlock.create({
            pageTitle: current.pageTitle,
            sectionTitle: current.sectionTitle,
            description: current.description,
            codeExample: current.codeExample,
            output: current.getOutput(),
        }));

        // reset
        current = ExampleBlock.createEmpty();
        current.pageTitle = pageTitle;
        current.sectionTitle = sectionTitle;
        pendingPush = false;
    };

    for (let i = 0; i < lines.length; i += 1) {
        const line = (lines[i] ?? '');

        const fenceMatch = line.match(/^```(\w+)?\s*$/);
        if (fenceMatch) {
            const lang = (fenceMatch[1] ?? '').toLowerCase() || null;
            if (!inCode) {
                // Opening fence
                inCode = true;
                fenceLang = lang;
                // If this is a JSON fence and we are in an output section, treat it as output collection
                // Otherwise if it's edgerules, we collect code. Other languages we'll treat as generic code (ignored by UI).
                continue;
            }

            // Closing fence. Which kind did we close?
            if (!fenceLang) {
                // unknown fence, just toggle
                inCode = false;
                fenceLang = null;
                continue;
            }

            // If we were collecting JSON output inside an output section, closing it finalizes the block
            if (fenceLang === 'json' && isOutputSection) {
                inCode = false;
                fenceLang = null;
                // finished collecting output for this block -> finalize
                pushBlock();
                isOutputSection = false;
                continue;
            }

            // If we were collecting edgerules code, closing it means code is complete; defer pushing in case output follows
            if (fenceLang === 'edgerules') {
                inCode = false;
                fenceLang = null;
                current.trimCodeEdges();
                pendingPush = true; // wait for possible output: marker
                continue;
            }

            // Any other fence closed - just stop collecting inCode
            inCode = false;
            fenceLang = null;
            continue;
        }

        if (!inCode) {
            // Only support # and ## as structural headings. ### is treated as regular content.
            const heading = line.match(/^(#{1,2})\s+(.+)/);
            if (heading && heading[1] && heading[2]) {
                // If we had a pending block (closed edgerules with no output), finalize it now
                if (pendingPush) {
                    pushBlock();
                }

                // Finalize previous non-empty block before updating context
                pushBlock();
                const level = heading[1].length; // 1 or 2
                const text = heading[2].trim();
                if (level === 1) {
                    pageTitle = text;
                    sectionTitle = null;
                } else {
                    sectionTitle = text;
                }
                isOutputSection = false;
                current.pageTitle = pageTitle;
                current.sectionTitle = sectionTitle;
                continue;
            }

            // contains only the word "output:" or "**output:**"
            if (line.match(/^output:\s*$/i) || line.match(/^\*\*output:\*\*\s*$/i)) {
                // start collecting output lines for the current block
                isOutputSection = true;
                // clear any previous output capture for this block
                current.clearOutput();
                continue;
            }

            // If we were waiting for output but encounter non-output content, finalize the pending block now
            if (pendingPush && !isOutputSection && line.trim() !== '') {
                pushBlock();
            }

            if (isOutputSection) {
                // non-fenced output lines (rare); collect as output text
                current.addOutputLine(line);
                continue;
            }
        }

        if (inCode) {
            // Route code lines based on the active fence language
            if (fenceLang === 'edgerules') {
                current.addCodeLine(line);
            } else if (fenceLang === 'json' && isOutputSection) {
                current.addOutputLine(line);
            } else {
                // other fenced content - treat as description/code: append to description to be safe
                current.addDescriptionLine(line);
            }
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

            // By default treat the line as description text. This also captures ### headings (no subtitle support).
            current.addDescriptionLine(line);
        }
    }

    // If we ended while waiting for output or after closing edgerules with no further content, finalize
    if (pendingPush || current.hasContent()) {
        pushBlock();
    }

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
            ? b.sectionTitle
            : (b.pageTitle ?? `Example ${idx + 1}`)
        const idBase = b.sectionTitle
            ? b.sectionTitle
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
