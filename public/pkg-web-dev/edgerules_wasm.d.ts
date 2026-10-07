/* tslint:disable */
/* eslint-disable */

/**
 * JavaScript-facing decision service.
 */
export class DecisionServiceWASM {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Executes a function defined in the model, or evaluates a field by path.
     *
     * - `method`: The name or dot-separated path of the field to evaluate. Use `"*"` to
     *   evaluate the entire model and return the whole context.
     * - `args`: (Optional) JSON-encoded request bindings (an object mapping external input
     *   names to values), made available to the model during evaluation. Pass `None` or
     *   `"{}"` if the model has no external inputs.
     *
     * Returns a JSON-encoded string: the whole context when `method` is `"*"`, or the value
     * at `method`'s path otherwise.
     */
    execute(method: string, args?: string | null): string;
    /**
     * Constructs a service from EdgeRules DSL source text.
     */
    static from_code(code: string): DecisionServiceWASM;
    /**
     * Constructs a service from a Portable JSON string.
     */
    static from_portable(json: string): DecisionServiceWASM;
    /**
     * Serializes the current model to Portable JSON.
     */
    to_portable(): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_decisionservicewasm_free: (a: number, b: number) => void;
    readonly decisionservicewasm_execute: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly decisionservicewasm_from_code: (a: number, b: number, c: number) => void;
    readonly decisionservicewasm_from_portable: (a: number, b: number, c: number) => void;
    readonly decisionservicewasm_to_portable: (a: number, b: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
