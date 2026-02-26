import { request } from '@/utils/request'

/** 角色信息（后端返回） */
export interface RoleInfoVo {
  /** 角色ID */
  id: number
  /** 角色名称 */
  roleName: string
  /** 角色编码 */
  roleCode: string
  /** 菜单名称列表 */
  menuNames?: string[]
  /** 菜单ID列表 */
  menuIds?: number[]
  /** 显示顺序 */
  roleSort?: number
  /** 角色状态（1正常 0停用） */
  status?: number
  /** 备注 */
  remark?: string
  /** 创建时间 */
  createTime?: string
}

/** 角色请求参数 */
export interface RoleInfoDto {
  id?: number
  roleName?: string
  roleCode?: string
  menuIds?: number[]
  roleSort?: number
  status?: number
  remark?: string
}

/** 角色列表查询参数 */
export interface RoleListParams {
  pageNum: number
  pageSize: number
  roleName?: string
  roleCode?: string
  status?: number
}

/**
 * 获取所有角色列表
 * @returns {Promise<RoleInfoVo[]>} 全部角色列表
 */
export const getAllRoleList = (): Promise<RoleInfoVo[]> => {
  return request.get('/role/getAllRoleList')
}

/**
 * 获取角色列表（分页）
 * @param {RoleListParams} params - 查询参数
 * @returns {Promise<{ data: RoleInfoVo[]; total: number }>} 角色列表及总数
 */
export const getRoleList = (
  params: RoleListParams
): Promise<{ data: RoleInfoVo[]; total: number }> => {
  const { pageSize, pageNum, ...otherParams } = params
  return request.get(`/role/getRoleList?pageSize=${pageSize}&pageNum=${pageNum}`, {
    params: otherParams,
  })
}

/**
 * 新增角色
 * @param {RoleInfoDto} data - 角色信息
 * @returns {Promise<boolean>} 是否新增成功
 */
export const insertRole = (data: RoleInfoDto): Promise<boolean> => {
  return request.post('/role/insertRole', data)
}

/**
 * 更新角色
 * @param {RoleInfoDto} data - 角色信息
 * @returns {Promise<boolean>} 是否更新成功
 */
export const updateRole = (data: RoleInfoDto): Promise<boolean> => {
  return request.put('/role/updateRole', data)
}

/**
 * 删除角色
 * @param {RoleInfoDto} data - 待删除的角色信息
 * @returns {Promise<boolean>} 是否删除成功
 */
export const deleteRole = (data: RoleInfoDto): Promise<boolean> => {
  return request.delete('/role/deleteRole', { data })
}

/**
 * 禁用角色
 * @param {RoleInfoDto} data - 待禁用的角色信息
 * @returns {Promise<boolean>} 是否禁用成功
 */
export const disableRole = (data: RoleInfoDto): Promise<boolean> => {
  return request.post('/role/disableRole', data)
}

/**
 * 启用角色
 * @param {RoleInfoDto} data - 待启用的角色信息
 * @returns {Promise<boolean>} 是否启用成功
 */
export const enableRole = (data: RoleInfoDto): Promise<boolean> => {
  return request.post('/role/enableRole', data)
}
