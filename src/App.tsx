import React, { useEffect, useMemo, useRef, useState } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
// Using custom bright theme styles in src/styles.css

type BaseExample = {
  id: string
  title: string
  description: string
  initial: string
}

type Example = BaseExample & {
  input: string
  output: string
  error: string | null
}

const EXAMPLES: BaseExample[] = [
    {
        id: 'ex1',
        title: 'Example 1',
        description: 'Basic arithmetic',
        initial: '{ value : 10 + 20 }'
    },
    {
        id: 'ex2',
        title: 'Example 2',
        description: 'Aggregate sum',
        initial: '{ total : sum([1,2,3]) }'
    },
    {
        id: 'ex3',
        title: 'Example 3',
        description: 'Refs and expressions',
        initial: '{ a : 1; b : a + 2 }'
    }
]

export default function App() {
    const [lang] = useState<'javascript'>('javascript')
    const [wasmReady, setWasmReady] = useState(false)
    const [wasmError, setWasmError] = useState<string | null>(null)
    const wasmRef = useRef<EdgeRulesMod | null>(null)
    const [examples, setExamples] = useState<Example[]>(
        EXAMPLES.map((e): Example => ({ ...e, input: e.initial, output: '', error: null }))
    )

    const highlight = useMemo<((codeStr: string) => string)>(() => (codeStr: string) => {
        try {
            // Use explicit language name with safe grammar access
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
            window.addEventListener('edgerules-ready', onReady as EventListener, { once: true })
            window.addEventListener('edgerules-error', onError as EventListener, { once: true })
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
        const { to_trace } = wasmRef.current
        setExamples(prev => prev.map(ex => {
            try {
                const out = to_trace(ex.input)
                return { ...ex, output: out, error: null }
            } catch (err) {
                return { ...ex, output: '', error: (err as Error)?.message || String(err) }
            }
        }))
    }, [wasmReady])

    const onChangeExample = (id: string, value: string) => {
        setExamples(prev => prev.map(ex => ex.id === id ? { ...ex, input: value } : ex))
        if (wasmRef.current) {
            try {
                const out = wasmRef.current.to_trace(value)
                setExamples(prev => prev.map(ex => ex.id === id ? { ...ex, output: out, error: null } : ex))
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
                        <>
                            <div className="example-row-header">
                                <h3 className="example-title"># {ex.title}</h3>
                            </div>
                            <section key={ex.id} className="example-row">
                                <div className="example-col example-output">
                                    <p className="example-desc">{ex.description}</p>
                                </div>
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
                                <div className="example-col example-output">
                                    <Editor
                                        value={ex.error ? `Error:\n${ex.error}` : ex.output}
                                        onValueChange={() => {}}
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
                        </>
                    ))}
                </div>
            </div>

            <footer className="footer">
                <div className="footer__inner">
                    <div className="footer__grid">
                        <div className="footer__col">
                            <div className="footer__title">About</div>
                            <ul className="footer__list">
                                <li>
                                    <a className="footer__link" href="https://rimvydasb.github.io/edgerules-page/" target="_blank" rel="noopener noreferrer">GitHub Pages</a>
                                </li>
                                <li>
                                    <a className="footer__link" href="https://github.com/rimvydasb/edgerules-page/issues" target="_blank" rel="noopener noreferrer">Support & feedback</a>
                                </li>
                            </ul>
                        </div>
                        <div className="footer__col">
                            <div className="footer__title">Community</div>
                            <ul className="footer__list">
                                <li>
                                    <a className="footer__link" href="https://github.com/rimvydasb" target="_blank" rel="noopener noreferrer">GitHub Profile</a>
                                </li>
                                <li>
                                    <a className="footer__link" href="https://github.com/rimvydasb/edgerules-page" target="_blank" rel="noopener noreferrer">Repository</a>
                                </li>
                            </ul>
                        </div>
                        <div className="footer__col">
                            <div className="footer__title">Project</div>
                            <ul className="footer__list">
                                <li>
                                    <a className="footer__link" href="https://github.com/rimvydasb/edgerules-page/blob/main/README.md" target="_blank" rel="noopener noreferrer">README</a>
                                </li>
                                <li>
                                    <a className="footer__link" href="https://github.com/rimvydasb/edgerules-page/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">License</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer__bottom">
                        <div>Interactive examples powered by EdgeRules WASM.</div>
                        <div className="footer__copyright">© {new Date().getFullYear()} edgerules-page</div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
