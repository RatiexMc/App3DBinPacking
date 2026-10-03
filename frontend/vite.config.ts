import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
const apiDestino = process.env.DARNEL_API_TARGET || 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // El navegador usa el mismo origen para web y API: la cookie también funciona
  // al entrar desde otro dispositivo de la red usando la dirección de esta PC.
  server: { proxy: { '/api': { target: apiDestino, rewrite: path => path.replace(/^\/api/, '') } } },
  preview: { proxy: { '/api': { target: apiDestino, rewrite: path => path.replace(/^\/api/, '') } } },
})
