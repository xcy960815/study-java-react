import { request } from '@/utils/request'

export interface UserInfoVo {
  id?: number
  nickName: string
  loginName: string
  age?: number
  introduceSign: string
  address: string
  avatar?: string
  roleIds?: number[]
  roleNames?: string[]
  roleCodes?: string[]
  permissions?: string[]
  createTime?: string
}

/** 修改密码请求体（后端要求字段带 Md5 后缀） */
export interface UpdateUserPasswordRequest {
  passwordMd5: string
  newPasswordMd5: string
  confirmNewPasswordMd5: string
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
 * 分页参数走 URL 查询串，其他搜索条件放在 POST body 中
 * @param {UserListParams} params - 查询参数，包含分页和搜索条件
 * @returns {Promise<{ data: UserInfoVo[]; total: number }>} 用户列表及总数
 */
export const getUserList = (
  params: UserListParams
): Promise<{ data: UserInfoVo[]; total: number }> => {
  const { pageSize, pageNum, ...otherParams } = params
  return request.post('/user/getUserList', otherParams, { params: { pageNum, pageSize } })
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

/**
 * 上传用户头像（multipart：userId + file），返回头像访问地址
 */
export const updateUserAvatar = (formData: FormData): Promise<string> => {
  return request.post('/user/updateUserAvatar', formData)
}

/**
 * 修改当前用户密码，成功后需重新登录
 */
export const updateUserPassword = (data: UpdateUserPasswordRequest): Promise<boolean> => {
  return request.post('/user/updateUserPassword', data)
}
