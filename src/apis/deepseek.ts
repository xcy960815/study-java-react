import { request } from '@/utils/request'

export interface DeepSeekModel {
  id: string
  object: string
  owned_by: string
  created: number | string
}

export interface DeepSeekModels {
  object: string
  data: DeepSeekModel[]
}

export interface DeepSeekBalanceInfo {
  currency: string
  total_balance: string
  granted_balance: string
  topped_up_balance: string
}

export interface DeepSeekBalance {
  is_available: boolean
  balance_infos: DeepSeekBalanceInfo[]
}

/** 获取 DeepSeek 可用模型 */
export const getDeepSeekModels = (): Promise<DeepSeekModels> => {
  return request.get('/deepseek/models')
}

/** 获取当前 API Key 的余额 */
export const getDeepSeekBalance = (): Promise<DeepSeekBalance> => {
  return request.get('/deepseek/balance')
}
