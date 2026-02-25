import { renderToStaticMarkup } from 'react-dom/server'
import * as iconPark from '@icon-park/react'
import { svg2base64 } from './svg2base64'

/**
 * 修改浏览器标签页标题
 */
export const changeTabTitle = (title: string): void => {
  document.title = title
}

/**
 * 设置浏览器标签页图标
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
 */
export const changeTabIcon = (iconName: string): void => {
  const IconComponent = iconPark[iconName as keyof typeof iconPark] || iconPark.System
  const size = 16

  // 将 React 组件直接绘制为 HTML 文本 (SVG string)
  // @ts-ignore
  const svgString = renderToStaticMarkup(<IconComponent theme="outline" size={size} fill="#333" />)

  if (svgString) {
    setTabIcon(svg2base64(svgString))
  }
}
