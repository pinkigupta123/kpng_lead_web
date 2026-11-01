import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://localhost:8000'
  const prefix = env.VITE_PROXY_PREFIX ?? ''
  return {
    plugins: [react()],
    server: {
      proxy: {
        // /api/* -> <target><prefix>/api/*   (live server needs the "/index.php" prefix, a local `artisan serve` does not)
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (p) => prefix + p,
        },
      },
    },
  }
})
