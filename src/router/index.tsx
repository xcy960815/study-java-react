import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import Login from '@/views/login'
import Register from '@/views/register'
import MainLayout from '@/layout/index'
import UserList from '@/views/system/user/index'
import RoleList from '@/views/system/role/index'
import MenuList from '@/views/system/menu/index'
import DataDictionaryList from '@/views/system/data-dictionary/index'
import OperlogPage from '@/views/monitor/operlog/index'
import ReportPage from '@/views/monitor/report/index'
import ServerPage from '@/views/monitor/server/index'
import OrderPage from '@/views/order/index'
import GoodsPage from '@/views/goods/index'
import { changeTabIcon } from '@/utils/system-style'

/** 路由 handle 字段类型定义 */
export interface RouteHandle {
  /** 图标名称，同时用于 Tab 图标切换和菜单图标渲染 */
  icon?: string
  /** 菜单显示标题，有此字段才会渲染为菜单项 */
  title?: string
  /** 设为 true 则不在菜单中显示 */
  hidden?: boolean
}

/**
 * 主布局下的子路由配置
 * handle 字段说明：
 *   - icon: 图标名称，同时用于 Tab 图标切换和菜单图标渲染
 *   - title: 菜单显示标题，有此字段才会渲染为菜单项
 *   - hidden: 设为 true 则不在菜单中显示
 */
export const layoutRoutes: RouteObject[] = [
  {
    path: 'system',
    handle: { icon: 'Setting', title: '系统管理' },
    children: [
      {
        path: 'user',
        element: <UserList />,
        handle: { icon: 'User', title: '用户管理' },
      },
      {
        path: 'role',
        element: <RoleList />,
        handle: { icon: 'User', title: '角色管理' },
      },
      {
        path: 'menu',
        element: <MenuList />,
        handle: { icon: 'Menu', title: '菜单管理' },
      },
      {
        path: 'data-dictionary',
        element: <DataDictionaryList />,
        handle: { icon: 'Book', title: '数据字典' },
      },
      {
        index: true,
        element: <Navigate to="user" replace />,
        handle: { hidden: true },
      },
    ],
  },
  {
    path: 'monitor',
    handle: { icon: 'Monitor', title: '监控管理' },
    children: [
      {
        path: 'operlog',
        element: <OperlogPage />,
        handle: { icon: 'FileText', title: '操作日志' },
      },
      {
        path: 'server',
        element: <ServerPage />,
        handle: { icon: 'Line', title: '服务监控' },
      },
      {
        path: 'report',
        element: <ReportPage />,
        handle: { icon: 'Bar', title: '经营报表' },
      },
      {
        index: true,
        element: <Navigate to="operlog" replace />,
        handle: { hidden: true },
      },
    ],
  },
  {
    path: 'order',
    element: <OrderPage />,
    handle: { icon: 'ShoppingCart', title: '订单管理' },
  },
  {
    path: 'goods',
    element: <GoodsPage />,
    handle: { icon: 'Shop', title: '商品管理' },
  },
  {
    path: 'ollama',
    element: <div>Ollama Model Placeholder</div>,
    handle: { icon: 'Robot', title: 'Ollama 模型' },
  },
  {
    path: 'deepseek',
    element: <div>DeepSeek Placeholder</div>,
    handle: { icon: 'Robot', title: 'DeepSeek' },
  },
]

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
    handle: { icon: 'Login' },
  },
  {
    path: '/register',
    element: <Register />,
    handle: { icon: 'Form' },
  },
  {
    path: '/',
    element: <MainLayout />,
    children: layoutRoutes,
  },
])

router.subscribe((state) => {
  const matches = state.matches
  const match = matches[matches.length - 1]

  // 查找匹配的路由是否有 handle.icon 的配置，动态更新 Tab 图标
  const iconName = match?.route?.handle?.icon
  if (iconName) {
    changeTabIcon(iconName as string)
  } else {
    changeTabIcon('System') // 默认使用 System 原点图标
  }
})

export default router
