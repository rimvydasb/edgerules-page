/* tslint:disable */
/* eslint-disable */
export function init_panic_hook(): void;
export class DecisionEngine {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  static evaluateAll(code: string): any;
  static evaluateField(code: string, field: string): any;
  static evaluateExpression(code: string): any;
}
export class DecisionService {
  free(): void;
  [Symbol.dispose](): void;
  get(path: string): any;
  constructor(model: any);
  set(path: string, object: any): any;
  remove(path: string): boolean;
  execute(method: string, request: any): any;
  getType(path: string): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_decisionengine_free: (a: number, b: number) => void;
  readonly __wbg_decisionservice_free: (a: number, b: number) => void;
  readonly decisionengine_evaluateAll: (a: number, b: number) => any;
  readonly decisionengine_evaluateExpression: (a: number, b: number) => any;
  readonly decisionengine_evaluateField: (a: number, b: number, c: number, d: number) => any;
  readonly decisionservice_execute: (a: number, b: number, c: number, d: any) => any;
  readonly decisionservice_get: (a: number, b: number, c: number) => any;
  readonly decisionservice_getType: (a: number, b: number, c: number) => any;
  readonly decisionservice_new: (a: any) => number;
  readonly decisionservice_remove: (a: number, b: number, c: number) => number;
  readonly decisionservice_set: (a: number, b: number, c: number, d: any) => any;
  readonly init_panic_hook: () => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_5: WebAssembly.Table;
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
