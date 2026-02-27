import { request } from '@/utils/request'

/** 经营报表 Vo */
export interface DailyReportVo {
  /** 昨日订单总数 */
  totalOrders: number
  /** 昨日销售总额 */
  totalRevenue: number
}

/** 获取昨日经营报表数据 */
export const getDailyReportData = () => {
  return request.get<DailyReportVo, DailyReportVo>('/monitor/report/daily')
}
