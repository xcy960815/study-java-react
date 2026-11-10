import type { ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import type { ItemType } from 'antd/es/menu/interface'
import type { MenuVo } from '@/apis/system/menu'
import type { RouteHandle } from '@/router/types'
import { hasPermission } from '@/utils/permission'
import { getMenuIcon } from '@/utils/route-icons'

interface MenuItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  children?: MenuItem[]
}

const fullPath = (parent: string, path: string) =>
  path.startsWith('/') ? path : `${parent}/${path}`

const staticMenuItems = (routes: RouteObject[], permissions: string[], parent = ''): MenuItem[] =>
  routes.flatMap((route) => {
    const handle = route.handle as RouteHandle | undefined
    if (
      !route.path ||
      !handle?.title ||
      handle.hidden ||
      (handle.requiredPermission && !hasPermission(permissions, handle.requiredPermission))
    )
      return []
    const path = fullPath(parent, route.path)
    const children = route.children ? staticMenuItems(route.children, permissions, path) : undefined
    if (route.children && !children?.length) return []
    return [{ key: path, label: handle.title, icon: getMenuIcon(handle.icon), children }]
  })

const backendMenuItems = (menus: MenuVo[], hidden: Set<string>, parent = ''): MenuItem[] =>
  menus.flatMap((menu) => {
    if (!menu.path || !menu.menuName) return []
    const path = fullPath(parent, menu.path)
    if (hidden.has(path)) return []
    const children = menu.children?.length
      ? backendMenuItems(menu.children, hidden, path)
      : undefined
    if (menu.children?.length && !children?.length) return []
    return [{ key: path, label: menu.menuName, icon: getMenuIcon(menu.icon), children }]
  })

const mergeMenuItems = (resident: MenuItem[], backend: MenuItem[]): MenuItem[] => {
  const merged = [...resident]
  for (const item of backend) {
    const index = merged.findIndex((existing) => existing.key === item.key)
    if (index < 0) {
      const parentIndex = merged.findIndex(
        (existing) => existing.children && item.key.startsWith(`${existing.key}/`)
      )
      if (parentIndex < 0) merged.push(item)
      else {
        const parent = merged[parentIndex]
        merged[parentIndex] = { ...parent, children: mergeMenuItems(parent.children ?? [], [item]) }
      }
    } else {
      const existing = merged[index]
      if (existing.children || item.children) {
        merged[index] = {
          ...existing,
          children: mergeMenuItems(existing.children ?? [], item.children ?? []),
        }
      }
    }
  }
  return merged
}

const toMenuItem = ({ children, ...item }: MenuItem): ItemType =>
  children ? { ...item, children: children.map(toMenuItem) } : item

/** 常驻模块与后端菜单按完整路径递归合并，重复目录不能吞掉常驻子页。 */
export const buildMenuItems = (
  routes: RouteObject[],
  menus: MenuVo[],
  permissions: string[]
): ItemType[] => {
  const hidden = new Set<string>()
  const collectHidden = (items: RouteObject[], parent = '') => {
    for (const route of items) {
      if (!route.path) continue
      const path = fullPath(parent, route.path)
      if ((route.handle as RouteHandle | undefined)?.hidden) hidden.add(path)
      if (route.children) collectHidden(route.children, path)
    }
  }
  collectHidden(routes)
  return mergeMenuItems(staticMenuItems(routes, permissions), backendMenuItems(menus, hidden)).map(
    toMenuItem
  )
}
