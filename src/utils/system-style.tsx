import { renderToStaticMarkup } from 'react-dom/server'
import { getTabIconComponent } from './route-icons'
import { svg2base64 } from './svg2base64'

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
 * @param {string} iconName 路由图标名称（见 utils/route-icons 注册表）
 */
export const changeTabIcon = (iconName: string): void => {
  const IconComponent = getTabIconComponent(iconName)
  const size = 16

  // 将 React 图标组件渲染成静态 SVG，再转成 base64 favicon。
  const svgString = renderToStaticMarkup(<IconComponent theme="outline" size={size} fill="#333" />)

  if (svgString) {
    setTabIcon(svg2base64(svgString))
  }
}
