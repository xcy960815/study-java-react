import { useEffect } from 'react'
import { useMatches } from 'react-router-dom'

import { changeTabIcon, changeTabTitle } from '@/utils/system-style'

const appTitle = import.meta.env.VITE_APP_TITLE || 'Study Java React'

/** 路由叶子节点 handle 的 tab 元信息（与 router 配置中的 RouteHandle 字段一致） */
interface RouteLeafHandle {
  icon?: string
  title?: string
}

/**
 * 路由元数据同步：浏览器标签页标题 + favicon。
 *
 * 采用 useMatches 驱动（每次导航渲染，含首次挂载），
 * 替代 router.subscribe——后者注册晚于 createBrowserRouter 的初始同步导航，
 * 首屏路由不会收到任何通知，导致 tab 图标/标题从未更新。
 */
export const RouteTabMetaSync = () => {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]

  useEffect(() => {
    const handle = leaf?.handle as RouteLeafHandle | undefined
    const iconName = handle?.icon
    const pageTitle = handle?.title

    // 未注册 / 无 icon 的路由保持现有 favicon 不变（Vue 同语义），内部已三级求解。
    changeTabIcon(iconName)

    changeTabTitle(pageTitle ? `${pageTitle} - ${appTitle}` : appTitle)
  }, [leaf])

  return null
}
