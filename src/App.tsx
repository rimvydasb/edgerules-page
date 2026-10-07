import React, {useEffect, useMemo, useRef, useState} from 'react'
import ReactSimpleCodeEditor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import LZString from 'lz-string'
// Using custom bright theme styles in src/styles.css
import Footer from './components/Footer'
import Description from './components/Description'
import Playground from './components/Playground'
import type {BaseExample, Example} from './examples/types'
import {fetchAndParseBaseExamples, fetchMarkdown, formatWasmResult, parseBaseExamplesMarkdown} from './utils/parseBaseExamples'
import {evaluateSource, type ServiceFactory} from './utils/evaluate'
import {loadEngine} from './utils/engine'
import {CONTENT_PAGES} from './content/pages'

// Some bundlers/dep-optimizers double-wrap this package's CJS default export
// (`{ __esModule: true, default: Component }`); normalize to the component.
const Editor = (ReactSimpleCodeEditor as unknown as { default?: typeof ReactSimpleCodeEditor }).default
    ?? ReactSimpleCodeEditor

export default function App() {
    const [lang] = useState<'javascript'>('javascript')
    const [wasmReady, setWasmReady] = useState(false)
    const [wasmError, setWasmError] = useState<string | null>(null)
    const wasmRef = useRef<ServiceFactory | null>(null)
    const playgroundRunRef = useRef(0)
    const [examples, setExamples] = useState<Example[]>([])
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [playgroundInput, setPlaygroundInput] = useState<string>('')
    const [initialPlaygroundCode, setInitialPlaygroundCode] = useState<string>('')
    const [playgroundOutput, setPlaygroundOutput] = useState<string>('')
    const [playgroundError, setPlaygroundError] = useState<string | null>(null)

    const activeItem = CONTENT_PAGES[activeIndex]
    const isPlayground = activeItem?.type === 'playground'

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const hParam = params.get('h')
        if (hParam) {
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(hParam)
                if (decompressed) {
                    setPlaygroundInput(decompressed)
                    setInitialPlaygroundCode(decompressed)
                    const playgroundIndex = CONTENT_PAGES.findIndex(p => p.type === 'playground')
                    if (playgroundIndex !== -1) {
                        setActiveIndex(playgroundIndex)
                    }
                }
            } catch (e) {
                console.error('Failed to decompress URL param', e)
            }
        }
    }, [])

    const highlight = useMemo<((codeStr: string) => string)>(() => (codeStr: string) => {
        try {
            const grammar = Prism.languages['javascript'] as Prism.Grammar
            return Prism.highlight(codeStr, grammar, 'javascript')
        } catch {
            return codeStr
        }
    }, [])

    // Initialize the EdgeRules WASM engine from the @edgerules/web package
    useEffect(() => {
        let cancelled = false
        loadEngine().then((factory) => {
            if (cancelled) return
            wasmRef.current = factory
            setWasmReady(true)
        }, (e: unknown) => {
            if (!cancelled) setWasmError((e as Error)?.message || String(e))
        })
        return () => {
            cancelled = true
        }
    }, [])

    const evaluateWithMod = async (
        factory: ServiceFactory,
        input: string,
    ): Promise<{ output: string, isError: boolean }> => {
        if (input.trim().length === 0) {
            return { output: '', isError: false }
        }
        const { value, isError } = await evaluateSource(factory, input)
        return { output: formatWasmResult(value), isError }
    }

    // Helper to compute outputs for current examples
    const computeOutputs = async (items: Example[]): Promise<Example[]> => {
        const factory = wasmRef.current
        if (!factory) return items

        return Promise.all(items.map(async (ex): Promise<Example> => {
            const { output, isError } = await evaluateWithMod(factory, ex.input)
            return { ...ex, output, isError }
        }))
    }

    // Applies evaluated outputs, skipping examples whose input changed while evaluation was running
    const applyOutputs = (evaluated: Example[]) => {
        setExamples(prev => prev.map((ex, idx) => {
            const next = evaluated[idx]
            return next && next.id === ex.id && next.input === ex.input
                ? { ...ex, output: next.output, isError: next.isError }
                : ex
        }))
    }

    // Load selected page markdown and seed examples; recompute when WASM ready
    useEffect(() => {
        let cancelled = false

        const loadPage = async (): Promise<void> => {
            const item = activeItem
            if (!item) return

            if (!('contentReference' in item)) {
                if (!cancelled) setExamples([])
                return
            }

            const ref = item.contentReference
            try {
                const seed: BaseExample[] = await fetchAndParseBaseExamples(ref)
                const ex: Example[] = seed.map((e: BaseExample): Example => ({
                    ...e,
                    input: e.codeExample,
                    output: '',
                    isError: false,
                }))
                if (cancelled) return
                setExamples(ex)
                const evaluated = await computeOutputs(ex)
                if (!cancelled) applyOutputs(evaluated)
            } catch {
                if (!cancelled) setExamples([])
            }
        }

        void loadPage()
        return () => {
            cancelled = true
        }
    }, [activeItem, wasmReady])

    const onChangeExample = (id: string, value: string) => {
        setExamples(prev => prev.map(ex => ex.id === id ? {...ex, input: value} : ex))
        const factory = wasmRef.current
        if (!factory) return

        void evaluateWithMod(factory, value).then(({ output, isError }) => {
            setExamples(prev => prev.map(ex => ex.id === id && ex.input === value ? { ...ex, output, isError } : ex))
        })
    }

    const evaluatePlaygroundInput = async (value: string) => {
        const factory = wasmRef.current
        if (!factory) return

        const run = ++playgroundRunRef.current
        const { output, isError } = await evaluateWithMod(factory, value)
        if (run !== playgroundRunRef.current) return
        setPlaygroundOutput(output)
        setPlaygroundError(isError ? output : null)
    }

    const onChangePlayground = (value: string) => {
        setPlaygroundInput(value)
        void evaluatePlaygroundInput(value)
    }

    useEffect(() => {
        if (!isPlayground) return

        // If we already have content (from URL or previous edit), don't overwrite with default
        if (playgroundInput.trim().length > 0 || initialPlaygroundCode.length > 0) return

        let cancelled = false

        const loadPlayground = async () => {
            try {
                const markdown = await fetchMarkdown('docs/PLAYGROUND.md')
                if (cancelled) return
                const blocks = parseBaseExamplesMarkdown(markdown)
                const firstBlock = blocks.find((block) => block.codeExample.trim().length > 0)
                if (!firstBlock) {
                    throw new Error('Playground example missing in PLAYGROUND.md')
                }
                const nextValue = firstBlock.codeExample
                setPlaygroundInput(nextValue)
                setInitialPlaygroundCode(nextValue)
                setPlaygroundOutput('')
                if (nextValue.trim() === '') {
                    setPlaygroundError(null)
                    return
                }

                setPlaygroundError(null)
                await evaluatePlaygroundInput(nextValue)
            } catch (err) {
                if (cancelled) return
                const message = (err as Error)?.message ?? String(err)
                setPlaygroundInput('')
                setPlaygroundOutput('')
                setPlaygroundError(message)
            }
        }

        loadPlayground().catch((err: unknown) => {
            if (cancelled) return
            const message = (err as Error)?.message ?? String(err)
            setPlaygroundError(message)
        })

        return () => {
            cancelled = true
        }
    }, [isPlayground, activeItem])

    useEffect(() => {
        if (!isPlayground || !wasmReady) return
        void evaluatePlaygroundInput(playgroundInput)
    }, [isPlayground, wasmReady])

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
                                    className={`header__menu-btn${item.type === 'playground' ? ' header__menu-btn--playground' : ''}`}
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
                {isPlayground && (
                    <div className="playground">
                        <Playground
                            value={playgroundInput}
                            onChange={onChangePlayground}
                            onReset={() => onChangePlayground(initialPlaygroundCode)}
                            output={playgroundOutput}
                            error={playgroundError}
                            wasmReady={wasmReady}
                            wasmError={wasmError}
                        />
                    </div>
                )}
                {!isPlayground && (
                    <div className="container__content">
                        {!wasmReady && !wasmError && <p>Loading WebAssembly…</p>}
                        {wasmError && <p style={{color: '#b91c1c'}}>WASM load error: {wasmError}</p>}
                        {examples.map(ex => {
                            const hasCode = ex.codeExample.trim().length > 0
                            return (
                                <React.Fragment key={ex.id}>
                                    <div className="example-row-header">
                                        <h3 className="example-title"># {ex.title}</h3>
                                    </div>

                                    <section className={`example-row${hasCode ? '' : ' example-row--text-only'}`}>
                                        <Description text={ex.description} id={ex.id}/>

                                        {hasCode && (
                                            <>
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

                                                <div className="example-col example-arrow" aria-hidden="true">
                                                    <div className="arrow-glyph">↦</div>
                                                </div>

                                                <div className="example-col example-output">
                                                    <Editor
                                                        value={ex.output}
                                                        onValueChange={() => {}}
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
                                            </>
                                        )}
                                    </section>
                                </React.Fragment>
                            )
                        })}
                    </div>

                )}
            </div>
            <Footer/>
        </div>
    )
}
