import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MenuVo } from '@/apis/system/menu'
import { useSystemStore } from '@/store'

vi.mock('@/apis/system/menu', () => ({
  getRoutes: vi.fn(),
}))

import { getRoutes } from '@/apis/system/menu'
import { LAYOUT_ROUTE_ID } from './constants'
import type { AppRouter } from './instance'
import { ensureDynamicRoutes, resetDynamicRoutes } from './ensure-dynamic-routes'

const makeMenu = (
  id: number,
  parentId: number | null,
  path: string,
  menuName: string,
  component: string,
  children?: MenuVo[]
): MenuVo => ({
  id,
  parentId,
  menuName,
  path,
  component,
  icon: 'Home',
  menuType: children ? 0 : 1,
  perms: '',
  orderNum: 0,
  createTime: '2026-01-01 00:00:00',
  updateTime: '2026-01-01 00:00:00',
  children,
})

describe('ensureDynamicRoutes', () => {
  let router: AppRouter
  beforeEach(() => {
    router = { patchRoutes: vi.fn() } as unknown as AppRouter
    resetDynamicRoutes()
    vi.mocked(getRoutes).mockReset()
  })

  it('已注册时立即返回，不再请求接口或 patch', async () => {
    vi.mocked(getRoutes).mockResolvedValue([])
    const patch = vi.fn()
    await ensureDynamicRoutes({ router, patch })
    await ensureDynamicRoutes({ router, patch })
    expect(getRoutes).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledTimes(1)
  })

  it('拉取菜单后 patch 到 layout 父路由并标记 hasAddedRoutes', async () => {
    vi.mocked(getRoutes).mockResolvedValue([
      makeMenu(5, null, '/goods', '商品', 'components/layout/index.vue', [
        makeMenu(6, 5, '/goods/list', '商品列表', 'views/goods/index.vue'),
      ]),
    ])
    const patch = vi.fn()
    await ensureDynamicRoutes({ router, patch })
    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch.mock.calls[0][0]).toBe(LAYOUT_ROUTE_ID)
    const children = patch.mock.calls[0][1]
    expect(children[0].path).toBe('goods')
    expect(useSystemStore.getState().hasAddedRoutes).toBe(true)
    expect(useSystemStore.getState().routes[0].path).toBe('/goods')
  })

  it('不重复 patch 已存在的静态壳路由（如 dashboard）', async () => {
    vi.mocked(getRoutes).mockResolvedValue([
      makeMenu(1, null, '/dashboard', '首页工作台', 'views/dashboard/index.vue'),
      makeMenu(5, null, '/goods', '商品', 'components/layout/index.vue', [
        makeMenu(6, 5, '/goods/list', '商品列表', 'views/goods/index.vue'),
      ]),
    ])
    const patch = vi.fn()
    await ensureDynamicRoutes({ router, patch })
    const children = patch.mock.calls[0][1] as Array<{ path?: string }>
    expect(children.map((child) => child.path)).toEqual(['goods'])
  })

  it('后端新增监控子页挂到常驻目录，已有子页不重复注册', async () => {
    vi.mocked(getRoutes).mockResolvedValue([
      makeMenu(17, null, '/monitor', '系统监控', 'components/layout/index.vue', [
        makeMenu(18, 17, '/monitor/server', '服务监控', 'views/monitor/server/index.vue'),
        makeMenu(19, 17, '/monitor/history', '历史监控', 'views/monitor/report/index.vue'),
      ]),
    ])
    const patch = vi.fn()
    await ensureDynamicRoutes({ router, patch })
    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch.mock.calls[0][0]).toBe('static-monitor')
    expect(patch.mock.calls[0][1].map((route: { path?: string }) => route.path)).toEqual([
      'history',
    ])
  })

  it('并发调用共享同一次请求，只 patch 一次', async () => {
    let resolveApi: ((value: MenuVo[]) => void) | undefined
    vi.mocked(getRoutes).mockImplementation(
      () =>
        new Promise<MenuVo[]>((resolve) => {
          resolveApi = resolve
        })
    )
    const patch = vi.fn()
    const first = ensureDynamicRoutes({ router, patch })
    const second = ensureDynamicRoutes({ router, patch })
    resolveApi?.([])
    await Promise.all([first, second])
    expect(getRoutes).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledTimes(1)
  })

  it('接口失败时不标记已注册，允许后续重试', async () => {
    vi.mocked(getRoutes).mockRejectedValueOnce(new Error('network')).mockResolvedValue([])
    const patch = vi.fn()
    await expect(ensureDynamicRoutes({ router, patch })).rejects.toThrow('network')
    expect(patch).not.toHaveBeenCalled()
    expect(useSystemStore.getState().hasAddedRoutes).toBe(false)
    await ensureDynamicRoutes({ router, patch })
    expect(getRoutes).toHaveBeenCalledTimes(2)
    expect(patch).toHaveBeenCalledTimes(1)
  })

  it('reset 后可以再次 ensure', async () => {
    vi.mocked(getRoutes).mockResolvedValue([])
    const patch = vi.fn()
    await ensureDynamicRoutes({ router, patch })
    resetDynamicRoutes()
    expect(useSystemStore.getState().hasAddedRoutes).toBe(false)
    expect(useSystemStore.getState().routes).toEqual([])
    await ensureDynamicRoutes({ router, patch })
    expect(getRoutes).toHaveBeenCalledTimes(2)
    expect(patch).toHaveBeenCalledTimes(2)
  })

  it('取消的导航不能吞掉同一 router 上其他调用的注册', async () => {
    let resolveApi!: (menus: MenuVo[]) => void
    vi.mocked(getRoutes).mockReturnValue(
      new Promise((resolve) => {
        resolveApi = resolve
      })
    )
    const controller = new AbortController()
    const cancelledPatch = vi.fn()
    const first = ensureDynamicRoutes({ router, patch: cancelledPatch, signal: controller.signal })
    const second = ensureDynamicRoutes({ router })
    controller.abort()
    resolveApi([])
    await Promise.all([first, second])
    expect(cancelledPatch).not.toHaveBeenCalled()
    expect(router.patchRoutes).toHaveBeenCalledTimes(1)
    expect(useSystemStore.getState().hasAddedRoutes).toBe(true)
    expect(getRoutes).toHaveBeenCalledTimes(1)
  })

  it('仅有取消的导航时不能设置已注册标记，下一次仍可使用缓存注册', async () => {
    vi.mocked(getRoutes).mockResolvedValue([])
    const controller = new AbortController()
    const first = ensureDynamicRoutes({ router, signal: controller.signal })
    controller.abort()
    await first
    expect(router.patchRoutes).not.toHaveBeenCalled()
    expect(useSystemStore.getState().hasAddedRoutes).toBe(false)
    await ensureDynamicRoutes({ router })
    expect(router.patchRoutes).toHaveBeenCalledTimes(1)
    expect(getRoutes).toHaveBeenCalledTimes(1)
  })

  it('旧会话的菜单响应晚到时不能污染新会话', async () => {
    let resolveOld!: (menus: MenuVo[]) => void
    vi.mocked(getRoutes)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve
        })
      )
      .mockResolvedValueOnce([])
    const old = ensureDynamicRoutes({ router })
    resetDynamicRoutes()
    const next = { patchRoutes: vi.fn() } as unknown as AppRouter
    await ensureDynamicRoutes({ router: next })
    resolveOld([makeMenu(5, null, '/goods', '商品', 'views/goods/index.vue')])
    await old
    expect(router.patchRoutes).not.toHaveBeenCalled()
    expect(next.patchRoutes).toHaveBeenCalledTimes(1)
    expect(useSystemStore.getState().routes).toEqual([])
  })

  it('全局标记为 true 也不能阻止新实例注册', async () => {
    useSystemStore.getState().setHasAddedRoutes(true)
    vi.mocked(getRoutes).mockResolvedValue([])
    await ensureDynamicRoutes({ router })
    expect(router.patchRoutes).toHaveBeenCalledTimes(1)
  })

  it('菜单状态不包含无页面的空目录和未知组件', async () => {
    vi.mocked(getRoutes).mockResolvedValue([
      makeMenu(17, null, '/monitor', '系统监控', 'components/layout/index.vue'),
      makeMenu(5, null, '/goods', '商品', 'views/goods/index.vue'),
    ])
    await ensureDynamicRoutes({ router })
    expect(useSystemStore.getState().routes.map((menu) => menu.path)).toEqual(['/goods'])
  })

  it('优先把动态路由写到传入的 router，而不是单例上的那一份', async () => {
    vi.mocked(getRoutes).mockResolvedValue([
      makeMenu(5, null, '/goods', '商品', 'components/layout/index.vue', [
        makeMenu(6, 5, '/goods/list', '商品列表', 'views/goods/index.vue'),
      ]),
    ])
    const singleton = { patchRoutes: vi.fn() }
    const kept = { patchRoutes: vi.fn() }
    const { setCurrentRouter } = await import('./instance')
    setCurrentRouter(singleton as never)
    await ensureDynamicRoutes({ router: kept as never })
    expect(kept.patchRoutes).toHaveBeenCalledTimes(1)
    expect(singleton.patchRoutes).not.toHaveBeenCalled()
    expect(kept.patchRoutes.mock.calls[0][0]).toBe(LAYOUT_ROUTE_ID)
  })
})
