import React, {useEffect, useMemo, useRef, useState} from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
// Using custom bright theme styles in src/styles.css
import Footer from './components/Footer'
import type { BaseExample, Example } from './examples/types'
import { BASE_EXAMPLES } from './examples'

export default function App() {
    const [lang] = useState<'javascript'>('javascript')
    const [wasmReady, setWasmReady] = useState(false)
    const [wasmError, setWasmError] = useState<string | null>(null)
    const wasmRef = useRef<EdgeRulesMod | null>(null)
    const [examples, setExamples] = useState<Example[]>(
        BASE_EXAMPLES.map((e): Example => ({...e, input: e.initial, output: '', error: null}))
    )

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

    // Recompute outputs when WASM becomes ready
    useEffect(() => {
        if (!wasmReady || !wasmRef.current) return
        const {to_trace} = wasmRef.current
        setExamples(prev => prev.map(ex => {
            try {
                const out = to_trace(ex.input)
                return {...ex, output: out, error: null}
            } catch (err) {
                return {...ex, output: '', error: (err as Error)?.message || String(err)}
            }
        }))
    }, [wasmReady])

    const onChangeExample = (id: string, value: string) => {
        setExamples(prev => prev.map(ex => ex.id === id ? {...ex, input: value} : ex))
        if (wasmRef.current) {
            try {
                const out = wasmRef.current.to_trace(value)
                setExamples(prev => prev.map(ex => ex.id === id ? {...ex, output: out, error: null} : ex))
            } catch (err) {
                setExamples(prev => prev.map(ex => ex.id === id ? {
                    ...ex,
                    output: '',
                    error: (err as Error)?.message || String(err)
                } : ex))
            }
        }
    }

    return (
        <div className="page bright">
            <header className="header bright">
                <h1>EdgeRules Language</h1>
                <p>Reference and Interactive Playground</p>
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
                                <div className="example-col example-output">
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
                                        preClassName={`language-${lang}`}
                                        style={{
                                            fontFamily: '"Fira Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                            fontSize: 12,
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
                                        preClassName={`language-${lang}`}
                                        style={{
                                            fontFamily: '"Fira Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                            fontSize: 12,
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
