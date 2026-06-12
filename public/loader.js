// Public loader for EdgeRules WASM (runs as a module script)
// Accepts optional query params on its own URL for cache busting:
//   loader.js?js=<token>&wasm=<token>
// It initializes the WASM glue and exposes window.__edgeRules.

(async () => {
    try {
        const selfUrl = new URL(import.meta.url);
        const jsBust = selfUrl.searchParams.get('js') || '';
        const wasmBust = selfUrl.searchParams.get('wasm') || '';

        const mod = await import(`./pkg-web/edge_rules.js${jsBust ? `?v=${jsBust}` : ''}`);
        const init = mod?.default;
        if (typeof init !== 'function') throw new Error('edge_rules init not found');

        const wasmUrl = new URL(`./pkg-web/edge_rules_bg.wasm${wasmBust ? `?v=${wasmBust}` : ''}`, import.meta.url);
        await init(wasmUrl);
        try { mod.init_panic_hook?.(); } catch {}

        const api = {
            ready: Promise.resolve(true),
            init_panic_hook: mod.init_panic_hook,
            DecisionEngine: mod.DecisionEngine
        };

        window.__edgeRules = api;
        window.dispatchEvent(new CustomEvent('edgerules-ready'));
    } catch (error) {
        console.error('EdgeRules loader error', error);
        window.dispatchEvent(new CustomEvent('edgerules-error', { detail: { error } }));
    }
})();
