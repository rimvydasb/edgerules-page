import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'

// Update base if your repo name differs
export default defineConfig({
    plugins: [react()],
    base: '/edgerules-page/',
    // Pre-bundling would move the packages' JS away from their .wasm files (resolved via import.meta.url)
    optimizeDeps: {
        exclude: ['@edgerules/web', 'highs'],
    },
})
