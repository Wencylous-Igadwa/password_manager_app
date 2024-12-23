import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
        '/account': 'http://localhost:3000',  // Proxy API calls to backend
    },
},
  plugins: [react()],
})
