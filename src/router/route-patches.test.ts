import { createMemoryRouter, matchRoutes, type RouteObject } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LAYOUT_ROUTE_ID } from './constants'
import { staticLayoutRoutes } from './static-routes'
import { getDynamicRoutePatches } from './route-patches'

describe('常驻目录的动态子路由', () => {
  it('重复页面不再添加，新增子页 patch 到原来的目录，不能整组丢弃', () => {
    const dynamic: RouteObject[] = [
      { path: 'monitor', children: [{ path: 'server' }, { path: 'live' }, { index: true }] },
      { path: 'system', children: [{ path: 'user' }, { path: 'audit' }] },
      { path: 'goods', children: [{ path: 'list' }] },
    ]
    const router = createMemoryRouter([
      { id: LAYOUT_ROUTE_ID, path: '/', children: staticLayoutRoutes },
    ])
    try {
      const patches = getDynamicRoutePatches(dynamic, staticLayoutRoutes)
      expect(patches).toEqual([
        { routeId: 'static-monitor', children: [{ path: 'live' }] },
        { routeId: 'static-system', children: [{ path: 'audit' }] },
        { routeId: LAYOUT_ROUTE_ID, children: [dynamic[2]] },
      ])
      patches.forEach(({ routeId, children }) => router.patchRoutes(routeId, children))
      for (const path of [
        '/monitor/server',
        '/monitor/report',
        '/monitor/live',
        '/system/user',
        '/system/audit',
        '/goods/list',
      ]) {
        expect(matchRoutes(router.routes, path), path).not.toBeNull()
      }
      const monitor = router.routes[0].children?.filter((route) => route.path === 'monitor')
      expect(monitor).toHaveLength(1)
      expect(monitor?.[0].children?.filter((route) => route.path === 'server')).toHaveLength(1)
      expect(monitor?.[0].children?.filter((route) => route.index)).toHaveLength(1)
    } finally {
      router.dispose()
    }
  })

  it('平铺返回的常驻子页同样不能重复 patch', () => {
    expect(
      getDynamicRoutePatches(
        [{ path: 'system/user' }, { path: 'monitor/server' }, { path: 'dashboard' }],
        staticLayoutRoutes
      )
    ).toEqual([{ routeId: LAYOUT_ROUTE_ID, children: [] }])
  })

  it('平铺返回的新子页也挂到常驻目录，并转换为相对路径', () => {
    expect(
      getDynamicRoutePatches(
        [{ path: 'monitor/live' }, { path: 'system/audit' }],
        staticLayoutRoutes
      )
    ).toEqual([
      { routeId: 'static-monitor', children: [{ path: 'live' }] },
      { routeId: 'static-system', children: [{ path: 'audit' }] },
    ])
  })
})
