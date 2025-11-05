import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Copy TinyMCE models and plugins to public directory
      'tinymce/models/dom': path.resolve(__dirname, 'node_modules/tinymce/models/dom'),
    }
  },
  optimizeDeps: {
    include: ['tinymce']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          tinymce: ['tinymce']
        }
      }
    }
  }
})
