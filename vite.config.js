import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'

// Update base if your repo name differs
export default defineConfig({
    plugins: [react()],
    base: '/edgerules-page/'
})

