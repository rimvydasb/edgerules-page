import ReactSimpleCodeEditor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import type React from 'react'

// Some bundlers/dep-optimizers double-wrap this package's CJS default export
// (`{ __esModule: true, default: Component }`); normalize to the component.
export const Editor = (ReactSimpleCodeEditor as unknown as { default?: typeof ReactSimpleCodeEditor }).default
    ?? ReactSimpleCodeEditor

export const EDITOR_STYLE: React.CSSProperties = {
    fontFamily: '"Fira Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
    overflowX: 'auto',
}

/** Prism highlighting for EdgeRules source and JSON output (the JavaScript grammar covers both well enough). */
export function highlightCode(codeStr: string): string {
    try {
        const grammar = Prism.languages['javascript'] as Prism.Grammar
        return Prism.highlight(codeStr, grammar, 'javascript')
    } catch {
        return codeStr
    }
}
