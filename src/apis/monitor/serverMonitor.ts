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
  /** JVM 内存使用率 (%) */
  usage: number
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

/**
 * 获取服务器当前快照信息。
 *
 * @returns CPU、内存、JVM、磁盘与系统信息
 */
export const getServerInfo = () => {
  return request.get<ServerInfoVo, ServerInfoVo>('/monitor/server/info')
}

/**
 * 开始通过 SSE 推送服务器监控数据。
 *
 * @returns 推送会话标识
 */
export const startServerMonitor = () => {
  return request.post<string, string>('/monitor/server/start')
}

/**
 * 停止推送服务器监控数据。
 *
 * @returns 操作结果信息
 */
export const stopServerMonitor = () => {
  return request.post<string, string>('/monitor/server/stop')
}

/** 监控指标历史键 */
export type ServerMetricKey = 'cpu_usage' | 'memory_usage' | 'jvm_usage' | 'disk_usage'

/** 监控指标卡数据 */
export interface ServerMetricValue {
  /** 指标键 */
  key: ServerMetricKey
  /** 指标展示名 */
  label: string
  /** 指标单位 */
  unit: string
  /** 当前值（null 表示无数据） */
  value: number | null
  /** 指标状态 */
  status: 'ok' | 'warning' | 'danger' | 'unavailable'
}

/** 单个趋势点（Unix 秒级时间戳） */
export interface ServerMetricsHistoryPoint {
  /** 采样时间（Unix 秒级时间戳） */
  timestamp: number
  /** 采样值 */
  value: number
}

/** 监控指标历史趋势响应 */
export interface ServerMetricsHistoryVo {
  /** 指标键 */
  metricKey: ServerMetricKey
  /** 指标展示名 */
  label: string
  /** 指标单位 */
  unit: string
  /** 趋势点列表（按时间升序） */
  points: ServerMetricsHistoryPoint[]
}

/**
 * 查询服务器监控指标历史趋势。
 *
 * @param metricKey - 指标键（cpu_usage/memory_usage/jvm_usage/disk_usage）
 * @param start - Unix 秒级起始时间（含）
 * @param end - Unix 秒级结束时间（含）
 * @returns 指标趋势数据（label/unit/points）
 */
export const getServerMetricsHistory = (
  metricKey: ServerMetricKey,
  start: number,
  end: number
): Promise<ServerMetricsHistoryVo> => {
  return request.get<ServerMetricsHistoryVo, ServerMetricsHistoryVo>('/monitor/server/history', {
    params: { metricKey, start, end },
  })
}
