import { create } from 'zustand'
import type { MenuVo } from '@/apis/system/menu'

interface SystemState {
  /** 当前会话已有路由注册成功（仅供 UI 展示，不能替代每个 router 的注册判断） */
  hasAddedRoutes: boolean
  /** 后端路由树（已组树并剔除空目录和缺失组件），用于侧栏菜单 */
  routes: MenuVo[]
  setHasAddedRoutes: (flag: boolean) => void
  setRoutes: (routes: MenuVo[]) => void
  resetDynamicState: () => void
}

/**
 * 系统动态路由状态。
 * 与 Vue 版 useSystemInfoStore 的 hasAddedRoutes / routes / resetDynamicState 对齐。
 */
export const useSystemStore = create<SystemState>((set) => ({
  hasAddedRoutes: false,
  routes: [],
  setHasAddedRoutes: (flag) => set({ hasAddedRoutes: flag }),
  setRoutes: (routes) => set({ routes }),
  resetDynamicState: () => set({ hasAddedRoutes: false, routes: [] }),
}))
