// Public loader to initialize EdgeRules WASM and expose it on window
// This runs as a native ESM module in the browser and is not processed by Vite.

import init, {
    evaluate_value,
    evaluate_field,
    to_trace
} from './edge_rules.js';

try {
    await init();
    window.__edgeRules = {
        init,
        evaluate_value,
        evaluate_field,
        to_trace,
        ready: Promise.resolve(true)
    };
    window.dispatchEvent(new CustomEvent('edgerules-ready', { detail: { ok: true } }));
} catch (e) {
    console.error('EdgeRules WASM init failed:', e);
    window.__edgeRules = {
        init,
        evaluate_value,
        evaluate_field,
        to_trace,
        ready: Promise.resolve(false),
        error: e
    };
    window.dispatchEvent(new CustomEvent('edgerules-error', { detail: { error: e } }));
}