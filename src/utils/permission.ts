const ALL_PERMISSIONS = '*:*:*'

/** 与后端 AuthInterceptorComponent 保持一致，支持超级管理员通配权限。 */
export const hasPermission = (permissions: string[] | undefined, permission: string) =>
  permissions?.includes(ALL_PERMISSIONS) === true || permissions?.includes(permission) === true
