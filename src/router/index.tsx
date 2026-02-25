import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from '@/views/login'
import MainLayout from '@/layout/index'
import UserList from '@/views/system/user/index'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
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
      },
      {
        path: 'ollama',
        element: <div>Ollama Model Placeholder</div>,
      },
      {
        path: 'deepseek',
        element: <div>DeepSeek Placeholder</div>,
      },
    ],
  },
])

export default router
