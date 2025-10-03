import React, {useEffect, useMemo, useRef, useState} from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
// Using custom bright theme styles in src/styles.css
import Footer from './components/Footer'
import type { BaseExample, Example } from './examples/types'
import { fetchAndParseBaseExamples } from './utils/parseBaseExamples'
import { CONTENT_PAGES } from './content/pages'

export default function App() {
    const [lang] = useState<'javascript'>('javascript')
    const [wasmReady, setWasmReady] = useState(false)
    const [wasmError, setWasmError] = useState<string | null>(null)
    const wasmRef = useRef<EdgeRulesMod | null>(null)
    const [examples, setExamples] = useState<Example[]>([])
    const [activeIndex, setActiveIndex] = useState<number>(0)

    const highlight = useMemo<((codeStr: string) => string)>(() => (codeStr: string) => {
        try {
            const grammar = Prism.languages['javascript'] as Prism.Grammar
            return Prism.highlight(codeStr, grammar, 'javascript')
        } catch {
            return codeStr
        }
    }, [])

    // Access WASM module exposed via index.html module script as window.__edgeRules
    useEffect(() => {
        let cancelled = false

        const attach = async (mod: EdgeRulesMod) => {
            const ok = await mod.ready
            if (!ok) throw new Error('EdgeRules WASM failed to initialize')
            if (!cancelled) {
                wasmRef.current = mod
                setWasmReady(true)
            }
        }

        const onReady = () => {
            if (!cancelled && window.__edgeRules) {
                attach(window.__edgeRules).catch((e: unknown) => setWasmError((e as Error)?.message || String(e)))
            }
        }
        const onError = (e: CustomEvent<{ error?: Error }>) => {
            if (!cancelled) setWasmError(e?.detail?.error?.message || 'WASM loader error')
        }

        if (window.__edgeRules) {
            attach(window.__edgeRules).catch((e: unknown) => setWasmError((e as Error)?.message || String(e)))
        } else {
            window.addEventListener('edgerules-ready', onReady as EventListener, {once: true})
            window.addEventListener('edgerules-error', onError as EventListener, {once: true})
        }

        return () => {
            cancelled = true
            window.removeEventListener('edgerules-ready', onReady as EventListener)
            window.removeEventListener('edgerules-error', onError as EventListener)
        }
    }, [])

    const formatWasmResult = (value: unknown): string => {
        if (value === undefined || value === null) return ''
        if (typeof value === 'string') return value
        if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
            return String(value)
        }
        if (value instanceof Error) return value.message
        try {
            return JSON.stringify(value, null, 2)
        } catch {
            return String(value)
        }
    }

    // Single place for evaluating input via the WASM module
    const evaluateWithMod = (mod: EdgeRulesMod, input: string): string => {
        const nonEmptyLines = input.split(/\r?\n/).filter((l) => l.trim() !== '')
        const result = nonEmptyLines.length === 1
            ? mod.evaluate_expression(nonEmptyLines[0]!)
            : mod.evaluate_all(input)
        return formatWasmResult(result)
    }

    // Helper to compute outputs for current examples
    const computeOutputs = (items: Example[]): Example[] => {
        const mod = wasmRef.current
        if (!mod) return items

        return items.map((ex): Example => {
            try {
                const out = evaluateWithMod(mod, ex.input)
                return { ...ex, output: out, error: null }
            } catch (err) {
                return { ...ex, output: '', error: (err as Error)?.message ?? String(err) }
            }
        })
    }

    // Recompute outputs when WASM becomes ready
    useEffect(() => {
        if (!wasmReady || !wasmRef.current) return
        setExamples(prev => computeOutputs(prev))
    }, [wasmReady])

    // Load selected page markdown and seed examples; recompute when WASM ready
    useEffect(() => {
        let cancelled = false

        const loadPage = async (): Promise<void> => {
            const item = CONTENT_PAGES[activeIndex]
            if (!item) return
            const ref = item.contentReference
            try {
                const seed: BaseExample[] = await fetchAndParseBaseExamples(ref)
                const ex: Example[] = seed.map((e: BaseExample): Example => ({ ...e, input: e.codeExample, output: '', error: null }))
                if (!cancelled) {
                    setExamples(() => {
                        const next = ex
                        return wasmRef.current ? computeOutputs(next) : next
                    })
                }
            } catch {
                if (!cancelled) setExamples([])
            }
        }

        void loadPage()
        return () => { cancelled = true }
    }, [activeIndex, wasmReady])

    const onChangeExample = (id: string, value: string) => {
        const mod = wasmRef.current
        if (!mod) {
            setExamples(prev => prev.map(ex => ex.id === id ? { ...ex, input: value } : ex))
            return
        }

        try {
            const out = evaluateWithMod(mod, value)
            setExamples(prev => prev.map(ex => ex.id === id ? { ...ex, input: value, output: out, error: null } : ex))
        } catch (err) {
            const msg = (err as Error)?.message ?? String(err)
            setExamples(prev => prev.map(ex => ex.id === id ? { ...ex, input: value, output: '', error: msg } : ex))
        }
    }

    return (
        <div className="page bright">
            <header className="header bright">
                <h1>EdgeRules Language</h1>
                <p>Reference and Interactive Playground</p>
                <nav className="header__nav" aria-label="Content menu">
                    <ul className="header__menu">
                        {CONTENT_PAGES.map((item, idx) => (
                            <li key={`${item.menuTitle}-${idx}`} className={idx === activeIndex ? 'active' : ''}>
                                <button
                                    type="button"
                                    className="header__menu-btn"
                                    aria-current={idx === activeIndex ? 'page' : undefined}
                                    onClick={() => setActiveIndex(idx)}
                                >
                                    {item.menuTitle}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>
            <div className="container">
                <div className="container__content">
                    {!wasmReady && !wasmError && <p>Loading WebAssembly…</p>}
                    {wasmError && <p style={{color: '#b91c1c'}}>WASM load error: {wasmError}</p>}

                    {examples.map(ex => (
                        <React.Fragment key={ex.id}>
                            <div className="example-row-header">
                                <h3 className="example-title"># {ex.title}</h3>
                            </div>

                            <section className="example-row">
                                {/* description */}
                                <div className="example-col example-output top-row">
                                    <p className="example-desc">{ex.description}</p>
                                </div>

                                {/* input editor */}
                                <div className="example-col example-editor">
                                    <Editor
                                        value={ex.input}
                                        onValueChange={(v) => onChangeExample(ex.id, v)}
                                        highlight={highlight}
                                        padding={16}
                                        textareaId={`editor-${ex.id}`}
                                        className="container__editor editor"
                                        preClassName={`language-${lang} no-wrap`}
                                        textareaClassName="no-wrap"
                                        style={{
                                            fontFamily: '"Fira Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                            fontSize: 12,
                                            overflowX: 'auto',
                                        }}
                                    />
                                </div>

                                {/* arrow */}
                                <div className="example-col example-arrow" aria-hidden="true">
                                    <div className="arrow-glyph">↦</div>
                                </div>

                                {/* output editor */}
                                <div className="example-col example-output">
                                    <Editor
                                        value={ex.error ? `Error:\n${ex.error}` : ex.output}
                                        onValueChange={() => {
                                        }}
                                        highlight={highlight}
                                        padding={16}
                                        readOnly
                                        className="container__editor editor readonly"
                                        preClassName={`language-${lang} no-wrap`}
                                        textareaClassName="no-wrap"
                                        style={{
                                            fontFamily: '"Fira Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                            fontSize: 12,
                                            overflowX: 'auto',
                                        }}
                                    />
                                </div>
                            </section>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    )
}
