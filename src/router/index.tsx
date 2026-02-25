import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from '@/views/login'
import MainLayout from '@/layout/index'
import UserList from '@/views/system/user/index'
import { changeTabIcon } from '@/utils/system-style'

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
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'system',
        children: [
          {
            path: 'user',
            element: <UserList />,
            handle: { icon: 'User' },
          },
          {
            index: true,
            element: <Navigate to="user" replace />,
          },
        ],
      },
      {
        path: 'monitor',
        element: <div>Monitor Management Placeholder</div>,
        handle: { icon: 'Monitor' },
      },
      {
        path: 'ollama',
        element: <div>Ollama Model Placeholder</div>,
        handle: { icon: 'Robot' },
      },
      {
        path: 'deepseek',
        element: <div>DeepSeek Placeholder</div>,
        handle: { icon: 'System' },
      },
    ],
  },
])

router.subscribe((state) => {
  const matches = state.matches
  const match = matches[matches.length - 1]

  // 查找匹配的路由是否有 handle.icon 的配置，动态更新 Tab 图标
  // ts-ignore
  const iconName = (match?.route as any)?.handle?.icon
  if (iconName) {
    changeTabIcon(iconName as string)
  } else {
    changeTabIcon('System') // 默认使用 System 原点图标
  }
})

export default router
