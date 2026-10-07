import React, {useEffect, useState} from 'react'
import Description, {renderInlineMarkdown} from './Description'
import LiveExample from './LiveExample'
import {highlightCode} from './CodeEditor'
import type {ServiceFactory} from '../utils/evaluate'
import {fetchAndParseBaseExamples} from '../utils/parseBaseExamples'
import type {BaseExample} from '../examples/types'
import {
    BUILTINS,
    DSL_EXAMPLES,
    DSL_INTRO,
    FEATURES,
    HERO_TEXT,
    HERO_TRAITS,
    PACKAGES,
    PORTABLE_EXAMPLE,
    PORTABLE_TEXT,
    QUICK_START,
} from '../content/frontPage'

interface FrontPageProps {
    factory: ServiceFactory | null
    wasmError: string | null
}

const GITHUB_URL = 'https://github.com/rimvydasb/edgerules'

function SectionHeading({kicker, title}: { kicker: string, title: string }) {
    return (
        <div className="fp-heading">
            <div className="fp-heading__kicker">{kicker}</div>
            <h2 className="fp-heading__title">{title}</h2>
        </div>
    )
}

function Tabs<T extends { id: string, tab: string }>(
    {items, activeId, onSelect, label}: { items: T[], activeId: string, onSelect: (id: string) => void, label: string },
) {
    return (
        <div className="fp-tabs" role="tablist" aria-label={label}>
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={item.id === activeId}
                    className={`fp-tabs__tab${item.id === activeId ? ' fp-tabs__tab--active' : ''}`}
                    onClick={() => onSelect(item.id)}
                >
                    {item.tab}
                </button>
            ))}
        </div>
    )
}

function StaticCode({code, className = ''}: { code: string, className?: string }) {
    return (
        <pre className={`fp-code ${className}`}>
            <code dangerouslySetInnerHTML={{__html: highlightCode(code)}}/>
        </pre>
    )
}

export default function FrontPage({factory, wasmError}: FrontPageProps) {
    const [intro, setIntro] = useState<BaseExample | null>(null)
    const [dslId, setDslId] = useState<string>(DSL_EXAMPLES[0]!.id)
    const [quickStartId, setQuickStartId] = useState<string>(QUICK_START[0]!.id)

    // The Introduction example is the first block of the Basics page — reuse it rather than duplicating it
    useEffect(() => {
        let cancelled = false
        fetchAndParseBaseExamples('docs/BASE_EXAMPLES.md').then((examples) => {
            const first = examples.find((ex) => ex.codeExample.trim().length > 0)
            if (!cancelled && first) setIntro(first)
        }, () => {})
        return () => {
            cancelled = true
        }
    }, [])

    const dsl = DSL_EXAMPLES.find((ex) => ex.id === dslId) ?? DSL_EXAMPLES[0]!
    const quickStart = QUICK_START.find((sample) => sample.id === quickStartId) ?? QUICK_START[0]!

    return (
        <div className="fp">
            <section className="fp-hero">
                <div className="fp-hero__badge">Rust · WebAssembly · Node.js · Browser</div>
                <h2 className="fp-hero__title">
                    Business rules as <span className="fp-accent">data</span>,
                    evaluated <span className="fp-accent">anywhere</span>.
                </h2>
                <p className="fp-hero__text">{HERO_TEXT}</p>
                <p className="fp-hero__traits">
                    Every model is{' '}
                    {HERO_TRAITS.map((trait, idx) => (
                        <React.Fragment key={trait}>
                            <span className="fp-trait">{trait}</span>
                            {idx < HERO_TRAITS.length - 2 ? ', ' : idx === HERO_TRAITS.length - 2 ? ' and ' : '.'}
                        </React.Fragment>
                    ))}
                </p>
                <div className="fp-hero__actions">
                    <a className="fp-btn fp-btn--primary" href="#playground">Open the Playground</a>
                    <a className="fp-btn" href="#basics">Learn the Basics</a>
                    <a className="fp-btn fp-btn--ghost" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                        GitHub ↗
                    </a>
                </div>
            </section>

            {wasmError && <p className="fp-error">WASM load error: {wasmError}</p>}

            <section className="fp-section">
                <SectionHeading kicker="# Introduction" title="See it in action"/>
                {intro ? (
                    <>
                        <Description text={intro.description} id="fp-intro"/>
                        <LiveExample code={intro.codeExample} factory={factory} id="intro"/>
                    </>
                ) : (
                    <p className="fp-muted">Loading example…</p>
                )}
            </section>

            <section className="fp-section">
                <SectionHeading kicker="# Why EdgeRules?" title="Small engine, serious guarantees"/>
                <div className="fp-features">
                    {FEATURES.map((feature) => (
                        <div className="fp-card" key={feature.title}>
                            <div className="fp-card__glyph" aria-hidden="true">{feature.glyph}</div>
                            <h3 className="fp-card__title">{feature.title}</h3>
                            <p className="fp-card__text">{feature.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="fp-section">
                <SectionHeading kicker="# The EdgeRules DSL" title="One language for decisions"/>
                <p className="fp-lead">{DSL_INTRO}</p>
                <Tabs items={DSL_EXAMPLES} activeId={dsl.id} onSelect={setDslId} label="DSL examples"/>
                <div className="fp-tab-panel">
                    <div className="fp-tab-panel__head">
                        <p className="fp-muted">{renderInlineMarkdown(dsl.text, `fp-dsl-${dsl.id}`)}</p>
                        <a className="fp-link" href={`#${dsl.reference.hash}`}>
                            # {dsl.reference.label} reference →
                        </a>
                    </div>
                    <LiveExample key={dsl.id} code={dsl.code} factory={factory} id={`dsl-${dsl.id}`}/>
                </div>
            </section>

            <section className="fp-section">
                <SectionHeading kicker="# Quick Start" title="Embed it in minutes"/>
                <div className="fp-packages">
                    {PACKAGES.map((pkg) => (
                        <a
                            className="fp-card fp-card--package"
                            key={pkg.name}
                            href={`https://www.npmjs.com/package/${pkg.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <code className="fp-card__pkg">{pkg.name}</code>
                            <p className="fp-card__text">{pkg.text}</p>
                        </a>
                    ))}
                </div>
                <Tabs items={QUICK_START} activeId={quickStart.id} onSelect={setQuickStartId} label="Quick start"/>
                <div className="fp-tab-panel">
                    {quickStart.install && (
                        <pre className="fp-code fp-code--shell"><code>$ {quickStart.install}</code></pre>
                    )}
                    <StaticCode code={quickStart.code}/>
                </div>
            </section>

            <section className="fp-section">
                <SectionHeading kicker="# Portable JSON Format" title="Your rules are just JSON"/>
                <div className="fp-split">
                    <div className="fp-split__text">
                        <p className="fp-lead">{PORTABLE_TEXT}</p>
                        <p className="fp-muted">
                            Use <code>service.get(path)</code> to read enriched nodes (with inferred types) and{' '}
                            <code>service.set(path, node)</code> to write them. See{' '}
                            <a
                                className="fp-link"
                                href={`${GITHUB_URL}/blob/main/doc/architecture/API_SPEC.md`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                API_SPEC.md ↗
                            </a>{' '}
                            for the full Portable Format reference.
                        </p>
                    </div>
                    <StaticCode code={PORTABLE_EXAMPLE} className="fp-split__code"/>
                </div>
            </section>

            <section className="fp-section">
                <SectionHeading kicker="# Built-in Function Library" title="Batteries included"/>
                <div className="fp-builtins">
                    {BUILTINS.map((group) => (
                        <a className="fp-builtins__row" key={group.category} href={`#${group.hash}`}>
                            <div className="fp-builtins__category">{group.category}</div>
                            <div className="fp-builtins__functions">
                                {group.functions.map((fn) => <code key={fn}>{fn}</code>)}
                                <span className="fp-muted">…</span>
                            </div>
                            <div className="fp-builtins__go" aria-hidden="true">→</div>
                        </a>
                    ))}
                </div>
            </section>

            <section className="fp-cta">
                <h2 className="fp-cta__title">Ready to write your first rule?</h2>
                <p className="fp-cta__text">The playground evaluates as you type and lets you share models as a link.</p>
                <a className="fp-btn fp-btn--primary" href="#playground">Open the Playground</a>
            </section>
        </div>
    )
}
