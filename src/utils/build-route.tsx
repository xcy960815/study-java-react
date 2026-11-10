import { lazy, type ComponentType } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import type { MenuVo } from '@/apis/system/menu'
import type { RouteHandle } from '@/router/types'

/** Vue 组件路径与本仓库实际文件不一致时的别名 */
const COMPONENT_ALIASES: Record<string, string> = {
  'views/lab/virtual-thread/index.vue': 'views/lab/virtual-threads/index.tsx',
  'views/lab/virtual-thread/index.tsx': 'views/lab/virtual-threads/index.tsx',
}

const viewModules = import.meta.glob<{ default: ComponentType }>(['../views/**/*.tsx'])

/** 把 glob key（../views/foo.tsx 或 /src/views/foo.tsx）收成 views/foo.tsx */
const toViewPath = (key: string) => {
  const unix = key.replace(/\\/g, '/')
  const srcIndex = unix.lastIndexOf('/src/')
  if (srcIndex >= 0) return unix.slice(srcIndex + '/src/'.length)
  const viewsIndex = unix.indexOf('views/')
  if (viewsIndex >= 0) return unix.slice(viewsIndex)
  return unix.replace(/^\.\//, '')
}

const moduleByViewPath = Object.fromEntries(
  Object.entries(viewModules).map(([key, loader]) => [toViewPath(key), loader])
)

const isLayoutComponent = (component?: string | null) =>
  !!component && component.toLowerCase().includes('layout')

const normalizeViewPath = (component: string) => {
  const aliased = COMPONENT_ALIASES[component] ?? component
  return aliased
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^src\//, '')
    .replace(/\.vue$/i, '.tsx')
}

/**
 * 根据后端 component 字段解析页面加载器。
 * layout 组件由常驻 MainLayout 承担，这里返回 null。
 */
export const resolveViewLoader = (component?: string | null) => {
  if (!component || isLayoutComponent(component)) return null
  const normalized = normalizeViewPath(component)
  const candidates = [normalized]
  if (!normalized.endsWith('/index.tsx') && normalized.endsWith('.tsx')) {
    candidates.push(normalized.replace(/\.tsx$/, '/index.tsx'))
  }
  for (const candidate of candidates) {
    const loader = moduleByViewPath[candidate]
    if (loader) return loader
  }
  return null
}

const isRootParentId = (parentId: number | null | undefined) => parentId == null || parentId === 0

const flattenMenus = (menus: MenuVo[], acc: MenuVo[] = []): MenuVo[] => {
  for (const menu of menus) {
    const { children, ...rest } = menu
    acc.push(rest)
    if (children?.length) {
      flattenMenus(children, acc)
    }
  }
  return acc
}

const uniqueByPath = (menus: MenuVo[]): MenuVo[] => {
  const unique: MenuVo[] = []
  for (const menu of menus) {
    if (!menu.path) continue
    if (unique.some((item) => item.path === menu.path)) continue
    unique.push(menu)
  }
  return unique
}

/**
 * 将 getRoutes 返回的扁平（或已成树）菜单按 parentId 组成树，同层重复 path 只保留首行。
 */
export const toMenuTree = (menus: MenuVo[]): MenuVo[] => {
  const flat = flattenMenus(menus)
  const nodes = new Map<number, MenuVo>()
  for (const menu of flat) {
    if (nodes.has(menu.id)) continue
    nodes.set(menu.id, { ...menu, children: [] })
  }

  const roots: MenuVo[] = []
  for (const node of nodes.values()) {
    const parentId = node.parentId
    if (!isRootParentId(parentId) && parentId != null && nodes.has(parentId)) {
      const parent = nodes.get(parentId)!
      parent.children = parent.children ?? []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const trimEmptyChildren = (items: MenuVo[]): MenuVo[] =>
    uniqueByPath(items).map((item) => {
      const children = item.children?.length ? trimEmptyChildren(item.children) : undefined
      return { ...item, children }
    })

  return trimEmptyChildren(roots)
}

const toRelativePath = (path: string, parentPath?: string) => {
  const absolute = path.startsWith('/') ? path : `/${path}`
  if (!parentPath) return absolute.replace(/^\//, '')
  const parent = parentPath.startsWith('/') ? parentPath : `/${parentPath}`
  if (absolute === parent) return ''
  if (absolute.startsWith(`${parent}/`)) return absolute.slice(parent.length + 1)
  return absolute.replace(/^\//, '')
}

export type ComponentLoader = (
  component?: string | null
) => (() => Promise<{ default: ComponentType }>) | null

/** 菜单只展示可以进入的页面或包含可用页面的目录，与实际注册结果保持一致。 */
export const filterRoutableMenus = (
  menus: MenuVo[],
  resolveLoader: ComponentLoader = resolveViewLoader
): MenuVo[] =>
  menus.flatMap((menu) => {
    const children = menu.children?.length
      ? filterRoutableMenus(menu.children, resolveLoader)
      : undefined
    if (!menu.path || (!resolveLoader(menu.component) && !children?.length)) return []
    return [{ ...menu, children }]
  })

/**
 * 将后端菜单树构建为挂到常驻 layout 下的 React Router children。
 * layout 组件不重复包一层壳；缺失的页面组件会被跳过。
 */
export const buildRoute = (
  voRoutes: MenuVo[],
  resolveLoader: ComponentLoader = resolveViewLoader,
  parentPath?: string
): RouteObject[] => {
  const uniqueRoutes = uniqueByPath(voRoutes)
  const routes: RouteObject[] = []

  for (const voRoute of uniqueRoutes) {
    if (!voRoute.path) continue
    const hasChildren = Array.isArray(voRoute.children) && voRoute.children.length > 0
    const childRoutes = hasChildren
      ? buildRoute(voRoute.children!, resolveLoader, voRoute.path)
      : []
    const loader = resolveLoader(voRoute.component)
    const relativePath = toRelativePath(voRoute.path, parentPath)
    const handle: RouteHandle = {
      title: voRoute.menuName,
      icon: voRoute.icon || undefined,
    }

    if (!loader && childRoutes.length === 0) {
      if (!isLayoutComponent(voRoute.component)) {
        console.error(`[buildRoute] 组件 ${voRoute.component ?? ''} 不存在，已跳过 ${voRoute.path}`)
      }
      continue
    }

    const route: RouteObject = {
      path: relativePath,
      handle,
    }

    if (loader) {
      const Page = lazy(loader)
      route.element = <Page />
    }

    if (childRoutes.length > 0) {
      const firstChild = childRoutes.find(
        (child) => child.path && !(child.handle as RouteHandle | undefined)?.hidden
      )
      if (firstChild?.path) {
        childRoutes.push({
          index: true,
          element: <Navigate to={firstChild.path} replace />,
          handle: { hidden: true },
        })
      }
      route.children = childRoutes
    }

    routes.push(route)
  }

  return routes
}
