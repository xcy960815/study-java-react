import { useEffect } from 'react'
import { message, notification } from 'antd'
import type { OrderPaidEvent } from '@/apis/order'
import { useNotificationStore } from '@/store'
import { eventEmitter } from '@/utils/event-emits'
import { buildOrderNotification } from '@/utils/notification'
import { getSharedWebSocketClient } from '@/utils/websocket'

/** 错误提示节流间隔：共享客户端每次订阅/重连都可能回调，避免刷屏 */
const ERROR_NOTICE_INTERVAL = 10_000

/**
 * 通过共享 STOMP 客户端订阅当前用户的订单支付通知，
 * 与服务器监控复用同一条 SockJS 连接，断线后由共享客户端自动重连恢复订阅。
 * 收到支付事件后：弹右上角通知 + 写入顶栏通知中心 + 广播 order-paid。
 */
export const useOrderNotifications = (userId?: number) => {
  useEffect(() => {
    if (!userId) return

    let lastErrorNoticeAt = 0

    const unsubscribe = getSharedWebSocketClient().subscribe<OrderPaidEvent>(
      `/topic/orders/${userId}`,
      (event) => {
        notification.success({
          message: '订单支付成功',
          description: `订单 ${event.orderNo} 已支付，交易流水号：${event.transactionNo}`,
        })
        useNotificationStore.getState().addNotification(buildOrderNotification(event))
        eventEmitter.emit('order-paid', event.orderId)
      },
      (error) => {
        console.error('订单实时通知连接异常:', error)
        const now = Date.now()
        if (now - lastErrorNoticeAt >= ERROR_NOTICE_INTERVAL) {
          lastErrorNoticeAt = now
          message.error('订单实时通知连接失败，系统将自动重连')
        }
      }
    )

    return unsubscribe
  }, [userId])
}
