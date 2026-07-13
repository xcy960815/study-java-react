import React, { useEffect, useMemo, useState } from 'react'
import { Layout, Menu, Button, message } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DesktopOutlined,
  SettingOutlined,
  RobotOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  BookOutlined,
  FileTextOutlined,
  LineChartOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { useLoginStore } from '@/store'
import { layoutRoutes } from '@/router'
import type { RouteHandle } from '@/router'
import type { RouteObject } from 'react-router-dom'
import type { ItemType } from 'antd/es/menu/interface'
import { useOrderNotifications } from '@/hooks/useOrderNotifications'
import { hasPermission } from '@/utils/permission'

const { Header, Sider, Content } = Layout

/** 图标名称到组件的映射表，新增图标在此添加即可 */
const iconMap: Record<string, React.ReactNode> = {
  Setting: <SettingOutlined />,
  Monitor: <DesktopOutlined />,
  Robot: <RobotOutlined />,
  User: <UserOutlined />,
  Menu: <MenuOutlined />,
  Book: <BookOutlined />,
  FileText: <FileTextOutlined />,
  Line: <LineChartOutlined />,
  Bar: <BarChartOutlined />,
  ShoppingCart: <ShoppingCartOutlined />,
  Shop: <ShopOutlined />,
}

/**
 * 根据路由配置自动生成菜单项
 * 仅渲染 handle 中包含 title 且 hidden 不为 true 的路由
 */
const generateMenuItems = (
  routes: RouteObject[],
  permissions: string[],
  parentPath = ''
): ItemType[] => {
  return routes
    .filter((route) => {
      const handle = route.handle as RouteHandle | undefined
      return (
        handle?.title &&
        !handle?.hidden &&
        (!handle.requiredPermission || hasPermission(permissions, handle.requiredPermission))
      )
    })
    .map((route) => {
      const handle = route.handle as RouteHandle | undefined
      const fullPath = `${parentPath}/${route.path}`
      const children = 'children' in route ? route.children : undefined
      const visibleChildren = children?.filter((child) => {
        const h = child.handle as RouteHandle | undefined
        return h?.title && !h?.hidden
      })

      if (visibleChildren && visibleChildren.length > 0) {
        return {
          key: fullPath,
          icon: iconMap[handle?.icon || ''] || null,
          label: handle!.title,
          children: generateMenuItems(visibleChildren, permissions, fullPath),
        }
      }

      return {
        key: fullPath,
        icon: iconMap[handle?.icon || ''] || null,
        label: handle!.title,
      }
    })
}

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user, loadCurrentUser } = useLoginStore()

  useEffect(() => {
    void loadCurrentUser().catch(() => message.error('获取当前用户信息失败'))
  }, [loadCurrentUser])

  useOrderNotifications(user?.id)

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  /** 从路由配置动态生成的菜单项 */
  const menuItems = useMemo(
    () => generateMenuItems(layoutRoutes, user?.permissions || []),
    [user?.permissions]
  )

  return (
    <Layout className="h-screen w-screen overflow-hidden">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="h-16 flex items-center justify-center text-white font-bold text-lg">
          {collapsed ? 'SJR' : import.meta.env.VITE_APP_TITLE || 'Study Java React'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/' + location.pathname.split('/')[1]]}
          onClick={handleMenuClick}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          className="bg-white p-0 flex justify-between items-center pr-6 border-b border-gray-200"
          style={{ padding: 0 }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="w-16 h-16 text-lg"
          />
          <Button type="link" danger icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content className="m-6 min-h-70 overflow-auto rounded bg-white p-6 shadow-sm">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
