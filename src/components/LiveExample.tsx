import React, {useEffect, useRef, useState} from 'react'
import {Editor, EDITOR_STYLE, highlightCode} from './CodeEditor'
import {evaluateSource, type ServiceFactory} from '../utils/evaluate'
import {formatWasmResult} from '../utils/parseBaseExamples'

interface LiveExampleProps {
    /** Initial source; remount with a new `key` to load a different example. */
    code: string
    factory: ServiceFactory | null
    id: string
}

/** Editable EdgeRules source (left) evaluated live into read-only output (right). */
export default function LiveExample({code, factory, id}: LiveExampleProps) {
    const [input, setInput] = useState<string>(code)
    const [output, setOutput] = useState<string>('')
    const [isError, setIsError] = useState<boolean>(false)
    const runRef = useRef(0)

    useEffect(() => {
        if (!factory) return
        const run = ++runRef.current
        if (input.trim().length === 0) {
            setOutput('')
            setIsError(false)
            return
        }
        void evaluateSource(factory, input).then(({value, isError: failed}) => {
            if (run !== runRef.current) return
            setOutput(formatWasmResult(value))
            setIsError(failed)
        })
    }, [factory, input])

    return (
        <div className="live-example">
            <div className="live-example__pane live-example__pane--input">
                <div className="live-example__label">EdgeRules · editable</div>
                <Editor
                    value={input}
                    onValueChange={setInput}
                    highlight={highlightCode}
                    padding={16}
                    textareaId={`live-${id}`}
                    className="container__editor editor"
                    preClassName="language-javascript no-wrap"
                    textareaClassName="no-wrap"
                    style={EDITOR_STYLE}
                />
            </div>
            <div className="live-example__arrow" aria-hidden="true">↦</div>
            <div className="live-example__pane live-example__pane--output">
                <div className={`live-example__label${isError ? ' live-example__label--error' : ''}`}>
                    {factory ? (isError ? 'Error' : 'Result · JSON') : 'Loading engine…'}
                </div>
                <Editor
                    value={output}
                    onValueChange={() => {}}
                    highlight={highlightCode}
                    padding={16}
                    readOnly
                    className="container__editor editor readonly"
                    preClassName="language-javascript no-wrap"
                    textareaClassName="no-wrap"
                    style={EDITOR_STYLE}
                />
            </div>
        </div>
    )
}
