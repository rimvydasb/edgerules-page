import type { ContentMenuItem } from '../utils/parseBaseExamples'

export const CONTENT_PAGES: ContentMenuItem[] = [
    { menuTitle: '# Index', type: 'index' },
    { menuTitle: '# Basics', contentReference: 'docs/BASE_EXAMPLES.md' },
    { menuTitle: '# Lists', contentReference: 'docs/LIST_FUNCTIONS_REFERENCE.md' },
    { menuTitle: '# Numbers', contentReference: 'docs/NUMERIC_FUNCTIONS_REFERENCE.md' },
    { menuTitle: '# Strings', contentReference: 'docs/STRING_FUNCTIONS_REFERENCE.md' },
    { menuTitle: '# Dates', contentReference: 'docs/DATES_REFERENCE.md' },
    { menuTitle: '# Finance', contentReference: 'docs/FINANCE_FUNCTIONS_REFERENCE.md' },
    { menuTitle: '# User Types', contentReference: 'docs/USER_TYPES_REFERENCE.md' },
    { menuTitle: '# User Functions', contentReference: 'docs/USER_FUNCTIONS_REFERENCE.md' },
    { menuTitle: '# Loops', contentReference: 'docs/LOOP_REFERENCE.md' },
    { menuTitle: '# Rulesets', contentReference: 'docs/RULESETS_REFERENCE.md' },
    { menuTitle: '# Explain', contentReference: 'docs/EXPLAIN_REFERENCE.md' },
    { menuTitle: '# Optimise', contentReference: 'docs/OPTIMISE_REFERENCE.md' },
    { menuTitle: '# Optimise Examples', contentReference: 'docs/OPTIMISE_EXAMPLES.md' },
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
