// Backtests every `edgerules` example in public/docs/*.md that has an `**output:**` JSON block against the
// EdgeRules engine from npm (`@edgerules/node`, API-identical to `@edgerules/web`), with highs-js as solver.
// Run: npm run check:docs
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import highsLoader from 'highs'
import { DecisionService, mapHighsSolution, toCplexLp, type HighsSolutionLike } from '@edgerules/node'
import { parseBaseExamplesMarkdown } from '../src/utils/parseBaseExamples.ts'
import { evaluateSource } from '../src/utils/evaluate.ts'

const docsDir = path.resolve(import.meta.dirname, '../public/docs')
const highs = await highsLoader()

const createService = (code: string) => {
    const service = DecisionService.fromCode(code)
    service.registerSolver((problem) => {
        const options = problem.timeLimit === undefined ? {} : { time_limit: problem.timeLimit / 1000 }
        return mapHighsSolution(highs.solve(toCplexLp(problem), options) as unknown as HighsSolutionLike, problem)
    }, { name: 'highs-js' })
    return service
}

let passed = 0
let failed = 0
let unchecked = 0
for (const file of readdirSync(docsDir).filter((name) => name.endsWith('.md')).sort()) {
    const blocks = parseBaseExamplesMarkdown(readFileSync(path.join(docsDir, file), 'utf8'))
    for (const block of blocks) {
        if (block.codeExample.trim() === '') continue
        const selector = block.outputSelector
        const label = `${file} › ${block.sectionTitle ?? block.pageTitle ?? '(untitled)'}${selector ? ` (${selector})` : ''}`
        const evaluated = await evaluateSource(createService, block.codeExample)
        const { isError } = evaluated
        const value = selector !== null && !isError
            ? (evaluated.value as Record<string, unknown>)[selector]
            : evaluated.value
        const expectedText = block.getOutput().trim()
        if (expectedText === '') {
            if (isError) {
                failed += 1
                console.log(`FAIL  ${label}\n      error: ${JSON.stringify(value)}`)
            } else {
                unchecked += 1
            }
            continue
        }
        const expected: unknown = JSON.parse(expectedText)
        if (!isError && isDeepStrictEqual(value, expected)) {
            passed += 1
        } else {
            failed += 1
            console.log(`FAIL  ${label}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(value)}`)
        }
    }
}
console.log(`\n${passed} passed, ${failed} failed, ${unchecked} without documented output (executed without error)`)
process.exit(failed > 0 ? 1 : 0)
