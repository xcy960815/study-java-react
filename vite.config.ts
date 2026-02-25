import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const {
    VITE_PORT,
    VITE_BASE_URL,
    VITE_API_DOMAIN_PREFIX,
    VITE_API_SERVER_DOMAIN,
    VITE_API_SERVER_DOMAIN_PREFIX,
  } = loadEnv(mode, './env/')

  const VITE_API_DOMAIN_PREFIX_REG = new RegExp(`^${VITE_API_DOMAIN_PREFIX}`)

  return {
    base: VITE_BASE_URL,
    envDir: 'env',
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: parseInt(VITE_PORT),
      proxy: {
        [VITE_API_DOMAIN_PREFIX]: {
          target: VITE_API_SERVER_DOMAIN,
          changeOrigin: true,
          ws: true,
          // 该配置会将真实的代理地址显示在 network 自定义请求头中
          bypass(req, res, options) {
            const proxyURL =
              new URL(options.rewrite!(req.url || '') || '', options.target as string)?.href || ''
            if (res) {
              res.setHeader('x-req-proxyURL', proxyURL) // 将真实请求地址设置到响应头中
            }
          },
          rewrite: (path) =>
            path.replace(VITE_API_DOMAIN_PREFIX_REG, VITE_API_SERVER_DOMAIN_PREFIX),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
