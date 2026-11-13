import type { ContentMenuItem } from '../utils/parseBaseExamples'

export const CONTENT_PAGES: ContentMenuItem[] = [
    { menuTitle: '# Index', type: 'index' },
    { menuTitle: '# Basics', contentReference: 'docs/base-examples.md' },
    { menuTitle: '# Lists', contentReference: 'docs/list-functions-reference.md' },
    { menuTitle: '# Numbers', contentReference: 'docs/numeric-functions-reference.md' },
    { menuTitle: '# Strings', contentReference: 'docs/string-functions-reference.md' },
    { menuTitle: '# Dates', contentReference: 'docs/dates-reference.md' },
    { menuTitle: '# Finance', contentReference: 'docs/finance-functions-reference.md' },
    { menuTitle: '# User Types', contentReference: 'docs/user-types-reference.md' },
    { menuTitle: '# User Functions', contentReference: 'docs/user-functions-reference.md' },
    { menuTitle: '# Loops', contentReference: 'docs/loop-reference.md' },
    { menuTitle: '# Rulesets', contentReference: 'docs/rulesets-reference.md' },
    { menuTitle: '# Explain', contentReference: 'docs/explain-reference.md' },
    { menuTitle: '# Optimise', contentReference: 'docs/optimise-reference.md' },
    { menuTitle: '# Optimise Examples', contentReference: 'docs/optimise-examples.md' },
    { menuTitle: '# Decision Layers', contentReference: 'docs/decision-layers-reference.md' },
    { menuTitle: '# Playground', type: 'playground' },
]

/** URL hash slug of a menu item: `# User Types` → `user-types`. */
export function pageSlug(item: ContentMenuItem): string {
    return item.menuTitle.replace(/^#\s*/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Index of the page addressed by a URL hash (`#basics`), or -1 when none matches. */
export function pageIndexFromHash(hash: string): number {
    const slug = hash.replace(/^#/, '').toLowerCase()
    return CONTENT_PAGES.findIndex((item) => pageSlug(item) === slug)
}
