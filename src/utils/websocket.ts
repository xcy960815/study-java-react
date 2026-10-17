import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'

type MessageHandler<T = unknown> = (message: T) => void
type ErrorHandler = (error: unknown) => void

/** 将 http(s) 地址转换为同结构的 ws(s) 地址 */
const toWebSocketUrl = (httpUrl: string) =>
  httpUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')

/**
 * 共享 STOMP 客户端：订单通知与服务器监控复用同一条原生 WebSocket 连接，
 * 每个目的地维护独立的处理器集合，断线重连后自动恢复订阅。
 */
export class WebSocketClient {
  private client: Client
  private subscriptions = new Map<string, Map<MessageHandler, StompSubscription | null>>()
  private errorHandlers = new Set<ErrorHandler>()

  private readonly url: string

  constructor(url: string) {
    this.url = url
    this.client = new Client({
      // 原生 WebSocket 传输：后端已扩展原生端点。不再引入 sockjs-client，
      // 其模块加载时会注册 unload 监听器，触发 Chrome 115+ 的 Permissions policy violation
      webSocketFactory: () => new WebSocket(this.url),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => this.restoreSubscriptions(),
      onStompError: (frame) => this.notifyError(frame),
      onWebSocketError: (event) => this.notifyError(event),
    })
  }

  subscribe<T>(destination: string, handler: MessageHandler<T>, onError?: ErrorHandler) {
    const typedHandler = handler as MessageHandler
    const destinationHandlers = this.subscriptions.get(destination) ?? new Map()
    destinationHandlers.set(typedHandler, null)
    this.subscriptions.set(destination, destinationHandlers)
    if (onError) this.errorHandlers.add(onError)

    if (!this.client.active) this.client.activate()
    if (this.client.connected) this.activateSubscription(destination, typedHandler)

    return () => {
      destinationHandlers.get(typedHandler)?.unsubscribe()
      destinationHandlers.delete(typedHandler)
      if (destinationHandlers.size === 0) this.subscriptions.delete(destination)
      if (onError) this.errorHandlers.delete(onError)
      if (this.subscriptions.size === 0) {
        void this.client.deactivate().then(() => {
          if (this.subscriptions.size > 0 && !this.client.active) this.client.activate()
        })
      }
    }
  }

  getIsConnected() {
    return this.client.connected
  }

  private restoreSubscriptions() {
    this.subscriptions.forEach((handlers, destination) => {
      handlers.forEach((_subscription, handler) => {
        handlers.set(handler, null)
        this.activateSubscription(destination, handler)
      })
    })
  }

  private activateSubscription(destination: string, handler: MessageHandler) {
    const handlers = this.subscriptions.get(destination)
    if (!handlers || handlers.get(handler)) return
    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        handler(JSON.parse(message.body))
      } catch (error) {
        this.notifyError(error)
      }
    })
    handlers.set(handler, subscription)
  }

  private notifyError(error: unknown) {
    this.errorHandlers.forEach((handler) => handler(error))
  }
}

let sharedClient: WebSocketClient | null = null

export const getWebSocketUrl = () => {
  const apiPrefix = import.meta.env.VITE_API_DOMAIN_PREFIX || ''
  const normalizedPrefix = `/${apiPrefix}`.replace(/\/+/g, '/').replace(/\/$/, '')
  return toWebSocketUrl(
    `${window.location.protocol}//${window.location.host}${normalizedPrefix}/ws/server-monitor-native`
  )
}

export const getSharedWebSocketClient = () => {
  if (!sharedClient) sharedClient = new WebSocketClient(getWebSocketUrl())
  return sharedClient
}
