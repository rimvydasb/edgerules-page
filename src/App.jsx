import React, {useEffect, useMemo, useRef, useState} from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
// Using custom bright theme styles in src/styles.css

const initialCode = `// Welcome to EdgeRules Playground
// Edit the JavaScript below. Syntax highlighting is powered by Prism.

function greet(name) {
  return ` + "`Hello, ${name}!`" + `
}

console.log(greet('world'))
`;

export default function App() {
    const [code, setCode] = useState(initialCode)
    const [lang] = useState('javascript')
    const [wasmReady, setWasmReady] = useState(false)
    const [wasmError, setWasmError] = useState(null)
    const [wasmLogs, setWasmLogs] = useState([])
    const wasmRef = useRef(null)

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

    const runWasmDemo = async () => {
        if (!wasmRef.current) return
        const {evaluate_value, evaluate_field, to_trace} = wasmRef.current
        try {
            const logs = []
            logs.push({label: 'evaluate_value', value: await evaluate_value('{ value : 10 + 20 }')})
            logs.push({label: 'evaluate_field', value: await evaluate_field('{ total : sum([1,2,3]) }', 'total')})
            logs.push({label: 'to_trace', value: to_trace('{ a : 1; b : a + 2 }')})
            setWasmLogs(logs)
        } catch (e) {
            setWasmLogs([{label: 'error', value: e?.message || String(e)}])
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
                    <div className="container_editor_area">
                        <Editor
                            value={code}
                            onValueChange={setCode}
                            highlight={highlight}
                            padding={16}
                            textareaId="code-editor"
                            className="container__editor editor"
                            preClassName={`language-${lang}`}
                            style={{
                                fontFamily: '"Fira Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                fontSize: 12,
                            }}
                        />
                    </div>

                    <section className="output-wrap bright">
                        <h2>Output (static preview)</h2>
                        <pre className="output bright">
{code}
            </pre>
                    </section>

                    <section className="output-wrap bright">
                        <h2>WASM Demo</h2>
                        {!wasmReady && !wasmError && <p>Loading WebAssembly…</p>}
                        {wasmError && <p style={{color: '#b91c1c'}}>WASM load error: {wasmError}</p>}
                        {wasmReady && (
                            <div>
                                <button className="button" onClick={runWasmDemo}>Run Demo</button>
                                {wasmLogs.map((l, i) => (
                                    <pre className="output bright" key={i}>{`${l.label}:
${l.value}`}</pre>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <footer className="footer bright">
                <span>Ready for EdgeRules examples next.</span>
            </footer>
        </div>
    )
}
