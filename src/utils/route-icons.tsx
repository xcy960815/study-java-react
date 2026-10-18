import type { ReactNode } from 'react'
import {
  BarChartOutlined,
  BarsOutlined,
  BookOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  HomeOutlined,
  InboxOutlined,
  LineChartOutlined,
  MenuOutlined,
  OrderedListOutlined,
  ProfileOutlined,
  RobotOutlined,
  SafetyOutlined,
  SettingOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  UploadOutlined,
  UserOutlined,
  WechatOutlined,
} from '@ant-design/icons'
import {
  AddressBook,
  ApplicationMenu,
  Bookmark,
  Brain,
  ChartLine,
  Commodity,
  Cpu,
  Form,
  Home,
  Histogram,
  InboxUploadR,
  ListView,
  Login,
  Monitor,
  Order,
  OrderedList,
  Permissions,
  Setting,
  TrendTwo,
  UploadTwo,
  UploadThree,
  User,
  Wechat,
} from '@icon-park/react'

type IconParkIconComponent = typeof Setting

/** 单个路由图标在两套图标库中的映射 */
interface RouteIconEntry {
  /** 侧边栏菜单使用的 Ant Design 图标节点 */
  menu?: ReactNode
  /** 浏览器标签页 favicon 使用的 IconPark 图标组件（缺省 = 该名称不切换 favicon） */
  tab?: IconParkIconComponent
}

/**
 * 路由图标的唯一注册表，新增图标时只需在此添加一行。
 * handle.icon 的取值必须与这里的键保持一致，且与 Vue 端 meta.icon 为同一套名称
 * （静态 baseRoutes 的 ApplicationMenu/Permissions/Bookmark/TrendTwo/ChartLine 等
 *   与后端菜单表动态下发的 Brain/Commodity/InboxUploadR/Wechat/Order 等取并集）：
 *   - menu 用于侧边栏菜单渲染；
 *   - tab 用于浏览器标签页图标渲染。
 * 未注册的名称一律返回 null/undefined，favicon 解析方按「保持不变」处理（与 Vue 一致）。
 */
export const routeIconRegistry: Record<string, RouteIconEntry> = {
  Home: { menu: <HomeOutlined />, tab: Home },
  User: { menu: <UserOutlined />, tab: User },
  AddressBook: { menu: <UserOutlined />, tab: AddressBook },
  Permissions: { menu: <SafetyOutlined />, tab: Permissions },
  ApplicationMenu: { menu: <MenuOutlined />, tab: ApplicationMenu },
  Bookmark: { menu: <BookOutlined />, tab: Bookmark },
  // 商品分类在后端菜单表与 Vue 静态路由中均无同名图标：菜单沿用 antd 图形，favicon 不切换。
  Book: { menu: <BookOutlined /> },
  Setting: { menu: <SettingOutlined />, tab: Setting },
  Monitor: { menu: <DesktopOutlined />, tab: Monitor },
  TrendTwo: { menu: <LineChartOutlined />, tab: TrendTwo },
  ChartLine: { menu: <BarChartOutlined />, tab: ChartLine },
  Histogram: { menu: <BarsOutlined />, tab: Histogram },
  Cpu: { menu: <ExperimentOutlined />, tab: Cpu },
  Brain: { menu: <RobotOutlined />, tab: Brain },
  Wechat: { menu: <WechatOutlined />, tab: Wechat },
  Commodity: { menu: <ShopOutlined />, tab: Commodity },
  ListView: { menu: <UnorderedListOutlined />, tab: ListView },
  Order: { menu: <ProfileOutlined />, tab: Order },
  OrderedList: { menu: <OrderedListOutlined />, tab: OrderedList },
  InboxUploadR: { menu: <InboxOutlined />, tab: InboxUploadR },
  UploadTwo: { menu: <UploadOutlined />, tab: UploadTwo },
  UploadThree: { menu: <UploadOutlined />, tab: UploadThree },
  // Login/Form 仅用于隐藏的登录/注册路由，不会出现在侧边栏菜单中，无需提供 menu 图标。
  Login: { tab: Login },
  Form: { tab: Form },
}

/** 根据图标名称获取侧边栏菜单图标节点 */
export const getMenuIcon = (iconName?: string): ReactNode =>
  (iconName && routeIconRegistry[iconName]?.menu) || null

/** 根据图标名称获取标签页图标组件；未注册时返回 undefined（调用方视为不切换 favicon） */
export const getTabIconComponent = (iconName?: string): IconParkIconComponent | undefined =>
  (iconName && routeIconRegistry[iconName]?.tab) || undefined
