import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@mediapipe') || id.includes('face-api')) return 'media'
          if (id.includes('livekit')) return 'livekit'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) return 'react'
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
