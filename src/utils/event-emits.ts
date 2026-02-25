type EventHandler = (...args: any[]) => void

class EventEmitter {
  private events: Record<string, EventHandler[]> = {}

  /**
   * 注册事件监听
   * @param {string} event 事件名称
   * @param {EventHandler} handler 事件触发时的回调函数
   */
  on(event: string, handler: EventHandler) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(handler)
  }

  /**
   * 移除事件监听
   * @param {string} event 事件名称
   * @param {EventHandler} handler 需要移除的回调函数
   */
  off(event: string, handler: EventHandler) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter((h) => h !== handler)
  }

  /**
   * 触发指定事件
   * @param {string} event 事件名称
   * @param {...any[]} args 传递给回调函数的额外参数
   */
  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return
    this.events[event].forEach((handler) => handler(...args))
  }
}

export const eventEmitter = new EventEmitter()
