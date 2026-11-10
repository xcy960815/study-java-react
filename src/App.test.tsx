import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Outlet, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getRouter, type AppRouter } from './router/instance'
import { createAppRouter } from './router'
import { resetDynamicRoutes } from './router/ensure-dynamic-routes'
import { eventEmitter } from './utils/event-emits'
import { clearAuthTokens, setToken } from './utils/token'
import { getRoutes, type MenuVo } from '@/apis/system/menu'
import { useLoginStore } from './store/modules/login'

vi.mock('@/apis/system/menu', () => ({ getRoutes: vi.fn(async () => []) }))
vi.mock('@/layout/index', () => ({ default: () => <Outlet /> }))
vi.mock('@/router/route-tab-sync', () => ({ RouteTabMetaSync: () => null }))
vi.mock('@/router/static-routes', () => ({
  staticLayoutRoutes: [{ path: 'dashboard', element: <p>dashboard page</p> }],
}))
vi.mock('@/views/login', () => ({
  default: function LoginPage() {
    const location = useLocation()
    return <p>login page:{JSON.stringify(location.state)}</p>
  },
}))
vi.mock('@/views/error/not-found', () => ({ default: () => <p>404 page</p> }))
vi.mock('@/views/goods/index', () => ({ default: () => <p>goods page</p> }))

let container: HTMLElement

const mountApp = async (router: AppRouter) => {
  await act(async () => {
    container = render(
      <StrictMode>
        <App initialRouter={router} />
      </StrictMode>
    ).container
  })
}

beforeEach(() => {
  resetDynamicRoutes()
  useLoginStore.getState().resetUser()
  vi.mocked(getRoutes).mockReset().mockResolvedValue([])
  localStorage.clear()
  setToken('test-token')
  window.history.replaceState(null, '', '/missing')
})

afterEach(() => {
  cleanup()
  getRouter().dispose()
  localStorage.clear()
  resetDynamicRoutes()
})

describe('App 的 router 生命周期', () => {
  it('StrictMode 下 token 失效后应真正显示新 router 的登录页', async () => {
    const router = createAppRouter()
    await mountApp(router)
    expect(container.textContent).toContain('404 page')
    useLoginStore.setState({
      user: { nickName: 'old', loginName: 'old', introduceSign: '', address: '' },
      userLoaded: true,
    })
    await act(async () => {
      clearAuthTokens()
      eventEmitter.emit('token-invalid')
    })
    expect(window.location.pathname).toBe('/login')
    expect(container.textContent).toContain('login page')
    expect(useLoginStore.getState().user).toBeNull()
    expect(getRouter()).not.toBe(router)
    await act(async () => {
      setToken('next-token')
      eventEmitter.emit('login')
      await getRouter().navigate('/dashboard')
    })
    expect(container.textContent).toContain('dashboard page')
    expect(getRoutes).toHaveBeenCalledTimes(2)
  })

  it('未登录的业务深链跳转登录，并保留查询串和 hash', async () => {
    clearAuthTokens()
    window.history.replaceState(null, '', '/goods/list?category=1#stock')
    const router = createAppRouter()
    await mountApp(router)
    expect(container.textContent).toContain('login page')
    expect(container.textContent).toContain('/goods/list?category=1#stock')
    expect(getRoutes).not.toHaveBeenCalled()
  })

  it('静态工作台的菜单请求失败后，可以在当前页面重试恢复', async () => {
    window.history.replaceState(null, '', '/dashboard')
    vi.mocked(getRoutes).mockRejectedValueOnce(new Error('network')).mockResolvedValue([])
    const router = createAppRouter()
    await mountApp(router)
    expect(container.textContent).toContain('dashboard page')
    expect(screen.getByText('菜单加载失败')).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    })
    expect(screen.queryByText('菜单加载失败')).toBeNull()
    expect(getRoutes).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('dashboard page')
  })

  it('StrictMode 的重复 effect 不会重复注册，登出后动态路由表被丢弃', async () => {
    const goods: MenuVo = {
      id: 5,
      parentId: null,
      path: '/goods/list',
      menuName: '商品列表',
      component: 'views/goods/index.vue',
      icon: '',
      menuType: 1,
      perms: '',
      orderNum: 0,
      createTime: '',
      updateTime: '',
    }
    vi.mocked(getRoutes).mockResolvedValue([goods])
    window.history.replaceState(null, '', '/dashboard')
    const router = createAppRouter()
    const patch = vi.spyOn(router, 'patchRoutes')
    await mountApp(router)
    expect(getRouter()).toBe(router)
    expect(patch).toHaveBeenCalledTimes(1)
    await act(async () => {
      await router.navigate('/goods/list')
    })
    expect(container.textContent).toContain('goods page')
    await act(async () => {
      clearAuthTokens()
      eventEmitter.emit('logout')
    })
    expect(container.textContent).toContain('login page')
    expect(
      getRouter().routes[0].children?.find((route) => route.id === 'layout')?.children
    ).toHaveLength(1)
  })
})
