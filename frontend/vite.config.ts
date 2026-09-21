import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Keep the allow-list tight: scanners probe exposed Vite servers for
    // /proc/*/environ and similar paths (see CVE-2025-30208 / CVE-2025-31125).
    fs: {
      strict: true,
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.*', '/proc/**', '/sys/**'],
    },
    // Docker Desktop on Windows does not reliably emit native file events
    // through bind mounts — polling makes save → HMR work every time.
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/node_modules/**', '**/.git/**', '/proc/**', '/sys/**'],
    },
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://api:8080',
        changeOrigin: true,
      },
    },
  },
})
