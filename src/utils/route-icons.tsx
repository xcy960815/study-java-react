import type { ReactNode } from 'react'
import {
  BarChartOutlined,
  BookOutlined,
  DesktopOutlined,
  FileTextOutlined,
  HomeOutlined,
  LineChartOutlined,
  MenuOutlined,
  RobotOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  ApplicationMenu,
  Book,
  ChartHistogram,
  ChartLine,
  FileText,
  Form,
  Home,
  Lock,
  Login,
  Monitor,
  Robot,
  Setting,
  Shop,
  ShoppingCart,
  System,
  User,
} from '@icon-park/react'

type IconParkIconComponent = typeof Setting

/** 单个路由图标在两套图标库中的映射 */
interface RouteIconEntry {
  /** 侧边栏菜单使用的 Ant Design 图标节点 */
  menu?: ReactNode
  /** 浏览器标签页 favicon 使用的 IconPark 图标组件 */
  tab: IconParkIconComponent
}

/**
 * 路由图标的唯一注册表，新增图标时只需在此添加一行。
 * handle.icon 的取值必须与这里的键保持一致：
 *   - menu 用于侧边栏菜单渲染；
 *   - tab 用于浏览器标签页图标渲染。
 */
export const routeIconRegistry: Record<string, RouteIconEntry> = {
  Home: { menu: <HomeOutlined />, tab: Home },
  Setting: { menu: <SettingOutlined />, tab: Setting },
  Monitor: { menu: <DesktopOutlined />, tab: Monitor },
  Robot: { menu: <RobotOutlined />, tab: Robot },
  User: { menu: <UserOutlined />, tab: User },
  Menu: { menu: <MenuOutlined />, tab: ApplicationMenu },
  Book: { menu: <BookOutlined />, tab: Book },
  FileText: { menu: <FileTextOutlined />, tab: FileText },
  Line: { menu: <LineChartOutlined />, tab: ChartLine },
  Bar: { menu: <BarChartOutlined />, tab: ChartHistogram },
  ShoppingCart: { menu: <ShoppingCartOutlined />, tab: ShoppingCart },
  Shop: { menu: <ShopOutlined />, tab: Shop },
  // Login/Form/Lock 仅用于隐藏的登录/注册/改密路由，System 是 favicon 的兜底图标，
  // 四者不会出现在侧边栏菜单中，无需提供 menu 图标。
  Login: { tab: Login },
  Form: { tab: Form },
  Lock: { tab: Lock },
  System: { tab: System },
}

/** 根据图标名称获取侧边栏菜单图标节点 */
export const getMenuIcon = (iconName?: string): ReactNode =>
  (iconName && routeIconRegistry[iconName]?.menu) || null

/** 根据图标名称获取标签页图标组件，未注册时回退到 System */
export const getTabIconComponent = (iconName?: string): IconParkIconComponent =>
  (iconName && routeIconRegistry[iconName]?.tab) || System
