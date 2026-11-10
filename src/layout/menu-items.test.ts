import { describe, expect, it, vi } from 'vitest'
import type { ItemType } from 'antd/es/menu/interface'
import type { MenuVo } from '@/apis/system/menu'
import { staticLayoutRoutes } from '@/router/static-routes'
import { buildMenuItems } from './menu-items'

vi.mock('@/utils/route-icons', () => ({ getMenuIcon: (name?: string) => name }))

const menu = (id: number, path: string, children?: MenuVo[]): MenuVo => ({
  id,
  parentId: null,
  path,
  menuName: path,
  component: 'views/monitor/server/index.vue',
  icon: '',
  menuType: children ? 0 : 1,
  perms: '',
  orderNum: 0,
  createTime: '',
  updateTime: '',
  children,
})

const keys = (items: ItemType[]): string[] =>
  items.flatMap((item) => {
    if (!item || !('key' in item)) return []
    return [String(item.key), ...('children' in item ? keys(item.children ?? []) : [])]
  })

describe('常驻模块与后端菜单合并', () => {
  it('即使 getRoutes 没有返回系统模块，也按 Vue 展示两个模块和六个子页', () => {
    const paths = keys(buildMenuItems(staticLayoutRoutes, [], []))
    expect(paths).toEqual([
      '/dashboard',
      '/system',
      '/system/menu',
      '/system/user',
      '/system/role',
      '/system/data-dictionary',
      '/monitor',
      '/monitor/server',
      '/monitor/report',
    ])
    expect(paths).not.toContain('/goods')
  })

  it('同名目录和子页只出现一次，后台新增子页与常驻子页都保留', () => {
    const items = buildMenuItems(
      staticLayoutRoutes,
      [menu(17, '/monitor', [menu(18, '/monitor/server'), menu(19, '/monitor/live')])],
      []
    )
    const paths = keys(items)
    expect(paths.filter((path) => path === '/monitor')).toHaveLength(1)
    expect(paths.filter((path) => path === '/monitor/server')).toHaveLength(1)
    expect(paths).toContain('/monitor/report')
    expect(paths).toContain('/monitor/live')
    const monitor = items.find((item) => item && item.key === '/monitor')
    expect(monitor && 'label' in monitor && monitor.label).toBe('系统监控')
  })

  it('后端空目录不会顶替常驻模块，隐藏页仍然隐藏，其他业务菜单继续来自后端', () => {
    const paths = keys(
      buildMenuItems(
        staticLayoutRoutes,
        [
          menu(17, '/monitor'),
          menu(5, '/goods', [menu(6, '/goods/list')]),
          menu(7, '/dashboard'),
          menu(8, '/user/info'),
          menu(9, '/password'),
        ],
        ['*:*:*']
      )
    )
    expect(paths.filter((path) => path === '/dashboard')).toHaveLength(1)
    expect(paths).toContain('/monitor/server')
    expect(paths).toContain('/monitor/report')
    expect(paths).toContain('/goods/list')
    expect(paths).not.toContain('/user/info')
    expect(paths).not.toContain('/password')
  })

  it('后端平铺返回的子页也合并到常驻目录，已有子页不产生第二个入口', () => {
    const items = buildMenuItems(
      staticLayoutRoutes,
      [menu(1, '/system/user'), menu(2, '/monitor/live')],
      []
    )
    expect(keys(items).filter((path) => path === '/system/user')).toHaveLength(1)
    expect(items.some((item) => item && item.key === '/system/user')).toBe(false)
    const monitor = items.find((item) => item && item.key === '/monitor')
    expect(monitor && 'children' in monitor && keys(monitor.children ?? [])).toContain(
      '/monitor/live'
    )
  })
})
