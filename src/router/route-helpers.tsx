import { Button, Result } from 'antd'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { eventEmitter } from '@/utils/event-emits'
import { getToken } from '@/utils/token'

const defaultAuthedPath = '/system'

interface RouteState {
  from?: string
}

/**
 * 在路由树根部监听登录态事件，并在会话结束时统一跳回登录页。
 */
export const RouteEventBridge = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleSessionEnded = () => {
      navigate('/login', { replace: true })
    }

    eventEmitter.on('logout', handleSessionEnded)
    eventEmitter.on('token-invalid', handleSessionEnded)

    return () => {
      eventEmitter.off('logout', handleSessionEnded)
      eventEmitter.off('token-invalid', handleSessionEnded)
    }
  }, [navigate])

  return <Outlet />
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
    return <Navigate to="/login" replace state={{ from: location.pathname } as RouteState} />
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
    return <Navigate to={defaultAuthedPath} replace />
  }

  return <>{children}</>
}

/**
 * 根据当前登录状态，将根路径重定向到登录页或系统首页。
 */
export const HomeRedirect = () => {
  return <Navigate to={getToken() ? defaultAuthedPath : '/login'} replace />
}

/**
 * 给尚未开放的功能模块提供统一的占位页。
 *
 * @param title 功能标题
 */
export const ComingSoonPage = ({ title }: { title: string }) => {
  const navigate = useNavigate()

  return (
    <Result
      status="info"
      title={`${title} 功能建设中`}
      subTitle="入口先隐藏起来了，后续接入完整业务后再开放。"
      extra={
        <Button type="primary" onClick={() => navigate(defaultAuthedPath)}>
          返回系统首页
        </Button>
      }
    />
  )
}
