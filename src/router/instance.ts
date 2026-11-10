import type { createBrowserRouter } from 'react-router-dom'

export type AppRouter = ReturnType<typeof createBrowserRouter>

// 由 App 绑定 Provider 的实际实例，仅用于观察；路由注册必须显式传入 router。
let currentRouter: AppRouter | null = null

export const getRouter = () => {
  if (!currentRouter) {
    throw new Error('Router has not been created yet')
  }
  return currentRouter
}

export const setCurrentRouter = (router: AppRouter) => {
  currentRouter = router
}
