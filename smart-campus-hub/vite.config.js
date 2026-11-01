import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const webhook = env.VITE_N8N_COPILOT_WEBHOOK
  const proxy = {}

  if (webhook) {
    let destination
    try {
      destination = new URL(webhook)
    } catch {
      throw new Error('VITE_N8N_COPILOT_WEBHOOK must be a valid absolute URL.')
    }

    proxy['/api/campus-copilot'] = {
      target: destination.origin,
      changeOrigin: true,
      rewrite: () => `${destination.pathname}${destination.search}`
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy }
  }
})