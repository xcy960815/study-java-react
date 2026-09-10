import { request } from '@/utils/request'

/** 昨日经营报表数据 */
export interface DailyReport {
  totalOrders: number
  totalRevenue: number
}

/** 获取昨日经营报表数据（后端不要求额外权限） */
export const getDailyReportData = () =>
  request.get<DailyReport, DailyReport>('/monitor/report/daily')
