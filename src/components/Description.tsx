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
            ? <strong key={`${keyPrefix}-strong-${idx}`}>{mapCodeSegments(part, `${keyPrefix}-strong-${idx}-code`)}</strong>
            : part
    ))
}

const mapCodeSegments = (text: string, keyPrefix: string): React.ReactNode[] => {
    if (!text.includes('`')) return [text]
    const parts = text.split('`')
    return parts.map((part, idx) => (
        idx % 2 === 1
            ? <code key={`${keyPrefix}-code-${idx}`}>{part}</code>
            : part
    ))
}

// Cross-document links point at other Markdown files, not pages of this app — keep the link text only
const stripLinks = (text: string): string => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

export const renderInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode[] => {
    const boldNodes = mapBoldSegments(stripLinks(text), keyPrefix)
    return boldNodes.flatMap((node, idx) => {
        if (typeof node === 'string') {
            return mapCodeSegments(node, `${keyPrefix}-s${idx}`)
        }
        return node
    })
}

const isTableRow = (line: string): boolean => line.startsWith('|')

const splitTableRow = (line: string): string[] => line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())

const isTableSeparator = (line: string): boolean => /^\|?(\s*:?-+:?\s*\|)*\s*:?-+:?\s*\|?$/.test(line)

const renderTable = (rows: string[], keyPrefix: string): React.ReactNode => {
    const hasHeader = rows.length > 1 && isTableSeparator(rows[1] ?? '')
    const header = hasHeader ? splitTableRow(rows[0] ?? '') : null
    const body = rows.slice(hasHeader ? 2 : 0).filter((row) => !isTableSeparator(row)).map(splitTableRow)

    return (
        <table className="example-desc__table" key={`${keyPrefix}-table`}>
            {header && (
                <thead>
                    <tr>
                        {header.map((cell, idx) => (
                            <th key={`${keyPrefix}-th-${idx}`}>{renderInlineMarkdown(cell, `${keyPrefix}-th-${idx}`)}</th>
                        ))}
                    </tr>
                </thead>
            )}
            <tbody>
                {body.map((cells, rowIdx) => (
                    <tr key={`${keyPrefix}-tr-${rowIdx}`}>
                        {cells.map((cell, cellIdx) => (
                            <td key={`${keyPrefix}-td-${rowIdx}-${cellIdx}`}>
                                {renderInlineMarkdown(cell, `${keyPrefix}-td-${rowIdx}-${cellIdx}`)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
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

        // Consecutive table rows are grouped into one table; other lines render as text lines
        const nodes: React.ReactNode[] = []
        let tableRows: string[] = []
        const flushTable = (idx: number): void => {
            if (tableRows.length === 0) return
            nodes.push(renderTable(tableRows, `${keyPrefix}-${paragraphIdx}-${idx}`))
            tableRows = []
        }
        lines.forEach((line, lineIdx) => {
            if (isTableRow(line)) {
                tableRows.push(line)
                return
            }
            flushTable(lineIdx)
            nodes.push(
                <span className="example-desc__line" key={`${keyPrefix}-line-${paragraphIdx}-${lineIdx}`}>
                    {renderInlineMarkdown(line, `${keyPrefix}-${paragraphIdx}-${lineIdx}`)}
                </span>
            )
        })
        flushTable(lines.length)

        return (
            <div className="example-desc__paragraph" key={`${keyPrefix}-paragraph-${paragraphIdx}`}>
                {nodes}
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
