import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Стандартный порт Vite
    host: true, // Разрешает доступ по локальной сети (удобно для тестов с телефона)
  }
})