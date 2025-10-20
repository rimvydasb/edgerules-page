import React from 'react'

interface DescriptionProps {
    text: string
    id: string
}

const mapBoldSegments = (text: string, keyPrefix: string): React.ReactNode[] => {
    if (!text.includes('**')) return [text]
    const parts = text.split('**')
    return parts.map((part, idx) => (
        idx % 2 === 1
            ? <strong key={`${keyPrefix}-strong-${idx}`}>{part}</strong>
            : part
    ))
}

const renderDescriptionContent = (desc: string, keyPrefix: string): React.ReactNode[] => {
    if (!desc) return []
    const result: React.ReactNode[] = []
    const paragraphs = desc.split(/\n\n+/)

    paragraphs.forEach((paragraph, paragraphIdx) => {
        const lines = paragraph.split(/\n+/)
        lines.forEach((line, lineIdx) => {
            const trimmed = line.trim()
            if (!trimmed) return
            const nodes = mapBoldSegments(trimmed, `${keyPrefix}-${paragraphIdx}-${lineIdx}`)
            nodes.forEach((node) => {
                result.push(node)
            })
            if (lineIdx < lines.length - 1) {
                result.push(<br key={`${keyPrefix}-linebr-${paragraphIdx}-${lineIdx}`} />)
            }
        })

        if (paragraphIdx < paragraphs.length - 1) {
            result.push(<br key={`${keyPrefix}-para-${paragraphIdx}-a`} />)
            result.push(<br key={`${keyPrefix}-para-${paragraphIdx}-b`} />)
        }
    })

    return result
}

export default function Description({ text, id }: DescriptionProps) {
    return (
        <div className="example-col example-output top-row">
            <p className="example-desc">
                {renderDescriptionContent(text, id)}
            </p>
        </div>
    )
}
