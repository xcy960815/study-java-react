import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { startTokenKeepAlive } from './utils/token-keepalive'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

// 应用启动即挂载 Token 保活定时器（未登录时空转，登录后自动生效）
startTokenKeepAlive()
