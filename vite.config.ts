// vite.config.ts
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

// Simular __dirname no ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // ✅ CONFIGURAÇÃO PARA BUILD ATUALIZADA
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      external: ['twilio', 'https', 'http', 'stream', 'util', 'events'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          qr: ['html5-qrcode']
        }
      }
    }
  },
  // ✅ NOVO: Configuração SSR para Twilio
  ssr: {
    noExternal: ['twilio'] // ✅ Permite Twilio apenas no SSR
  },
  // ✅ NOVO: Define variáveis globais para módulos Node.js
  define: {
    'process.env': {}, // ✅ Define process.env vazio no client
    global: 'globalThis',
  },
  // ✅ NOVO: Otimização de dependências
  optimizeDeps: {
    exclude: ['twilio'], // ✅ Exclui Twilio do bundling do client
    include: ['react', 'react-dom', 'react-router-dom']
  },
  // ✅ CONFIGURAÇÃO DO SERVIDOR (mantida)
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
  },
  // ✅ BASE PARA DEPLOY (mantida)
  base: './'
})
