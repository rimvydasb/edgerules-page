// Public loader for EdgeRules WASM (runs as a module script)
// Accepts optional query params on its own URL for cache busting:
//   loader.js?js=<token>&wasm=<token>
// It initializes the WASM glue and exposes window.__edgeRules.

(async () => {
    try {
        const selfUrl = new URL(import.meta.url);
        const jsBust = selfUrl.searchParams.get('js') || '';
        const wasmBust = selfUrl.searchParams.get('wasm') || '';

        const mod = await import(`./edge_rules.js${jsBust ? `?v=${jsBust}` : ''}`);
        const init = mod?.default;
        if (typeof init !== 'function') throw new Error('edge_rules init not found');

        const wasmUrl = new URL(`edge_rules_bg.wasm${wasmBust ? `?v=${wasmBust}` : ''}`, import.meta.url);
        await init(wasmUrl);
        try { mod.init_panic_hook?.(); } catch {}

        const api = {
            ready: Promise.resolve(true),
            evaluate_all: (input) => mod.evaluate_all(input),
            evaluate_expression: (input) => mod.evaluate_expression(input)
        };

        window.__edgeRules = api;
        window.dispatchEvent(new CustomEvent('edgerules-ready'));
    } catch (error) {
        console.error('EdgeRules loader error', error);
        window.dispatchEvent(new CustomEvent('edgerules-error', { detail: { error } }));
    }
})();
