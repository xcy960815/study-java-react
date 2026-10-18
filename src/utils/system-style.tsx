import { renderToStaticMarkup } from 'react-dom/server'
import { getTabIconComponent } from './route-icons'
import { svg2base64 } from './svg2base64'
import { svgIconContents } from '@/assets/svg-icons'

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
 * 根据路由更新标签页图标（与 Vue 端 system-style 的三级解析同构）：
 * - 优先使用本地图标（assets/svg-icons 注册表，如 password）；
 * - 其次使用 IconPark 注册表中的同名组件；
 * - 名称未注册时保持现有favicon，不做任何变更。
 *
 * @param iconName 路由图标名称（Vue 端 meta.icon 同一命名空间，见 utils/route-icons 注册表）
 */
export const changeTabIcon = (iconName?: string): void => {
  if (!iconName) {
    return
  }

  const localSvgIcon = svgIconContents[iconName as keyof typeof svgIconContents]
  if (localSvgIcon) {
    setTabIcon(svg2base64(localSvgIcon))
    return
  }

  const IconComponent = getTabIconComponent(iconName)
  if (!IconComponent) {
    return
  }

  const size = 16
  const svgString = renderToStaticMarkup(<IconComponent theme="outline" size={size} fill="#333" />)

  if (svgString) {
    setTabIcon(svg2base64(svgString))
  }
}
