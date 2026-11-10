import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { createAppRouter } from './router'
import './index.css'

// 在 React 渲染之外创建，避免 StrictMode / Suspense 重试产生废弃的路由实例。
const router = createAppRouter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialRouter={router} />
  </StrictMode>
)
