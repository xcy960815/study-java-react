import { request } from '@/utils/request'

/** DeepSeek 模型条目 */
export interface DeepSeekModel {
  id: string
  object: string
  owned_by: string
  created: number | string
}

/** DeepSeek 模型列表响应 */
export interface DeepSeekModels {
  object: string
  data: DeepSeekModel[]
}

/** DeepSeek 账户余额明细 */
export interface DeepSeekBalanceInfo {
  currency: string
  total_balance: string
  granted_balance: string
  topped_up_balance: string
}

/** DeepSeek 余额响应 */
export interface DeepSeekBalance {
  is_available: boolean
  balance_infos: DeepSeekBalanceInfo[]
}

/**
 * 获取 DeepSeek 可用模型列表。
 *
 * @returns DeepSeek 模型列表
 */
export const getDeepSeekModels = (): Promise<DeepSeekModels> => {
  return request.get('/deepseek/models')
}

/**
 * 获取当前 API Key 的余额。
 *
 * @returns 账户余额信息
 */
export const getDeepSeekBalance = (): Promise<DeepSeekBalance> => {
  return request.get('/deepseek/balance')
}
