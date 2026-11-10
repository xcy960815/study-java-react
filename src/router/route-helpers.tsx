import type { ReactNode } from 'react'
import { Button, Result } from 'antd'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getToken } from '@/utils/token'

import { DEFAULT_AUTHED_PATH } from './constants'
import { RouteTabMetaSync } from './route-tab-sync'

interface RouteState {
  from?: string
}

/**
 * 路由树根组件：同步浏览器 Tab 元信息，并作为 Outlet 容器。
 * 登录态结束时的路由重置由 App 负责。
 */
export const RouteEventBridge = () => {
  return (
    <>
      <RouteTabMetaSync />
      <Outlet />
    </>
  )
}

/**
 * 保护需要登录的页面。
 * 未登录时会记录来源地址，并跳转到登录页。
 *
 * @param children 需要渲染的受保护内容
 */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const location = useLocation()

  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash } as RouteState}
      />
    )
  }

  return <>{children}</>
}

/**
 * 限制仅游客可访问的页面。
 * 已登录用户会直接回到系统首页。
 *
 * @param children 仅游客可见的页面内容
 */
export const GuestOnlyRoute = ({ children }: { children: ReactNode }) => {
  if (getToken()) {
    return <Navigate to={DEFAULT_AUTHED_PATH} replace />
  }

  return <>{children}</>
}

/**
 * 根据当前登录状态，将根路径重定向到登录页或系统首页。
 */
export const HomeRedirect = () => {
  return <Navigate to={getToken() ? DEFAULT_AUTHED_PATH : '/login'} replace />
}

export const RouteLoading = () => (
  <div role="status" className="flex h-screen items-center justify-center">
    正在加载页面...
  </div>
)

/** 菜单请求失败不能当成地址不存在；重试当前地址会重新触发路由发现。 */
export const RouteLoadError = () => {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <RequireAuth>
      <div className="flex h-screen items-center justify-center">
        <Result
          status="error"
          title="页面加载失败"
          subTitle="请重试，或稍后再次访问。"
          extra={
            <Button
              type="primary"
              onClick={() =>
                void navigate(location.pathname + location.search + location.hash, {
                  replace: true,
                })
              }
            >
              重试
            </Button>
          }
        />
      </div>
    </RequireAuth>
  )
}
