import { request } from '@/utils/request'

export interface UserInfoVo {
  id?: number
  nickName: string
  loginName: string
  age?: number
  introduceSign: string
  address: string
  roleIds?: number[]
  roleNames?: string[]
  roleCodes?: string[]
  createTime?: string
}

export interface UserListParams {
  pageNum: number
  pageSize: number
  nickName?: string
  loginName?: string
  roleIds?: number[]
}

export const getUserList = (
  params: UserListParams
): Promise<{ data: UserInfoVo[]; total: number }> => {
  return request.post('/user/list', params)
}

export const insertUser = (data: Partial<UserInfoVo>): Promise<boolean> => {
  return request.post('/user/add', data)
}

export const updateUser = (data: Partial<UserInfoVo>): Promise<boolean> => {
  return request.put(`/user/update`, data)
}

export const deleteUser = (data: UserInfoVo): Promise<boolean> => {
  return request.post(`/user/delete`, { id: data.id })
}
