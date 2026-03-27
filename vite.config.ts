import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileStructurePlugin } from './src/plugins/file-structure'

interface OutputChunkInfo {
  facadeModuleId?: string | null
}

interface OutputAssetInfo {
  name?: string
  originalFileName?: string | null
}

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
    build: {
      chunkSizeWarningLimit: 1024, // 将警告体积变成1MB
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lodash')) {
                // lodash 单独打包
                return 'lodash'
              }
              if (id.includes('axios')) {
                // axios 单独打包
                return 'axios'
              }
              if (id.includes('antd')) {
                // antd 单独拆分
                return 'antd'
              }
              if (id.includes('@ant-design/icons')) {
                // 单独拆分 antd icons
                return 'ant-icons'
              }
              if (id.includes('@icon-park/react')) {
                // 单独拆分 icon-park
                return 'icon-park'
              }
              if (id.includes('gpt3-tokenizer') || id.includes('gpt-tokenizer')) {
                // tokenizer 单独打包
                return 'tokenizer'
              }
              if (id.includes('katex')) {
                // katex 单独打包
                return 'katex'
              }
              if (id.includes('highlight')) {
                // highlight 单独打包
                return 'highlight'
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                // react 核心包 单独打包
                return 'react-vendor'
              }
              if (id.includes('zustand')) {
                // zustand 核心包 单独打包
                return 'zustand'
              }
              return 'vendor' // 其他外部依赖库放在 vendor.js 里
            }
          },
          // 入口文件输出配置
          entryFileNames: `assets/js/[name]-[format]-[hash].js`,
          // 代码引入文件输出配置
          chunkFileNames(chunkInfo: OutputChunkInfo) {
            const facadeModuleId = chunkInfo.facadeModuleId
            if (facadeModuleId) {
              const facadeModuleIds = facadeModuleId.split('/')
              const parentname = facadeModuleIds[facadeModuleIds.length - 2]
              return `assets/js/${parentname}-[name]-[hash].js`
            }
            return `assets/js/[name]-[hash].js`
          },
          // 静态资源输出配置
          assetFileNames(assetInfo: OutputAssetInfo) {
            const name = assetInfo.name || ''
            const originalFileName = assetInfo.originalFileName || ''
            const imgSuffixs = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
            if (originalFileName) {
              const originalFileNames = originalFileName.split('/')
              const parentname = originalFileNames[originalFileNames.length - 2]
              // css文件单独输出到css文件夹
              if (name?.endsWith('.css')) {
                return `assets/css/${parentname ? parentname + '-' : ''}[name]-[hash].css`
              }
              // 图片文件单独输出到img文件夹
              else if (imgSuffixs.some((ext) => name?.endsWith(ext))) {
                return `assets/img/${parentname ? parentname + '-' : ''}[name]-[hash].[ext]`
              }
              // 其他资源输出到assets/other文件夹
              else {
                return `assets/other/${parentname ? parentname + '-' : ''}[name]-[hash].[ext]`
              }
            } else {
              // css文件单独输出到css文件夹
              if (name?.endsWith('.css')) {
                return `assets/css/[name]-[hash].css`
              }
              // 图片文件单独输出到img文件夹
              else if (imgSuffixs.some((ext) => name?.endsWith(ext))) {
                return `assets/img/[name]-[hash].[ext]`
              }
              // 其他资源输出到assets文件夹
              else {
                return `assets/other/[name]-[hash].[ext]`
              }
            }
          },
        },
      },
    },
    plugins: [react(), tailwindcss(), fileStructurePlugin()],
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
