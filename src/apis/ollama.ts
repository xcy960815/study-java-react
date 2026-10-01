import { request } from '@/utils/request'

export interface OllamaModel {
  id: string
  object: string
  owned_by: string
  created: number | string
}

export interface OllamaModels {
  object: string
  data: OllamaModel[]
}

export interface OllamaVersion {
  version: string
}

export interface OllamaPsModel {
  name: string
  model: string
  expires_at?: string
  size?: number
}

export interface OllamaPs {
  models: OllamaPsModel[]
}

/** 获取本地模型列表 */
export const getOllamaModels = (): Promise<OllamaModels> => {
  return request.get('/ollama/models')
}

/** 获取 Ollama 版本 */
export const getOllamaVersion = (): Promise<OllamaVersion> => {
  return request.get('/ollama/version')
}

/** 获取正在内存中运行的模型 */
export const getOllamaPs = (): Promise<OllamaPs> => {
  return request.get('/ollama/ps')
}

/** 删除一个本地模型 */
export const deleteOllamaModel = (name: string): Promise<boolean> => {
  return request.delete('/ollama/delete', { data: { name } })
}
