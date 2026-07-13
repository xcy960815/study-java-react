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
  permissions?: string[]
  createTime?: string
}

/** 获取当前登录用户及其权限。 */
export const getCurrentUser = (): Promise<UserInfoVo> => {
  return request.get('/user/getUserInfo')
}

export interface UserListParams {
  pageNum: number
  pageSize: number
  nickName?: string
  loginName?: string
  roleIds?: number[]
}

/**
 * 获取用户列表
 * 分页参数拼接在 URL 上，其他搜索条件放在 POST body 中
 * @param {UserListParams} params - 查询参数，包含分页和搜索条件
 * @returns {Promise<{ data: UserInfoVo[]; total: number }>} 用户列表及总数
 */
export const getUserList = (
  params: UserListParams
): Promise<{ data: UserInfoVo[]; total: number }> => {
  const { pageSize, pageNum, ...otherParams } = params
  return request.post(`/user/getUserList?pageSize=${pageSize}&pageNum=${pageNum}`, otherParams)
}

/**
 * 新增用户
 * @param {Partial<UserInfoVo>} data - 用户信息
 * @returns {Promise<boolean>} 是否新增成功
 */
export const insertUser = (data: Partial<UserInfoVo>): Promise<boolean> => {
  return request.post('/user/insertUser', data)
}

/**
 * 更新用户
 * @param {Partial<UserInfoVo>} data - 用户信息
 * @returns {Promise<boolean>} 是否更新成功
 */
export const updateUser = (data: Partial<UserInfoVo>): Promise<boolean> => {
  return request.post('/user/updateUser', data)
}

/**
 * 删除用户
 * @param {UserInfoVo} data - 待删除的用户信息
 * @returns {Promise<boolean>} 是否删除成功
 */
export const deleteUser = (data: UserInfoVo): Promise<boolean> => {
  return request.delete('/user/deleteUser', { data })
}
