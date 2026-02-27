import { request } from '@/utils/request'

/** CPU 信息 */
export interface CpuInfo {
  cpuNum: number
  cpuModel: string
  used: number
}

/** 内存信息 */
export interface MemoryInfo {
  total: number
  used: number
  free: number
  usage: number
}

/** JVM 信息 */
export interface JvmInfo {
  total: number
  max: number
  free: number
  used: number
  version: string
  startTime: string
  runTime: string
}

/** 磁盘信息 */
export interface DiskInfo {
  total: number
  used: number
  free: number
  usage: number
}

/** 系统信息 */
export interface SysInfo {
  os: string
  arch: string
  hostname: string
  ip: string
}

/** 服务器监控信息 Vo */
export interface ServerInfoVo {
  cpu: CpuInfo
  memory: MemoryInfo
  jvm: JvmInfo
  disk: DiskInfo
  sys: SysInfo
}

/** 获取服务器信息 */
export const getServerInfo = () => {
  return request.get<ServerInfoVo, ServerInfoVo>('/monitor/server/info')
}

/** 开始推送服务器监控数据 */
export const startServerMonitor = () => {
  return request.post<string, string>('/monitor/server/start')
}

/** 停止推送服务器监控数据 */
export const stopServerMonitor = () => {
  return request.post<string, string>('/monitor/server/stop')
}
