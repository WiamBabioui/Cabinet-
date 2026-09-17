import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  resolve: {
    alias: {
      // Stub optional jsPDF dependencies (SVG/HTML-to-image features not used)
      'canvg':      path.resolve(__dirname, 'src/stubs/empty.js'),
      'html2canvas': path.resolve(__dirname, 'src/stubs/empty.js'),
      'dompurify':  path.resolve(__dirname, 'src/stubs/empty.js'),
    }
  },

})
