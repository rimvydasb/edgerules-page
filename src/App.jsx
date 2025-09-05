import React, {useEffect, useMemo, useRef, useState} from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
// Using custom bright theme styles in src/styles.css

const EXAMPLES = [
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
    const [lang] = useState('javascript')
    const [wasmReady, setWasmReady] = useState(false)
    const [wasmError, setWasmError] = useState(null)
    const wasmRef = useRef(null)
    const [examples, setExamples] = useState(
      EXAMPLES.map(e => ({ ...e, input: e.initial, output: '', error: null }))
    )

    const highlight = useMemo(() => (codeStr) => {
        try {
            return Prism.highlight(codeStr, Prism.languages[lang], lang)
        } catch (e) {
            return codeStr
        }
    }, [lang])

    // Access WASM module exposed via index.html module script as window.__edgeRules
    useEffect(() => {
        let cancelled = false

        const attach = async (mod) => {
            const ok = await mod.ready
            if (!ok) throw new Error('EdgeRules WASM failed to initialize')
            if (!cancelled) {
                wasmRef.current = mod
                setWasmReady(true)
            }
        }

        const onReady = () => {
            if (!cancelled && window.__edgeRules) {
                attach(window.__edgeRules).catch(e => setWasmError(e?.message || String(e)))
            }
        }
        const onError = (e) => {
            if (!cancelled) setWasmError(e?.detail?.error?.message || 'WASM loader error')
        }

        if (window.__edgeRules) {
            attach(window.__edgeRules).catch(e => setWasmError(e?.message || String(e)))
        } else {
            window.addEventListener('edgerules-ready', onReady, { once: true })
            window.addEventListener('edgerules-error', onError, { once: true })
        }

        return () => {
            cancelled = true
            window.removeEventListener('edgerules-ready', onReady)
            window.removeEventListener('edgerules-error', onError)
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
                return { ...ex, output: '', error: err?.message || String(err) }
            }
        }))
    }, [wasmReady])

    const onChangeExample = (id, value) => {
        setExamples(prev => prev.map(ex => ex.id === id ? { ...ex, input: value } : ex))
        if (wasmRef.current) {
            try {
                const out = wasmRef.current.to_trace(value)
                setExamples(prev => prev.map(ex => ex.id === id ? { ...ex, output: out, error: null } : ex))
            } catch (err) {
                setExamples(prev => prev.map(ex => ex.id === id ? { ...ex, output: '', error: err?.message || String(err) } : ex))
            }
        }
    }

    return (
        <div className="page bright">
            <header className="header bright">
                <h1>EdgeRules Playground</h1>
                <p>Minimal Vite + React page using react-simple-code-editor</p>
            </header>

            <div className="container">
                <div className="container__content">
                    {!wasmReady && !wasmError && <p>Loading WebAssembly…</p>}
                    {wasmError && <p style={{color: '#b91c1c'}}>WASM load error: {wasmError}</p>}

                    {examples.map(ex => (
                      <section key={ex.id} className="example-row">
                        <div className="example-col example-output">
                          <h3 className="example-title">{ex.title}</h3>
                          <p className="example-desc">{ex.description}</p>
                          <pre className="output bright">{ex.error ? `Error:\n${ex.error}` : ex.output}</pre>
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
                      </section>
                    ))}
                </div>
            </div>

            <footer className="footer bright">
                <span>Ready for EdgeRules examples next.</span>
            </footer>
        </div>
    )
}
