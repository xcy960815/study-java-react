import { lazy } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import MainLayout from '@/layout/index'
import { changeTabIcon, changeTabTitle } from '@/utils/system-style'
import { GuestOnlyRoute, HomeRedirect, RequireAuth, RouteEventBridge } from './route-helpers'

// 路由级代码分割：页面仅在首次访问对应路由时才加载。
const DashboardPage = lazy(() => import('@/views/dashboard'))
const DeepSeekChatPage = lazy(() => import('@/views/deepseek/chat'))
const DeepSeekModelsPage = lazy(() => import('@/views/deepseek/models'))
const FileUploadPage = lazy(() => import('@/views/file-upload/file-upload'))
const GoodsPage = lazy(() => import('@/views/goods'))
const LargeFileUploadPage = lazy(() => import('@/views/file-upload/large-file-upload'))
const Login = lazy(() => import('@/views/login'))
const NotFoundPage = lazy(() => import('@/views/error/not-found'))
const OllamaChatPage = lazy(() => import('@/views/ollama/chat'))
const OllamaModelsPage = lazy(() => import('@/views/ollama/models'))
const OperlogPage = lazy(() => import('@/views/monitor/operlog'))
const ReportPage = lazy(() => import('@/views/monitor/report'))
const ServerPage = lazy(() => import('@/views/monitor/server'))
const OrderPage = lazy(() => import('@/views/order'))
const PasswordPage = lazy(() => import('@/views/password'))
const Register = lazy(() => import('@/views/register'))
const UserInfoPage = lazy(() => import('@/views/user/info'))
const DataDictionaryList = lazy(() => import('@/views/system/data-dictionary'))
const MenuList = lazy(() => import('@/views/system/menu'))
const RoleList = lazy(() => import('@/views/system/role'))
const UserList = lazy(() => import('@/views/system/user'))

const appTitle = import.meta.env.VITE_APP_TITLE || 'Study Java React'

/** 路由 handle 字段类型定义 */
export interface RouteHandle {
  /** 图标名称，同时用于 Tab 图标切换和菜单图标渲染 */
  icon?: string
  /** 菜单显示标题，有此字段才会渲染为菜单项 */
  title?: string
  /** 设为 true 则不在菜单中显示 */
  hidden?: boolean
  /** 侧边栏展示该路由所需权限 */
  requiredPermission?: string
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
    path: 'dashboard',
    element: <DashboardPage />,
    handle: { icon: 'Home', title: '首页工作台' },
  },
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
    handle: { icon: 'ShoppingCart', title: '订单管理', requiredPermission: 'order:query' },
  },
  {
    path: 'goods',
    element: <GoodsPage />,
    handle: { icon: 'Shop', title: '商品管理' },
  },
  {
    path: 'user/info',
    element: <UserInfoPage />,
    handle: { icon: 'User', title: '个人中心', hidden: true },
  },
  {
    path: 'password',
    element: <PasswordPage />,
    handle: { icon: 'Lock', title: '修改密码', hidden: true },
  },
  {
    path: 'deepseek',
    handle: { icon: 'Robot', title: 'DeepSeek' },
    children: [
      {
        path: 'models',
        element: <DeepSeekModelsPage />,
        handle: { icon: 'Robot', title: '模型列表' },
      },
      {
        path: 'chat',
        element: <DeepSeekChatPage />,
        handle: { icon: 'Robot', title: '对话' },
      },
      {
        index: true,
        element: <Navigate to="models" replace />,
        handle: { hidden: true },
      },
    ],
  },
  {
    path: 'ollama',
    handle: { icon: 'Robot', title: 'Ollama' },
    children: [
      {
        path: 'models',
        element: <OllamaModelsPage />,
        handle: { icon: 'Robot', title: '模型列表' },
      },
      {
        path: 'chat',
        element: <OllamaChatPage />,
        handle: { icon: 'Robot', title: '对话' },
      },
      {
        index: true,
        element: <Navigate to="models" replace />,
        handle: { hidden: true },
      },
    ],
  },
  {
    path: 'upload',
    handle: { icon: 'Upload', title: '文件上传' },
    children: [
      {
        path: 'file',
        element: <FileUploadPage />,
        handle: { icon: 'Upload', title: '文件上传' },
      },
      {
        path: 'large-file',
        element: <LargeFileUploadPage />,
        handle: { icon: 'Upload', title: '大文件上传' },
      },
      {
        index: true,
        element: <Navigate to="file" replace />,
        handle: { hidden: true },
      },
    ],
  },
]

const router = createBrowserRouter([
  {
    element: <RouteEventBridge />,
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
        handle: { icon: 'Login', title: '登录', hidden: true },
      },
      {
        path: '/register',
        element: (
          <GuestOnlyRoute>
            <Register />
          </GuestOnlyRoute>
        ),
        handle: { icon: 'Form', title: '注册', hidden: true },
      },
      {
        path: '/',
        element: (
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        ),
        children: layoutRoutes,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

router.subscribe((state) => {
  const matches = state.matches
  const match = matches[matches.length - 1]

  const iconName = match?.route?.handle?.icon
  const pageTitle = match?.route?.handle?.title

  if (iconName) {
    changeTabIcon(iconName as string)
  } else {
    changeTabIcon('System')
  }

  changeTabTitle(pageTitle ? `${String(pageTitle)} - ${appTitle}` : appTitle)
})

export default router
