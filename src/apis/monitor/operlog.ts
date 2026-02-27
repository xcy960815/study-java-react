import { request } from '@/utils/request'

/** 操作日志 Vo */
export interface OperLogVo {
  /** 日志编号 */
  operId: number
  /** 系统模块 */
  title: string
  /** 操作类型（0其它 1新增 2修改 3删除 ...） */
  businessType: number
  /** 请求方式 */
  requestMethod: string
  /** 操作人员 */
  operName: string
  /** 请求URL */
  operUrl: string
  /** 主机地址 */
  operIp: string
  /** 操作状态（0正常 1异常） */
  status: number
  /** 操作日期 */
  operTime: string
  /** 消耗时间 */
  costTime: string
  /** 请求参数 */
  operParam: string
  /** 返回参数 */
  jsonResult: string
  /** 错误消息 */
  errorMsg: string
  /** 操作方法 */
  method: string
}

/** 操作日志查询参数 */
export interface OperLogDto {
  /** 系统模块 */
  title?: string
  /** 操作人员 */
  operName?: string
  /** 操作类型 */
  businessType?: number
  /** 操作状态 */
  status?: number
}

/** 查询操作日志列表 */
export const getOperLogList = (params: OperLogDto & { pageNum: number; pageSize: number }) => {
  return request.get<{ data: OperLogVo[]; total: number }, { data: OperLogVo[]; total: number }>(
    '/monitor/operlog/list',
    { params }
  )
}

/** 删除操作日志 */
export const deleteOperLog = (operId: number | number[]) => {
  return request.delete<boolean, boolean>('/monitor/operlog/' + operId)
}

/** 清空操作日志 */
export const cleanOperLog = () => {
  return request.delete<boolean, boolean>('/monitor/operlog/clean')
}
