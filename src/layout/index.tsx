import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { Layout, Menu, Avatar, Button, Dropdown, Space, Spin } from 'antd'
import {
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useLoginStore } from '@/store'
import { layoutRoutes } from '@/router'
import type { RouteHandle } from '@/router'
import type { RouteObject } from 'react-router-dom'
import type { ItemType } from 'antd/es/menu/interface'
import { useOrderNotifications } from '@/hooks/useOrderNotifications'
import { hasPermission } from '@/utils/permission'
import { getMenuIcon } from '@/utils/route-icons'
import NotificationBell from '@/components/notification-bell'

const { Header, Sider, Content } = Layout

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
        return (
          h?.title &&
          !h?.hidden &&
          (!h.requiredPermission || hasPermission(permissions, h.requiredPermission))
        )
      })

      if (visibleChildren && visibleChildren.length > 0) {
        return {
          key: fullPath,
          icon: getMenuIcon(handle?.icon),
          label: handle!.title,
          children: generateMenuItems(visibleChildren, permissions, fullPath),
        }
      }

      return {
        key: fullPath,
        icon: getMenuIcon(handle?.icon),
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
    // 失败提示由 request 拦截器统一弹出，这里无需重复提示。
    void loadCurrentUser().catch(() => undefined)
  }, [loadCurrentUser])

  useOrderNotifications(user?.id)

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  /** 头像下拉菜单：个人中心 / 修改密码 / 退出登录 */
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'user-info') {
      navigate('/user/info')
    } else if (key === 'change-password') {
      navigate('/password')
    } else if (key === 'login-out') {
      void handleLogout()
    }
  }

  const userMenuItems = [
    { key: 'user-info', icon: <UserOutlined />, label: '个人中心' },
    { key: 'change-password', icon: <LockOutlined />, label: '修改密码' },
    { type: 'divider' as const },
    { key: 'login-out', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

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
          <Space size={16}>
            <NotificationBell />
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              trigger={['click']}
            >
              <Button type="link" style={{ padding: 0 }}>
                <Space size={4}>
                  <Avatar size={28} src={user?.avatar}>
                    {user?.nickName?.charAt(0)}
                  </Avatar>
                  {user?.nickName}
                  <DownOutlined style={{ fontSize: 10 }} />
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="m-6 min-h-70 overflow-auto rounded bg-white p-6 shadow-sm">
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center">
                <Spin size="large" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
