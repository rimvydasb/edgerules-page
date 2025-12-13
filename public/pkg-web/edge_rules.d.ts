/* tslint:disable */
/* eslint-disable */
export function evaluate_expression(code: string): any;
export function set_to_decision_service_model(path: string, object: any): any;
export function execute_decision_service(service_method: string, decision_request: any): any;
export function create_decision_service(model: any): any;
export function evaluate_all(code: string): any;
export function get_from_decision_service_model(path: string): any;
export function set_invocation(path: string, invocation: any): any;
export function evaluate_method(code: string, method: string, args: any): any;
export function remove_from_decision_service_model(path: string): any;
export function init_panic_hook(): void;
export function evaluate_field(code: string, field: string): any;
export function get_decision_service_model(): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly create_decision_service: (a: any) => any;
  readonly evaluate_all: (a: number, b: number) => any;
  readonly evaluate_expression: (a: number, b: number) => any;
  readonly evaluate_field: (a: number, b: number, c: number, d: number) => any;
  readonly evaluate_method: (a: number, b: number, c: number, d: number, e: any) => any;
  readonly execute_decision_service: (a: number, b: number, c: any) => any;
  readonly get_decision_service_model: () => any;
  readonly get_from_decision_service_model: (a: number, b: number) => any;
  readonly init_panic_hook: () => void;
  readonly remove_from_decision_service_model: (a: number, b: number) => any;
  readonly set_invocation: (a: number, b: number, c: any) => any;
  readonly set_to_decision_service_model: (a: number, b: number, c: any) => any;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
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
