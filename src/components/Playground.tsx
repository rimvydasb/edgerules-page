import React, { useEffect, useMemo, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { highlightSpecialChars, drawSelection, highlightActiveLine, lineNumbers } from '@codemirror/view'
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

interface PlaygroundProps {
    value: string;
    onChange: (value: string) => void;
    output: string;
    error: string | null;
    wasmReady: boolean;
    wasmError: string | null;
}

const tabBinding = indentWithTab

function createInputExtensions(onDocChange: (value: string) => void) {
    return [
        lineNumbers(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        highlightActiveLine(),
        javascript(),
        keymap.of([...defaultKeymap, tabBinding, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                onDocChange(update.state.doc.toString())
            }
        }),
    ]
}

function createOutputExtensions() {
    return [
        lineNumbers(),
        highlightSpecialChars(),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        highlightActiveLine(),
        json(),
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
    ]
}

function formatJsonLike(raw: string): string {
    const trimmed = raw.trim()
    if (!trimmed) return ''
    try {
        const parsed = JSON.parse(trimmed)
        return JSON.stringify(parsed, null, 2)
    } catch {
        return JSON.stringify(trimmed, null, 2)
    }
}

function buildOutputDoc(params: { wasmError: string | null; wasmReady: boolean; error: string | null; output: string }): string {
    const { wasmError, wasmReady, error, output } = params
    if (wasmError) return JSON.stringify({ error: wasmError }, null, 2)
    if (!wasmReady) return JSON.stringify({ status: 'loading' }, null, 2)
    if (error) return JSON.stringify({ error }, null, 2)
    return formatJsonLike(output)
}

export default function Playground({ value, onChange, output, error, wasmReady, wasmError }: PlaygroundProps) {
    const editorParentRef = useRef<HTMLDivElement | null>(null)
    const editorViewRef = useRef<EditorView | null>(null)
    const changeHandlerRef = useRef(onChange)

    const outputParentRef = useRef<HTMLDivElement | null>(null)
    const outputViewRef = useRef<EditorView | null>(null)

    const outputDoc = useMemo(() => buildOutputDoc({ wasmError, wasmReady, error, output }), [wasmError, wasmReady, error, output])

    useEffect(() => {
        changeHandlerRef.current = onChange
    }, [onChange])

    useEffect(() => {
        if (!editorParentRef.current) return

        const extensions = createInputExtensions((nextValue) => {
            changeHandlerRef.current(nextValue)
        })

        const state = EditorState.create({
            doc: value,
            extensions,
        })

        const view = new EditorView({ state, parent: editorParentRef.current })
        editorViewRef.current = view

        return () => {
            view.destroy()
            editorViewRef.current = null
        }
    }, [])

    useEffect(() => {
        const view = editorViewRef.current
        if (!view) return
        const doc = view.state.doc
        const currentValue = doc.toString()
        if (value === currentValue) return

        view.dispatch({
            changes: { from: 0, to: doc.length, insert: value },
        })
    }, [value])

    useEffect(() => {
        if (!outputParentRef.current) return

        const state = EditorState.create({
            doc: outputDoc,
            extensions: createOutputExtensions(),
        })

        const view = new EditorView({ state, parent: outputParentRef.current })
        outputViewRef.current = view

        return () => {
            view.destroy()
            outputViewRef.current = null
        }
    }, [])

    useEffect(() => {
        const view = outputViewRef.current
        if (!view) return
        const doc = view.state.doc
        const currentValue = doc.toString()
        if (outputDoc === currentValue) return

        view.dispatch({
            changes: { from: 0, to: doc.length, insert: outputDoc },
        })
    }, [outputDoc])

    return (
        <>
            <div className="example-row-header">
                <h3 className="example-title"># Playground</h3>
            </div>
            <section className="example-row playground-row">
                <div className="example-col example-editor playground-col playground-col-input">
                    <div className="container__editor editor playground-editor-shell">
                        <div ref={editorParentRef} className="playground-editor-view" />
                    </div>
                </div>

                <div className="example-col example-output playground-col playground-col-output">
                    <div className="container__editor editor readonly playground-output-shell">
                        <div ref={outputParentRef} className="playground-editor-view" aria-live="polite" />
                    </div>
                </div>
            </section>
        </>
    )
}
