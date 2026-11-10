import React, { Suspense, useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  ConfigProvider,
  Dropdown,
  Layout,
  Menu,
  Space,
  Spin,
  Tag,
  Tooltip,
  theme as antdTheme,
} from 'antd'
import {
  BgColorsOutlined,
  DownOutlined,
  ExpandOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MoonOutlined,
  SettingOutlined,
  ShrinkOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useLoginStore, useSystemStore, useThemeStore } from '@/store'
import { staticLayoutRoutes } from '@/router/static-routes'
import type { ItemType } from 'antd/es/menu/interface'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useOrderNotifications } from '@/hooks/useOrderNotifications'
import { useResolvedIsDark } from '@/hooks/useResolvedTheme'
import { hasPermission } from '@/utils/permission'
import NotificationBell from '@/components/notification-bell'
import UpdateIndicator from '@/components/update-indicator'
import ThemeSettingsDrawer from '@/components/theme-settings'
import { buildMenuItems } from './menu-items'

const { Header, Sider, Content } = Layout

/** 计算当前是否应使用暗色主题 */
const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user, loadCurrentUser } = useLoginStore()
  const primaryColors = useThemeStore((state) => state.primaryColors)
  const setMode = useThemeStore((state) => state.setMode)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isDark = useResolvedIsDark()
  const resolvedPrimaryColor = isDark ? primaryColors.dark : primaryColors.light
  const { fullscreen, toggleFullscreen } = useFullscreen()

  const backendRoutes = useSystemStore((state) => state.routes)

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
  }

  /** 头像下拉菜单：个人中心 / 修改密码 / 个性化设置 / 退出登录 */
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'user-info') {
      navigate('/user/info')
    } else if (key === 'change-password') {
      navigate('/password')
    } else if (key === 'theme-settings') {
      setSettingsOpen(true)
    } else if (key === 'login-out') {
      void handleLogout()
    }
  }

  const isAdmin = hasPermission(user?.permissions || [], '*:*:*')

  /** 下拉菜单首项：用户名片（头像 + 展示名 + 登录账号 + 角色），不可点击 */
  const userMenuItems: ItemType[] = [
    {
      key: 'user-profile-card',
      disabled: true,
      label: (
        <div className="flex items-center gap-3 py-1 pr-6">
          <Avatar size={40} src={user?.avatar} shape="square" style={{ borderRadius: 8 }}>
            {user?.nickName?.charAt(0)}
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">{user?.nickName ?? '未登录用户'}</span>
            <span className="truncate text-xs text-gray-400">@{user?.loginName}</span>
          </div>
          <Tag color={isAdmin ? 'volcano' : 'default'} className="ml-auto shrink-0">
            {isAdmin ? '管理员' : '普通用户'}
          </Tag>
        </div>
      ),
    },
    { type: 'divider' as const },
    { key: 'user-info', icon: <UserOutlined />, label: '个人中心' },
    { key: 'change-password', icon: <LockOutlined />, label: '修改密码' },
    { key: 'theme-settings', icon: <SettingOutlined />, label: '个性化设置' },
    { type: 'divider' as const },
    { key: 'login-out', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  /** 常驻系统模块 + 后端业务菜单，目录和子页分别按完整路径合并。 */
  const menuItems = useMemo(
    () => buildMenuItems(staticLayoutRoutes, backendRoutes, user?.permissions || []),
    [backendRoutes, user?.permissions]
  )

  /** 系统深色偏好的监听由 useResolvedIsDark 内部处理（跟随系统模式） */

  /** 同步 html 根元素暗色类，供 Tailwind dark: 变体与全局 CSS 使用 */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  /** 双值主色取当前模式侧后写入 CSS 变量，供头像描边、hover 反馈等原生样式引用 */
  useEffect(() => {
    document.documentElement.style.setProperty('--sjr-primary', resolvedPrimaryColor)
  }, [resolvedPrimaryColor])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: resolvedPrimaryColor },
      }}
    >
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
            className="flex justify-between items-center pr-4"
            style={{
              padding: 0,
              background: 'var(--antd-bg-surface)',
              borderBottom: '1px solid var(--antd-border)',
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="w-16 h-16 text-lg"
            />
            <Space size={12} align="center">
              {/* 新版本脉冲点（参考 guibiao），有更新才渲染 */}
              <UpdateIndicator />
              {/* 订单通知铃 */}
              <NotificationBell />
              {/* 全屏切换（参考 guibiao header-actions） */}
              <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
                <Button
                  type="text"
                  aria-label={fullscreen ? '退出全屏' : '全屏'}
                  icon={fullscreen ? <ShrinkOutlined /> : <ExpandOutlined />}
                  onClick={() => void toggleFullscreen()}
                />
              </Tooltip>
              {/* 明暗快速切换（与 Vue 右上角对齐） */}
              <Tooltip title={isDark ? '切换到亮色' : '切换到暗色'}>
                <Button
                  type="text"
                  aria-label={isDark ? '切换到亮色' : '切换到暗色'}
                  icon={<MoonOutlined />}
                  onClick={() => setMode(isDark ? 'light' : 'dark')}
                />
              </Tooltip>
              {/* 打开个性化设置抽屉（与 Vue 主题笔一致） */}
              <Tooltip title="个性化设置">
                <Button
                  type="text"
                  aria-label="个性化设置"
                  icon={<BgColorsOutlined />}
                  onClick={() => setSettingsOpen(true)}
                />
              </Tooltip>
              {/* 用户区：Vue 风格方块头像 + 用户名，hover 呈主色描边 */}
              <Dropdown
                menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
                trigger={['click']}
              >
                <button type="button" className="user-trigger" aria-label="用户菜单">
                  <Avatar
                    size={28}
                    shape="square"
                    src={user?.avatar}
                    className="user-avatar"
                    style={{ borderRadius: 6 }}
                  >
                    {user?.nickName?.charAt(0)}
                  </Avatar>
                  <span className="user-name">{user?.nickName}</span>
                  <DownOutlined style={{ fontSize: 10 }} />
                </button>
              </Dropdown>
            </Space>
          </Header>
          <Content
            className="layout-content m-6 min-h-70 overflow-auto rounded p-6"
            style={{
              background: 'var(--antd-bg-surface)',
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.03)',
            }}
          >
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
      <ThemeSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ConfigProvider>
  )
}

export default MainLayout
