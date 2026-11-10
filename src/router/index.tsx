/* eslint-disable react-refresh/only-export-components -- 路由工厂模块，不是组件文件 */
import { lazy } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import MainLayout from '@/layout/index'
import { getToken } from '@/utils/token'
import { CATCHALL_ROUTE_ID, LAYOUT_ROUTE_ID } from './constants'
import {
  GuestOnlyRoute,
  HomeRedirect,
  RequireAuth,
  RouteEventBridge,
  RouteLoadError,
  RouteLoading,
} from './route-helpers'
import { staticLayoutRoutes } from './static-routes'
import type { RouteHandle } from './types'

export type { RouteHandle } from './types'
export { CATCHALL_ROUTE_ID, DEFAULT_AUTHED_PATH, LAYOUT_ROUTE_ID } from './constants'
export { getRouter, setCurrentRouter } from './instance'
export { layoutRoutes, staticLayoutRoutes } from './static-routes'

const Login = lazy(() => import('@/views/login'))
const NotFoundPage = lazy(() => import('@/views/error/not-found'))
const Register = lazy(() => import('@/views/register'))

const createRouteConfig = (): RouteObject[] => [
  {
    element: <RouteEventBridge />,
    errorElement: <RouteLoadError />,
    hydrateFallbackElement: <RouteLoading />,
    children: [
      {
        index: true,
        element: <HomeRedirect />,
      },
      {
        path: '/login',
        element: (
          <GuestOnlyRoute>
            <Login />
          </GuestOnlyRoute>
        ),
        handle: { icon: 'Login', title: '登录', hidden: true } satisfies RouteHandle,
      },
      {
        path: '/register',
        element: (
          <GuestOnlyRoute>
            <Register />
          </GuestOnlyRoute>
        ),
        handle: { icon: 'Form', title: '注册', hidden: true } satisfies RouteHandle,
      },
      {
        id: LAYOUT_ROUTE_ID,
        path: '/',
        element: (
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        ),
        children: staticLayoutRoutes,
      },
      {
        id: CATCHALL_ROUTE_ID,
        path: '*',
        element: (
          <RequireAuth>
            <NotFoundPage />
          </RequireAuth>
        ),
      },
    ],
  },
]

/**
 * 创建浏览器路由。登出后需重新调用来丢掉 patchRoutes 追加的业务路由。
 */
export const createAppRouter = () => {
  const router = createBrowserRouter(createRouteConfig(), {
    patchRoutesOnNavigation: async ({ patch, signal }) => {
      if (!getToken()) return
      // matches 可能只有部分父级匹配，不能要求末项一定是 catchall。
      const { ensureDynamicRoutes } = await import('./ensure-dynamic-routes')
      await ensureDynamicRoutes({ router, patch, signal })
    },
  })
  return router
}
