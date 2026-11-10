import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MenuVo } from '@/apis/system/menu'

vi.mock('@/apis/system/menu', () => ({
  getRoutes: vi.fn(),
}))

vi.mock('@/utils/token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/token')>()
  return { ...actual, getToken: vi.fn(() => 'test-token') }
})

import { getRoutes } from '@/apis/system/menu'
import { CATCHALL_ROUTE_ID, createAppRouter, getRouter, setCurrentRouter } from '@/router'
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

const lastRouteId = (router: ReturnType<typeof createAppRouter>) =>
  router.state.matches[router.state.matches.length - 1]?.route.id

const routers: ReturnType<typeof createAppRouter>[] = []
const makeRouter = () => {
  const router = createAppRouter()
  routers.push(router)
  return router
}

describe('动态路由的实例隔离和导航发现', () => {
  beforeEach(() => {
    resetDynamicRoutes()
    window.history.replaceState(null, '', '/dashboard')
    vi.mocked(getRoutes).mockReset()
    vi.mocked(getRoutes).mockResolvedValue([
      makeMenu(5, null, '/goods', '商品', 'components/layout/index.vue', [
        makeMenu(6, 5, '/goods/list', '商品列表', 'views/goods/index.vue'),
      ]),
    ])
  })

  afterEach(() => {
    routers.splice(0).forEach((router) => router.dispose())
    window.history.replaceState(null, '', '/')
  })

  it('传入实际持有的 router 后，业务页可以匹配而不是落到 404', async () => {
    const kept = makeRouter()
    setCurrentRouter(makeRouter()) // 即使观察单例指向其他实例，也不会影响显式注册。
    await ensureDynamicRoutes({ router: kept })
    await kept.navigate('/goods/list')
    expect(kept.state.location.pathname).toBe('/goods/list')
    expect(lastRouteId(kept)).not.toBe(CATCHALL_ROUTE_ID)
  })

  it('创建候选 router 不会擅自替换当前 Provider 的观察单例', () => {
    const kept = makeRouter()
    setCurrentRouter(kept)
    makeRouter()
    expect(getRouter()).toBe(kept)
  })

  it('首次打开业务深链时，导航钩子本身就应完成注册', async () => {
    window.history.replaceState(null, '', '/goods/list?source=refresh')
    const router = makeRouter()
    try {
      await vi.waitFor(() => expect(router.state.initialized).toBe(true))
      expect(lastRouteId(router)).not.toBe(CATCHALL_ROUTE_ID)
    } finally {
      router.dispose()
      window.history.replaceState(null, '', '/')
    }
  })

  it('并发注册不同 router 时，每个实例都应拿到业务路由', async () => {
    window.history.replaceState(null, '', '/dashboard')
    const first = makeRouter()
    const second = makeRouter()
    try {
      await Promise.all([
        ensureDynamicRoutes({ router: first }),
        ensureDynamicRoutes({ router: second }),
      ])
      await second.navigate('/goods/list')
      expect(lastRouteId(second)).not.toBe(CATCHALL_ROUTE_ID)
    } finally {
      first.dispose()
      second.dispose()
      window.history.replaceState(null, '', '/')
    }
  })

  it('导航被取消后，后一次深链导航仍会注册并匹配页面', async () => {
    let resolveApi!: (menus: MenuVo[]) => void
    const menus = await getRoutes()
    vi.mocked(getRoutes)
      .mockClear()
      .mockReturnValue(
        new Promise((resolve) => {
          resolveApi = resolve
        })
      )
    const router = makeRouter()
    const first = router.navigate('/goods/list?first=1')
    await vi.waitFor(() => expect(getRoutes).toHaveBeenCalledTimes(1))
    const second = router.navigate('/goods/list?second=1')
    resolveApi(menus)
    await Promise.all([first, second])
    expect(lastRouteId(router)).not.toBe(CATCHALL_ROUTE_ID)
    expect(router.state.location.search).toBe('?second=1')
    expect(getRoutes).toHaveBeenCalledTimes(1)
  })

  it('菜单请求失败进入可重试错误状态，重试后能进入深链', async () => {
    vi.mocked(getRoutes).mockRejectedValueOnce(new Error('network'))
    const router = makeRouter()
    await router.navigate('/goods/list')
    expect(router.state.errors).not.toBeNull()
    expect(lastRouteId(router)).not.toBe(CATCHALL_ROUTE_ID)
    await router.navigate('/goods/list')
    expect(router.state.errors).toBeNull()
    expect(lastRouteId(router)).not.toBe(CATCHALL_ROUTE_ID)
  })

  it('注册成功后仍未知的地址才进入 catch-all', async () => {
    const router = makeRouter()
    await router.navigate('/not-permitted')
    expect(lastRouteId(router)).toBe(CATCHALL_ROUTE_ID)
    expect(getRoutes).toHaveBeenCalledTimes(1)
  })

  it.each([
    '/system/menu',
    '/system/user',
    '/system/role',
    '/system/data-dictionary',
    '/monitor/server',
    '/monitor/report',
  ])('常驻页面 %s 不依赖 getRoutes 就可以匹配', async (path) => {
    vi.mocked(getRoutes).mockRejectedValue(new Error('menu API unavailable'))
    const router = makeRouter()
    await router.navigate(path)
    expect(lastRouteId(router)).not.toBe(CATCHALL_ROUTE_ID)
    expect(router.state.matches.some((match) => match.route.id === 'layout')).toBe(true)
    expect(getRoutes).not.toHaveBeenCalled()
  })
})
