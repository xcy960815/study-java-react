import { request } from '@/utils/request'

export interface RoleInfoVo {
  id: number
  roleName: string
  roleCode: string
}

export const getAllRoleList = (): Promise<RoleInfoVo[]> => {
  return request.get('/role/list/all')
}
