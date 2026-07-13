import { useEffect } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { notification } from 'antd'
import type { OrderPaidEvent } from '@/apis/order'
import { eventEmitter } from '@/utils/event-emits'
import { getToken } from '@/utils/token'

const socketUrl = `${import.meta.env.VITE_API_DOMAIN_PREFIX || ''}/ws/server-monitor`

/**
 * 复用后端服务器监控 SockJS 端点订阅当前用户的订单支付通知。
 * Client 自带重连；每次连接只创建一次订阅，deactivate 会同时取消订阅和重连。
 */
export const useOrderNotifications = (userId?: number) => {
  useEffect(() => {
    if (!userId) return

    let connectionErrorShown = false
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined,
      beforeConnect: () => {
        const currentToken = getToken()
        client.connectHeaders = currentToken ? { Authorization: `Bearer ${currentToken}` } : {}
      },
      onConnect: () => {
        connectionErrorShown = false
        client.subscribe(`/topic/orders/${userId}`, (frame) => {
          try {
            const event = JSON.parse(frame.body) as OrderPaidEvent
            notification.success({
              message: '订单支付成功',
              description: `订单 ${event.orderNo} 已支付，交易流水号：${event.transactionNo}`,
            })
            eventEmitter.emit('order-paid', event.orderId)
          } catch {
            notification.warning({ message: '收到无法识别的订单支付通知' })
          }
        })
      },
      onWebSocketError: () => {
        if (!connectionErrorShown) {
          connectionErrorShown = true
          notification.warning({
            message: '订单实时通知连接失败',
            description: '系统将自动重连，订单仍可通过列表刷新查询。',
          })
        }
      },
      onStompError: (frame) => {
        notification.error({
          message: '订单实时通知订阅失败',
          description: frame.headers.message || '请确认 WebSocket 鉴权配置。',
        })
      },
    })

    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [userId])
}
