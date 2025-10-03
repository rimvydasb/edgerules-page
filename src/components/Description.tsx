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

    paragraphs.forEach((paragraph, idx) => {
        const normalized = paragraph.replace(/\n+/g, ' ')
        const nodes = mapBoldSegments(normalized, `${keyPrefix}-${idx}`)
        nodes.forEach((node) => {
            result.push(node)
        })

        if (idx < paragraphs.length - 1) {
            result.push(<br key={`${keyPrefix}-br-${idx}-a`} />)
            result.push(<br key={`${keyPrefix}-br-${idx}-b`} />)
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
