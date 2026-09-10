import type { GoodsVo } from '@/apis/goods'
import { ORDER_STATUS_META, type OrderStatus } from '@/enums/order'

/** 图表通用数据形态：名称 + 数值 */
export interface NamedValue {
  name: string
  value: number
}

/** 按时段返回问候语（hour 取值 0-23，非法时兜底） */
export const getGreeting = (hour: number): string => {
  if (hour < 0 || hour > 23) return '你好'
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

/**
 * 订单状态分布图数据：按 ORDER_STATUS_META 定义的顺序生成并过滤零值，
 * statusTotals 中未定义或未知状态按 0 处理。
 */
export const buildOrderStatusPieData = (
  statusTotals: Partial<Record<OrderStatus, number>>
): NamedValue[] =>
  (Object.keys(ORDER_STATUS_META) as unknown as OrderStatus[])
    .map((status) => ({
      name: ORDER_STATUS_META[status].label,
      value: statusTotals[status] ?? 0,
    }))
    .filter((item) => item.value > 0)

/** 商品库存 TOP N（降序，不修改原数组） */
export const getTopStockGoods = (goodsList: GoodsVo[], topN: number): NamedValue[] =>
  [...goodsList]
    .sort((a, b) => b.stockNum - a.stockNum)
    .slice(0, topN)
    .map((goods) => ({ name: goods.goodsName, value: goods.stockNum }))

/** 环图配色，按 ORDER_STATUS_META 的状态顺序排列，与 antd 主题色一致 */
export const ORDER_STATUS_PIE_COLORS = [
  '#faad14',
  '#1677ff',
  '#13c2c2',
  '#2f54eb',
  '#52c41a',
  '#8c8c8c',
  '#bfbfbf',
  '#d9d9d9',
]
