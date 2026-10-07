/** Minimal structural view of an EdgeRules `DecisionService` (shared by `@edgerules/web` and `@edgerules/node`). */
export interface EdgeRulesService {
    execute(method: string, input?: Record<string, unknown>): Promise<unknown>
    [Symbol.dispose](): void
}

/** Creates a ready-to-execute service from EdgeRules source (solver registration is the factory's concern). */
export type ServiceFactory = (code: string) => EdgeRulesService | Promise<EdgeRulesService>

export interface EvaluationResult {
    value: unknown
    isError: boolean
}

/** True when the source is a full context model (`{ ... }`) rather than a bare expression. */
export function isContextSource(code: string): boolean {
    return code.trim().startsWith('{')
}

/**
 * Normalizes anything thrown by the engine into a displayable error object. `fromCode` throws plain
 * strings (parse errors); `execute` throws `PortableError` objects (`{ '@kind': 'error', type, message }`).
 */
export function toErrorValue(thrown: unknown): unknown {
    if (typeof thrown === 'object' && thrown !== null && !(thrown instanceof Error)) return thrown
    const message = thrown instanceof Error ? thrown.message : String(thrown)
    try {
        const parsed: unknown = JSON.parse(message)
        if (typeof parsed === 'object' && parsed !== null) return parsed
    } catch {
        // not JSON — fall through
    }
    return { '@kind': 'error', type: 'Parse', message }
}

/**
 * Evaluates EdgeRules source the same way the reference docs are backtested in the core repo: a context
 * model is executed as-is, while a bare expression is wrapped as `{ result: <expr> }` and only `result`
 * is returned.
 */
export async function evaluateSource(createService: ServiceFactory, source: string): Promise<EvaluationResult> {
    const isContext = isContextSource(source)
    const code = isContext ? source : `{\n    result: ${source}\n}`
    let service: EdgeRulesService | undefined
    try {
        service = await createService(code)
        const result = await service.execute('*')
        const value = isContext ? result : (result as Record<string, unknown> | null)?.['result']
        return { value, isError: false }
    } catch (err: unknown) {
        return { value: toErrorValue(err), isError: true }
    } finally {
        service?.[Symbol.dispose]()
    }
}
