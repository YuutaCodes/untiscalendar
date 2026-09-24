import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/schoolyears": "http://localhost:3000",
      "/classes": "http://localhost:3000",
      "/subjects": "http://localhost:3000",
      "/lessons": "http://localhost:3000",
      "/calendar": "http://localhost:3000",
    },
  },
})
