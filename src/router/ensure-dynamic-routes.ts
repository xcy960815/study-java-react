import type { RouteObject } from 'react-router-dom'
import { getRoutes } from '@/apis/system/menu'
import { useSystemStore } from '@/store'
import type { AppRouter } from '@/router/instance'
import { staticLayoutRoutes } from '@/router/static-routes'
import { getDynamicRoutePatches, type RoutePatch } from './route-patches'
import { buildRoute, filterRoutableMenus, toMenuTree } from '@/utils/build-route'

export type EnsureDynamicRoutesOptions = {
  /** 必须明确指定所属实例，不能通过模块单例猜测注册目标。 */
  router: AppRouter
  /** 深链场景传入 patchRoutesOnNavigation 提供的 patch。 */
  patch?: (routeId: string | null, children: RouteObject[]) => void
  signal?: AbortSignal
}

type DynamicRoutes = {
  menus: ReturnType<typeof toMenuTree>
  patches: RoutePatch[]
}

// 只共享接口数据，不共享某次导航的 patch 或某个 router 的注册结果。
let routeData: Promise<DynamicRoutes> | null = null
let registeredRouters = new WeakSet<AppRouter>()
let generation = 0

/**
 * 清空动态路由标记，使下一次 ensureDynamicRoutes 可以重新注册。
 * 路由表本身需由调用方重建 createAppRouter，因为 patchRoutes 只能追加。
 */
export const resetDynamicRoutes = () => {
  generation += 1
  routeData = null
  registeredRouters = new WeakSet()
  useSystemStore.getState().resetDynamicState()
}

/**
 * 按 router 幂等注册动态路由；并发调用只共享同一会话的菜单数据。
 * 拉取 getRoutes → 组树 → buildRoute → patch 到常驻 layout 父路由。
 */
export const ensureDynamicRoutes = async ({
  router,
  patch,
  signal,
}: EnsureDynamicRoutesOptions): Promise<void> => {
  if (registeredRouters.has(router) || signal?.aborted) return
  const currentGeneration = generation
  if (!routeData) {
    routeData = (async () => {
      const menus = await getRoutes()
      const tree = toMenuTree(menus ?? [])
      const patches = getDynamicRoutePatches(buildRoute(tree), staticLayoutRoutes)
      return { menus: filterRoutableMenus(tree), patches }
    })().catch((error: unknown) => {
      if (currentGeneration === generation) routeData = null
      throw error
    })
  }

  let data: DynamicRoutes
  try {
    data = await routeData
  } catch (error) {
    if (currentGeneration !== generation || signal?.aborted) return
    throw error
  }
  // 被取消导航的 patch 是空操作；不能据此标记已注册，其他等待者仍需自行 patch。
  if (currentGeneration !== generation || signal?.aborted || registeredRouters.has(router)) return
  for (const { routeId, children } of data.patches) {
    if (patch) patch(routeId, children)
    else router.patchRoutes(routeId, children)
  }
  registeredRouters.add(router)
  const store = useSystemStore.getState()
  store.setRoutes(data.menus)
  store.setHasAddedRoutes(true)
}
