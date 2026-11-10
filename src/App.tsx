import { Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Alert, Button } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { createAppRouter, setCurrentRouter } from '@/router'
import { ensureDynamicRoutes, resetDynamicRoutes } from '@/router/ensure-dynamic-routes'
import { eventEmitter } from '@/utils/event-emits'
import { getToken } from '@/utils/token'
import type { AppRouter } from '@/router/instance'
import { RouteLoading } from '@/router/route-helpers'
import { useLoginStore, useSystemStore } from '@/store'

/**
 * 根组件：持有可重建的 router，并在登录后 / 已有 token 时主动注册动态路由。
 * 登出或 token 失效时重置状态并重建路由表，保证下次能再次 ensure。
 */
const App = ({ initialRouter }: { initialRouter: AppRouter }) => {
  const [{ router, version }, setSession] = useState({ router: initialRouter, version: 0 })
  const [failedRouter, setFailedRouter] = useState<AppRouter | null>(null)
  const hasAddedRoutes = useSystemStore((state) => state.hasAddedRoutes)
  const ensureRoutes = useCallback(() => {
    void ensureDynamicRoutes({ router }).catch(() => setFailedRouter(router))
  }, [router])

  // 单例只用于外部观察；所有注册都显式传入 Provider 持有的实例。
  useLayoutEffect(() => {
    setCurrentRouter(router)
  }, [router])

  useEffect(() => {
    if (getToken()) {
      ensureRoutes()
    }

    let sessionEnded = false
    const handleSessionEnded = () => {
      if (sessionEnded) return
      sessionEnded = true
      setFailedRouter(null)
      router.dispose()
      resetDynamicRoutes()
      useLoginStore.getState().resetUser()
      const next = createAppRouter()
      void next.navigate('/login', { replace: true })
      setSession((current) => ({ router: next, version: current.version + 1 }))
    }

    eventEmitter.on('login', ensureRoutes)
    eventEmitter.on('logout', handleSessionEnded)
    eventEmitter.on('token-invalid', handleSessionEnded)

    return () => {
      eventEmitter.off('login', ensureRoutes)
      eventEmitter.off('logout', handleSessionEnded)
      eventEmitter.off('token-invalid', handleSessionEnded)
    }
  }, [router, ensureRoutes])

  // RouterProvider 用 useState 保存首次 router.state，换实例必须一并重挂载。
  return (
    <>
      <Suspense fallback={<RouteLoading />}>
        <RouterProvider key={version} router={router} />
      </Suspense>
      {failedRouter === router && !hasAddedRoutes && !router.state.errors && getToken() && (
        <div className="fixed top-4 left-1/2 z-1000 -translate-x-1/2">
          <Alert
            type="error"
            showIcon
            title="菜单加载失败"
            action={
              <Button size="small" onClick={ensureRoutes}>
                重试
              </Button>
            }
          />
        </div>
      )}
    </>
  )
}

export default App
