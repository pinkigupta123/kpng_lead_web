import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://localhost:8000'
  return {
    plugins: [react()],
    server: {
      proxy: {
        // /api/* -> <target>/index.php/api/*
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (p) => '/index.php' + p,
        },
      },
    },
  }
})
