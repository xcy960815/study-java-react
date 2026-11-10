import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import type { RouteHandle } from './types'

const DashboardPage = lazy(() => import('@/views/dashboard'))
const PasswordPage = lazy(() => import('@/views/password'))
const UserInfoPage = lazy(() => import('@/views/user/info'))
const MenuPage = lazy(() => import('@/views/system/menu'))
const UserPage = lazy(() => import('@/views/system/user'))
const RolePage = lazy(() => import('@/views/system/role'))
const DataDictionaryPage = lazy(() => import('@/views/system/data-dictionary'))
const ServerPage = lazy(() => import('@/views/monitor/server'))
const ReportPage = lazy(() => import('@/views/monitor/report'))

/**
 * 常驻 layout 下的静态壳路由。
 * 系统管理、系统监控按 Vue 保留为常驻模块，其余业务页由 getRoutes 注册。
 */
export const staticLayoutRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <DashboardPage />,
    handle: { icon: 'Home', title: '首页工作台' } satisfies RouteHandle,
  },
  {
    id: 'static-system',
    path: 'system',
    handle: { icon: 'Setting', title: '系统管理' } satisfies RouteHandle,
    children: [
      {
        path: 'menu',
        element: <MenuPage />,
        handle: { icon: 'ApplicationMenu', title: '菜单管理' } satisfies RouteHandle,
      },
      {
        path: 'user',
        element: <UserPage />,
        handle: { icon: 'AddressBook', title: '用户列表' } satisfies RouteHandle,
      },
      {
        path: 'role',
        element: <RolePage />,
        handle: { icon: 'Permissions', title: '角色列表' } satisfies RouteHandle,
      },
      {
        path: 'data-dictionary',
        element: <DataDictionaryPage />,
        handle: { icon: 'Bookmark', title: '数据字典' } satisfies RouteHandle,
      },
      {
        index: true,
        element: <Navigate to="menu" replace />,
        handle: { hidden: true } satisfies RouteHandle,
      },
    ],
  },
  {
    id: 'static-monitor',
    path: 'monitor',
    handle: { icon: 'Monitor', title: '系统监控' } satisfies RouteHandle,
    children: [
      {
        path: 'server',
        element: <ServerPage />,
        handle: { icon: 'TrendTwo', title: '服务监控' } satisfies RouteHandle,
      },
      {
        path: 'report',
        element: <ReportPage />,
        handle: { icon: 'ChartLine', title: '经营报表' } satisfies RouteHandle,
      },
      {
        index: true,
        element: <Navigate to="server" replace />,
        handle: { hidden: true } satisfies RouteHandle,
      },
    ],
  },
  {
    path: 'user/info',
    element: <UserInfoPage />,
    handle: { icon: 'User', title: '个人中心', hidden: true } satisfies RouteHandle,
  },
  {
    path: 'password',
    element: <PasswordPage />,
    handle: { icon: 'password', title: '修改密码', hidden: true } satisfies RouteHandle,
  },
  {
    // 历史静态路径是复数，后端菜单是 /lab/virtual-thread，保留兼容跳转。
    path: 'lab/virtual-threads',
    element: <Navigate to="/lab/virtual-thread" replace />,
    handle: { hidden: true } satisfies RouteHandle,
  },
]

/** @deprecated 业务路由改由 getRoutes 动态注册，请使用 staticLayoutRoutes */
export const layoutRoutes = staticLayoutRoutes
