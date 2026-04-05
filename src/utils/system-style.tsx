import {
  ApplicationMenu,
  Book,
  ChartHistogram,
  ChartLine,
  FileText,
  Form,
  Login,
  Monitor,
  Robot,
  Setting,
  Shop,
  ShoppingCart,
  System,
  User,
} from '@icon-park/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { svg2base64 } from './svg2base64'

type IconParkIconComponent = typeof Setting

/**
 * 路由图标名称与实际 IconPark 组件的映射表。
 * 这里显式按需导入，避免整包图标被打进产物。
 */
const iconComponents: Record<string, IconParkIconComponent> = {
  Setting,
  Monitor,
  Robot,
  User,
  Menu: ApplicationMenu,
  Book,
  FileText,
  Line: ChartLine,
  Bar: ChartHistogram,
  ShoppingCart,
  Shop,
  Login,
  Form,
  System,
}

/**
 * 修改浏览器标签页标题
 * @param {string} title 新的页面标题
 */
export const changeTabTitle = (title: string): void => {
  document.title = title
}

/**
 * 设置浏览器标签页图标
 * @param {string} iconPath 图标的链接路径（支持 base64）
 */
export const setTabIcon = (iconPath: string): void => {
  if (!iconPath) return

  let linkElement = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
  if (!linkElement) {
    linkElement = document.createElement('link')
    document.head.appendChild(linkElement)
  }

  Object.assign(linkElement, {
    type: 'image/x-icon',
    rel: 'shortcut icon',
    href: iconPath,
  })
}

/**
 * 根据路由更新标签页图标
 * @param {string} iconName 来自 IconPark 的图标名称
 */
export const changeTabIcon = (iconName: string): void => {
  const IconComponent = iconComponents[iconName] || System
  const size = 16

  // 将 React 图标组件渲染成静态 SVG，再转成 base64 favicon。
  const svgString = renderToStaticMarkup(<IconComponent theme="outline" size={size} fill="#333" />)

  if (svgString) {
    setTabIcon(svg2base64(svgString))
  }
}
