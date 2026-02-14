import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()], // z.B. /meine-app/
  base: '/vokabel-app/', 
})
