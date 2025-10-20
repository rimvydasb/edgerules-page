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

    const paragraphs = desc.split(/\n\n+/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)

    return paragraphs.map((paragraph, paragraphIdx) => {
        const lines = paragraph.split(/\n+/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)

        return (
            <div className="example-desc__paragraph" key={`${keyPrefix}-paragraph-${paragraphIdx}`}>
                {lines.map((line, lineIdx) => (
                    <span className="example-desc__line" key={`${keyPrefix}-line-${paragraphIdx}-${lineIdx}`}>
                        {mapBoldSegments(line, `${keyPrefix}-${paragraphIdx}-${lineIdx}`)}
                    </span>
                ))}
            </div>
        )
    })
}

export default function Description({ text, id }: DescriptionProps) {
    return (
        <div className="example-col example-output top-row">
            <div className="example-desc">
                {renderDescriptionContent(text, id)}
            </div>
        </div>
    )
}
