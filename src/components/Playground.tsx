import React, { useEffect, useMemo, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { highlightSpecialChars, drawSelection, highlightActiveLine, lineNumbers } from '@codemirror/view'
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import LZString from 'lz-string'
import IosShareIcon from '@mui/icons-material/IosShare'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { Snackbar, IconButton, Button, Tooltip } from '@mui/material'

interface PlaygroundProps {
    value: string;
    onChange: (value: string) => void;
    onReset: () => void;
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
        EditorView.lineWrapping,
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
        EditorView.lineWrapping,
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
    const normalized = trimmed.replace(/\r\n?/g, '\n')

    try {
        const parsed = JSON.parse(normalized)
        if (typeof parsed === 'string') {
            return parsed
        }
        return JSON.stringify(parsed, null, 2)
    } catch {
        try {
            if (normalized.startsWith('"') && normalized.endsWith('"')) {
                const unquoted = JSON.parse(normalized)
                if (typeof unquoted === 'string') {
                    return unquoted.replace(/\r\n?/g, '\n')
                }
            }
        } catch {
            // ignore, fall through to raw normalization
        }

        return normalized
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
    }
}

function buildOutputDoc(params: { wasmError: string | null; wasmReady: boolean; error: string | null; output: string }): string {
    const { wasmError, wasmReady, error, output } = params
    if (wasmError) return JSON.stringify({ error: wasmError }, null, 2)
    if (!wasmReady) return JSON.stringify({ status: 'loading' }, null, 2)
    if (error) return error
    return formatJsonLike(output)
}

export default function Playground({ value, onChange, onReset, output, error, wasmReady, wasmError }: PlaygroundProps) {
    const editorParentRef = useRef<HTMLDivElement | null>(null)
    const editorViewRef = useRef<EditorView | null>(null)
    const changeHandlerRef = useRef(onChange)

    const outputParentRef = useRef<HTMLDivElement | null>(null)
    const outputViewRef = useRef<EditorView | null>(null)

    const [snackbarOpen, setSnackbarOpen] = React.useState(false)

    const outputDoc = useMemo(() => buildOutputDoc({ wasmError, wasmReady, error, output }), [wasmError, wasmReady, error, output])

    const handleShare = () => {
        const compressed = LZString.compressToEncodedURIComponent(value);
        const url = new URL(window.location.href);
        url.searchParams.set('h', compressed);
        const urlStr = url.toString();

        window.history.replaceState(null, '', urlStr);
        navigator.clipboard.writeText(urlStr).then(() => {
            setSnackbarOpen(true)
        }, () => {
             // Fallback if clipboard fails
             window.prompt("Copy this URL to share:", urlStr);
        });
    };

    const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip title="Reset to initial state">
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RestartAltIcon />}
                            onClick={onReset}
                            sx={{
                                color: 'var(--text)',
                                borderColor: 'var(--border)',
                                '&:hover': {
                                    borderColor: 'var(--text)',
                                    backgroundColor: 'rgba(0,0,0,0.04)'
                                },
                                textTransform: 'none',
                                fontFamily: 'inherit'
                            }}
                        >
                            Reset
                        </Button>
                    </Tooltip>
                    <Tooltip title="Share current state">
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<IosShareIcon />}
                            onClick={handleShare}
                            sx={{
                                backgroundColor: '#111827',
                                '&:hover': {
                                    backgroundColor: '#1f2937'
                                },
                                textTransform: 'none',
                                fontFamily: 'inherit'
                            }}
                        >
                            Share
                        </Button>
                    </Tooltip>
                </div>
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
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                message="Link copied to clipboard"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </>
    )
}
