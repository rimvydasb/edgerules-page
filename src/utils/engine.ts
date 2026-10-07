import { DecisionService, init, mapHighsSolution, toCplexLp, type HighsSolutionLike } from '@edgerules/web'
import type { Highs } from 'highs'
import highsWasmUrl from 'highs/runtime?url'
import type { ServiceFactory } from './evaluate'

let highsPromise: Promise<Highs> | undefined

/** Loads highs-js on first use only — most pages never need an optimisation solver. */
function loadHighs(): Promise<Highs> {
    highsPromise ??= import('highs').then((mod) => mod.default({ locateFile: () => highsWasmUrl }))
    return highsPromise
}

/**
 * Initializes the EdgeRules WASM engine (`@edgerules/web`) and returns a factory creating services from source.
 * Models declaring an `optimise` element get highs-js registered as their solver.
 */
export async function loadEngine(): Promise<ServiceFactory> {
    await init()
    return async (code: string) => {
        const service = DecisionService.fromCode(code)
        try {
            if (service.requiresSolver()) {
                const highs = await loadHighs()
                service.registerSolver((problem) => {
                    const options = problem.timeLimit === undefined ? {} : { time_limit: problem.timeLimit / 1000 }
                    const solution = highs.solve(toCplexLp(problem), options) as unknown as HighsSolutionLike
                    return mapHighsSolution(solution, problem)
                }, { name: 'highs-js' })
            }
            return service
        } catch (err) {
            service[Symbol.dispose]()
            throw err
        }
    }
}
