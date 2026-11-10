/** 路由 handle 字段类型定义 */
export interface RouteHandle {
  /** 图标名称，同时用于 Tab 图标切换和菜单图标渲染 */
  icon?: string
  /** 菜单显示标题，有此字段才会渲染为菜单项 */
  title?: string
  /** 设为 true 则不在菜单中显示 */
  hidden?: boolean
  /** 侧边栏展示该路由所需权限（仅静态壳层兼容，动态路由不再使用） */
  requiredPermission?: string
}
