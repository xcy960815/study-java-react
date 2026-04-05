/**
 * 应用内事件与参数列表的映射。
 */
interface AppEventMap {
  login: []
  logout: []
  'token-invalid': []
}

/**
 * 事件处理函数类型。
 */
type EventHandler<TArgs extends unknown[] = []> = (...args: TArgs) => void

/**
 * 轻量级事件总线，用于跨模块同步登录态等全局事件。
 */
class EventEmitter<TEvents> {
  private events: {
    [K in keyof TEvents]?: Array<EventHandler<Extract<TEvents[K], unknown[]>>>
  } = {}

  /**
   * 注册事件监听
   * @param {string} event 事件名称
   * @param {EventHandler} handler 事件触发时的回调函数
   */
  on<TKey extends keyof TEvents>(
    event: TKey,
    handler: EventHandler<Extract<TEvents[TKey], unknown[]>>
  ) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event]?.push(handler)
  }

  /**
   * 移除事件监听
   * @param {string} event 事件名称
   * @param {EventHandler} handler 需要移除的回调函数
   */
  off<TKey extends keyof TEvents>(
    event: TKey,
    handler: EventHandler<Extract<TEvents[TKey], unknown[]>>
  ) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter((h) => h !== handler)
  }

  /**
   * 触发指定事件
   * @param {string} event 事件名称
   * @param {...any[]} args 传递给回调函数的额外参数
   */
  emit<TKey extends keyof TEvents>(event: TKey, ...args: Extract<TEvents[TKey], unknown[]>) {
    if (!this.events[event]) return
    this.events[event]?.forEach((handler) => handler(...args))
  }
}

/**
 * 全局事件总线实例。
 */
export const eventEmitter = new EventEmitter<AppEventMap>()
