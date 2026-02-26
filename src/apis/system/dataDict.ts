import { request } from '@/utils/request'

/** 数据字典信息（后端返回） */
export interface DataDictionaryVo {
  /** 主键ID */
  id: number
  /** 字典类型 */
  dictType: string
  /** 字典编码 */
  dictCode: string
  /** 字典名称 */
  dictName: string
  /** 字典值 */
  dictValue: string
  /** 排序号 */
  sortOrder: number
  /** 状态（0-禁用，1-启用） */
  status: number
  /** 备注 */
  remark?: string
  /** 创建人 */
  createdBy?: string
  /** 创建时间 */
  createdTime?: string
  /** 更新人 */
  updatedBy?: string
  /** 更新时间 */
  updatedTime?: string
}

/** 数据字典请求参数 */
export type DataDictionaryDto = Omit<
  DataDictionaryVo,
  'id' | 'createdBy' | 'createdTime' | 'updatedBy' | 'updatedTime'
> & {
  id?: number
}

/** 数据字典列表查询参数 */
export interface DataDictListParams {
  pageNum: number
  pageSize: number
  dictType?: string
  dictName?: string
  status?: number
}

/**
 * 获取数据字典列表
 * @param {DataDictListParams} params - 查询参数
 * @returns {Promise<{ data: DataDictionaryVo[]; total: number }>} 数据字典列表及总数
 */
export const getDataDictList = (
  params: DataDictListParams
): Promise<{ data: DataDictionaryVo[]; total: number }> => {
  return request.get('/dataDict/getDataDictList', { params })
}

/**
 * 新增数据字典
 * @param {DataDictionaryDto} data - 数据字典信息
 * @returns {Promise<boolean>} 是否新增成功
 */
export const insertDataDict = (data: DataDictionaryDto): Promise<boolean> => {
  return request.post('/dataDict/insertDataDict', data)
}

/**
 * 修改数据字典
 * @param {DataDictionaryDto} data - 数据字典信息
 * @returns {Promise<boolean>} 是否修改成功
 */
export const updateDataDict = (data: DataDictionaryDto): Promise<boolean> => {
  return request.put('/dataDict/updateDataDict', data)
}

/**
 * 删除数据字典
 * @param {number} id - 字典ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export const deleteDataDict = (id: number): Promise<boolean> => {
  return request.delete(`/dataDict/deleteDataDict/${id}`)
}
