import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase')) {
            return 'firebase';
          }
          if (id.includes('lucide-react')) {
            return 'ui-icons';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
