import React, { useState } from 'react'
import { Layout, Menu, Button } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DesktopOutlined,
  SettingOutlined,
  RobotOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons'
import { useLoginStore } from '@/store'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useLoginStore()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/system',
      icon: <SettingOutlined />,
      label: '系统管理',
    },
    {
      key: '/monitor',
      icon: <DesktopOutlined />,
      label: '监控管理',
    },
    {
      key: '/ollama',
      icon: <RobotOutlined />,
      label: 'Ollama 模型',
    },
    {
      key: '/deepseek',
      icon: <RobotOutlined />,
      label: 'DeepSeek',
    },
  ]

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
        <Content className="m-6 p-6 bg-white min-h-[280px] overflow-auto rounded shadow-sm">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
