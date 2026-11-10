import type { ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { MenuVo } from '@/apis/system/menu'
import type { RouteHandle } from '@/router/types'
import { buildRoute, resolveViewLoader, toMenuTree } from './build-route'

const makeMenu = (
  id: number,
  path: string,
  menuName: string,
  options?: Partial<MenuVo> & { children?: MenuVo[] }
): MenuVo => ({
  id,
  parentId: options?.parentId ?? null,
  menuName,
  path,
  component: options?.component ?? 'views/dashboard/index.tsx',
  icon: options?.icon ?? 'Home',
  menuType: options?.menuType ?? (options?.children ? 0 : 1),
  perms: options?.perms ?? '',
  orderNum: options?.orderNum ?? 0,
  createTime: '2026-01-01 00:00:00',
  updateTime: '2026-01-01 00:00:00',
  children: options?.children,
})

const passthroughLoader = () => () => Promise.resolve({ default: (() => null) as ComponentType })

const fakeLoader = (component?: string | null) => {
  if (!component || component.toLowerCase().includes('layout')) return null
  return passthroughLoader()
}

describe('toMenuTree', () => {
  it('按 parentId 将扁平菜单组成树，同层重复 path 只保留首行', () => {
    const tree = toMenuTree([
      makeMenu(17, '/monitor', '系统监控'),
      makeMenu(18, '/monitor', 'monitor'),
      makeMenu(19, '/monitor/server', '服务监控', { parentId: 17 }),
      makeMenu(20, '/monitor/server', '第二份', { parentId: 17 }),
    ])

    expect(tree).toHaveLength(1)
    expect(tree[0].menuName).toBe('系统监控')
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children?.[0].menuName).toBe('服务监控')
  })

  it('parentId 为 0 或 null 都视为根节点', () => {
    const tree = toMenuTree([
      makeMenu(1, '/dashboard', '首页', { parentId: null }),
      makeMenu(2, '/order', '订单', { parentId: 0 }),
    ])
    expect(tree.map((item) => item.path)).toEqual(['/dashboard', '/order'])
  })

  it('已经带 children 的树 flatten 后再重建，结果保持嵌套', () => {
    const tree = toMenuTree([
      makeMenu(5, '/goods', '商品', {
        children: [makeMenu(6, '/goods/list', '商品列表', { parentId: 5 })],
      }),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children?.[0].path).toBe('/goods/list')
  })
})

describe('resolveViewLoader', () => {
  it('layout 组件由常驻壳承担，不解析为页面', () => {
    expect(resolveViewLoader('components/layout/index.vue')).toBeNull()
  })

  it('把 Vue 实验室路径别名到本仓库的 virtual-threads 页面', () => {
    expect(resolveViewLoader('views/lab/virtual-thread/index.vue')).toBeTypeOf('function')
    expect(resolveViewLoader('views/goods/index.vue')).toBeTypeOf('function')
  })

  it('未知组件返回 null', () => {
    expect(resolveViewLoader('views/not-exist/index.vue')).toBeNull()
  })
})

describe('buildRoute', () => {
  it('同层重复 path 只保留首行，并写出相对 path', () => {
    const routes = buildRoute(
      toMenuTree([
        makeMenu(17, '/monitor', '系统监控', { component: 'views/monitor/server/index.vue' }),
        makeMenu(18, '/monitor', 'monitor', { component: 'views/monitor/server/index.vue' }),
      ]),
      fakeLoader
    )
    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('monitor')
    expect((routes[0].handle as RouteHandle).title).toBe('系统监控')
  })

  it('子层级重复 path 同样去重，子路由 path 相对父级', () => {
    const routes = buildRoute(
      toMenuTree([
        makeMenu(14, '/order', '订单', {
          component: 'components/layout/index.vue',
          children: [
            makeMenu(16, '/order/list', '第一份', { parentId: 14 }),
            makeMenu(99, '/order/list', '第二份', { parentId: 14 }),
          ],
        }),
      ]),
      fakeLoader
    )
    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('order')
    expect(routes[0].element).toBeUndefined()
    const leaf = routes[0].children?.filter((child) => child.path)
    expect(leaf).toHaveLength(1)
    expect(leaf?.[0].path).toBe('list')
    expect((leaf?.[0].handle as RouteHandle).title).toBe('第一份')
  })

  it('为有子路由的目录补充 index 重定向到首个可见子路由', () => {
    const routes = buildRoute(
      toMenuTree([
        makeMenu(5, '/goods', '商品', {
          component: 'components/layout/index.vue',
          children: [makeMenu(6, '/goods/list', '商品列表', { parentId: 5 })],
        }),
      ]),
      fakeLoader
    )
    const indexRoute = routes[0].children?.find((child) => child.index)
    expect(indexRoute).toBeTruthy()
    expect((indexRoute?.handle as RouteHandle).hidden).toBe(true)
  })

  it('缺失组件且无子路由时跳过该节点', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const routes = buildRoute(
      [makeMenu(8, '/ghost', '幽灵页', { component: 'views/missing/index.vue' })],
      () => null
    )
    expect(routes).toHaveLength(0)
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
