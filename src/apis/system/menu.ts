import { request } from '@/utils/request'

/** 菜单信息（后端返回） */
export interface MenuVo {
  /** 菜单ID */
  id: number
  /** 父菜单ID */
  parentId: number | null
  /** 菜单名称 */
  menuName: string
  /** 菜单路径 */
  path: string
  /** 组件路径 */
  component: string
  /** 菜单图标 */
  icon: string
  /** 菜单类型（0目录 1菜单 2按钮） */
  menuType: number
  /** 权限标识 */
  perms: string
  /** 排序 */
  orderNum: number
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime: string
  /** 子菜单 */
  children?: MenuVo[]
}

/** 菜单请求参数 */
export type MenuDto = Omit<MenuVo, 'id' | 'createTime' | 'updateTime' | 'children'> & {
  id?: number | null
}

/** 菜单列表查询参数 */
export interface MenuListParams {
  pageNum: number
  pageSize: number
  menuName?: string
  menuType?: number
}

/**
 * 获取菜单树（分页）
 * @param {MenuListParams} params - 查询参数
 * @returns {Promise<{ data: MenuVo[]; total: number }>} 菜单树列表及总数
 */
export const getMenuTree = (params: MenuListParams): Promise<{ data: MenuVo[]; total: number }> => {
  const { pageSize, pageNum, ...otherParams } = params
  return request.get(`/studyJavaSysMenu/getMenuTree?pageSize=${pageSize}&pageNum=${pageNum}`, {
    params: otherParams,
  })
}

/**
 * 获取所有菜单树
 * @returns {Promise<MenuVo[]>} 全部菜单树
 */
export const getAllMenuTree = (): Promise<MenuVo[]> => {
  return request.get('/studyJavaSysMenu/getAllMenuTree')
}

/**
 * 新增菜单
 * @param {MenuDto} data - 菜单信息
 * @returns {Promise<boolean>} 是否新增成功
 */
export const insertMenu = (data: MenuDto): Promise<boolean> => {
  return request.post('/studyJavaSysMenu/insertMenu', data)
}

/**
 * 更新菜单
 * @param {MenuDto} data - 菜单信息
 * @returns {Promise<boolean>} 是否更新成功
 */
export const updateMenu = (data: MenuDto): Promise<boolean> => {
  return request.put('/studyJavaSysMenu/updateMenu', data)
}

/**
 * 删除菜单
 * @param {MenuDto} data - 待删除的菜单信息
 * @returns {Promise<boolean>} 是否删除成功
 */
export const deleteMenu = (data: MenuDto): Promise<boolean> => {
  return request.delete('/studyJavaSysMenu/deleteMenu', { data })
}
