import type { RouteObject } from 'react-router-dom'
import { LAYOUT_ROUTE_ID } from './constants'

export interface RoutePatch {
  routeId: string
  children: RouteObject[]
}

const fullPath = (parent: string, path: string) =>
  path.startsWith('/') ? path : `${parent}/${path}`

/** 保留常驻路由；同名目录的新子页 patch 到原目录，不能整组丢弃或重复加父目录。 */
export const getDynamicRoutePatches = (
  dynamicRoutes: RouteObject[],
  residentRoutes: RouteObject[]
): RoutePatch[] => {
  const residentPaths = new Set<string>()
  const residentParents: { path: string; id: string }[] = []
  const collect = (routes: RouteObject[], parent = '') => {
    for (const route of routes) {
      if (!route.path) continue
      const path = fullPath(parent, route.path)
      residentPaths.add(path)
      if (route.children && route.id) residentParents.push({ path, id: route.id })
      if (route.children) collect(route.children, path)
    }
  }
  collect(residentRoutes)
  residentParents.sort((first, second) => second.path.length - first.path.length)

  const patches: RoutePatch[] = []
  const addPatch = (routeId: string, children: RouteObject[]) => {
    if (!children.length) return
    const existing = patches.find((patch) => patch.routeId === routeId)
    if (existing) existing.children.push(...children)
    else patches.push({ routeId, children })
  }
  const walk = (dynamic: RouteObject[], resident: RouteObject[], routeId: string, parent = '') => {
    const children: RouteObject[] = []
    for (const route of dynamic) {
      const path = route.path ? fullPath(parent, route.path) : parent
      const existing = resident.find(
        (item) => item.path === route.path && !!item.index === !!route.index
      )
      if (existing?.children && route.children) {
        if (!existing.id) throw new Error(`常驻目录 ${path} 缺少 route id`)
        walk(route.children, existing.children, existing.id, path)
      } else if (!residentPaths.has(path) && !existing) {
        const parentRoute = residentParents.find((item) => path.startsWith(`${item.path}/`))
        if (parentRoute && parentRoute.id !== routeId) {
          addPatch(parentRoute.id, [{ ...route, path: path.slice(parentRoute.path.length + 1) }])
        } else children.push(route)
      }
    }
    addPatch(routeId, children)
  }
  walk(dynamicRoutes, residentRoutes, LAYOUT_ROUTE_ID)
  return patches.length ? patches : [{ routeId: LAYOUT_ROUTE_ID, children: [] }]
}
