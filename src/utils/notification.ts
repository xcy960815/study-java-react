import type { OrderPaidEvent } from '@/apis/order'

/** 应用内通知（本地生成，不来自后端接口） */
export interface AppNotification {
  id: string
  type: 'order'
  title: string
  content: string
  orderId?: number
  orderNo?: string
  createdAt: number
  read: boolean
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** 把时间戳格式化为相对时间文案（刚刚 / N 分钟前 / N 小时前 / N 天前） */
export const formatRelativeTime = (timestamp: number, now: number = Date.now()): string => {
  const diff = now - timestamp
  if (diff < MINUTE) return '刚刚'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分钟前`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} 小时前`
  return `${Math.floor(diff / DAY)} 天前`
}

/** 由订单支付事件生成本地通知内容 */
export const buildOrderNotification = (
  event: OrderPaidEvent
): Omit<AppNotification, 'id' | 'createdAt' | 'read'> => ({
  type: 'order',
  title: '订单支付成功',
  content: `订单 ${event.orderNo} 支付 ¥${event.amount}，交易号 ${event.transactionNo}`,
  orderId: event.orderId,
  orderNo: event.orderNo,
})

/** 通知列表点击跳转目标，非可跳转类型返回空字符串 */
export const getNotificationRoute = (notification: AppNotification): string => {
  if (notification.type === 'order') return '/order'
  return ''
}
