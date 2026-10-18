import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { RouteTabMetaSync } from './route-tab-sync'

const routes = [
  {
    element: <RouteTabMetaSync />,
    children: [
      {
        path: '/login',
        handle: { icon: 'Login', title: '登录', hidden: true },
        element: <span>login</span>,
      },
      {
        path: '/home',
        handle: { icon: 'Home', title: '首页工作台' },
        element: <span>home</span>,
      },
      {
        path: '/plain',
        element: <span>plain</span>,
      },
    ],
  },
]

const mountRouterShell = (
  initialPath: string
): { router: ReturnType<typeof createMemoryRouter>; cleanup: () => void } => {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root: Root = createRoot(host)

  act(() => {
    root.render(<RouterProvider router={router} />)
  })

  return {
    router,
    cleanup: () => {
      act(() => {
        root.unmount()
      })
      host.remove()
    },
  }
}

const readTabState = () => ({
  title: document.title,
  iconLinks: [...document.querySelectorAll("link[rel*='icon']")].map(
    (link) => (link as HTMLLinkElement).rel
  ),
  iconHref: (document.querySelector("link[rel*='icon']") as HTMLLinkElement | null)?.href ?? '',
})

describe('RouteTabMetaSync', () => {
  beforeEach(() => {
    document.title = 'study-java-react'
    document.querySelectorAll("link[rel*='icon']").forEach((link) => link.remove())
  })

  it('首屏路由（无 subscribe 通知窗口）也会同步 title 与 favicon', () => {
    const shell = mountRouterShell('/login')

    const state = readTabState()
    expect(state.title).toBe('登录 - Study Java React')
    expect(state.iconLinks).toContain('shortcut icon')
    expect(state.iconHref.startsWith('data:image/svg+xml;base64,')).toBe(true)

    shell.cleanup()
  })

  it('跨路由切换跟随 handle 更新标题与图标', () => {
    const shell = mountRouterShell('/login')

    act(() => {
      shell.router
        .navigate('/home')
        .then(() => undefined)
        .catch(() => undefined)
    })

    const state = readTabState()
    expect(state.title).toBe('首页工作台 - Study Java React')
    expect(state.iconHref.startsWith('data:image/svg+xml;base64,')).toBe(true)

    shell.cleanup()
  })

  it('叶子路由无 handle.icon 时 favicon 保持不变并以应用名作为标题', () => {
    // 预置一个哨兵 favicon，断言未被任何后续解析覆盖
    const sentinel = document.createElement('link')
    sentinel.rel = 'shortcut icon'
    sentinel.href = 'data:image/svg+xml;base64,SENTINELPLIER'
    document.head.appendChild(sentinel)

    const shell = mountRouterShell('/plain')

    const state = readTabState()
    expect(state.title).toBe('Study Java React')
    expect(state.iconLinks).toContain('shortcut icon')
    expect((document.querySelector("link[rel*='icon']") as HTMLLinkElement).href).toContain(
      'SENTINELPLIER'
    )

    shell.cleanup()
  })

  it('注册表未收录的 handle.icon 同样不切换 favicon', () => {
    const sentinel = document.createElement('link')
    sentinel.rel = 'shortcut icon'
    sentinel.href = 'data:image/svg+xml;base64,SENTINELPLIER'
    document.head.appendChild(sentinel)

    const shell = mountRouterShell('/ghost-name')

    const state = readTabState()
    expect(state.iconLinks).toContain('shortcut icon')
    expect((document.querySelector("link[rel*='icon']") as HTMLLinkElement).href).toContain(
      'SENTINELPLIER'
    )

    shell.cleanup()
  })
})
