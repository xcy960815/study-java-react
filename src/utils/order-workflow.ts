import type { CheckoutDraftItem, PlaceOrderRequest } from '@/apis/order'
import {
  ORDER_ACTION_META,
  type OrderAction,
  type OrderStatus,
  type PayablePaymentType,
} from '@/enums/order'

export type OrderActionMeta = (typeof ORDER_ACTION_META)[OrderAction]

/** 各订单状态允许的操作；includeTimeoutClose 用于超时关单等系统触发场景 */
export const getAvailableOrderActions = (
  status: OrderStatus,
  includeTimeoutClose = false
): OrderActionMeta[] => {
  const toMeta = (actions: OrderAction[]) => actions.map((action) => ORDER_ACTION_META[action])
  if (status === 0) {
    const actions: OrderAction[] = ['MANUAL_CLOSE', 'MERCHANT_CLOSE']
    return toMeta(includeTimeoutClose ? [...actions, 'TIMEOUT_CLOSE'] : actions)
  }
  if (status === 1) return toMeta(['PREPARE'])
  if (status === 2) return toMeta(['SHIP'])
  if (status === 3) return toMeta(['COMPLETE'])
  return []
}

const PAYMENT_REQUEST_ID_PREFIX = 'paymentRequestId'
const CHECKOUT_DRAFT_KEY = 'orderCheckoutDraft'

export const getPaymentRequestStorageKey = (orderId: number, payType: PayablePaymentType) =>
  `${PAYMENT_REQUEST_ID_PREFIX}:${orderId}:${payType}`

/** 同一订单+支付方式复用幂等键，支付成功才清除，避免重复扣款 */
export const getOrCreatePaymentRequestId = (
  orderId: number,
  payType: PayablePaymentType,
  storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage
) => {
  const key = getPaymentRequestStorageKey(orderId, payType)
  const existingRequestId = storage.getItem(key)
  if (existingRequestId) return existingRequestId
  const requestId = crypto.randomUUID()
  storage.setItem(key, requestId)
  return requestId
}

export const clearPaymentRequestId = (
  orderId: number,
  payType: PayablePaymentType,
  storage: Pick<Storage, 'removeItem'> = sessionStorage
) => storage.removeItem(getPaymentRequestStorageKey(orderId, payType))

export const saveCheckoutDraft = (items: CheckoutDraftItem[]) => {
  sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(items))
}

/** 读取并立即清除草稿，保证跨页跳转只消费一次；上限 50 种商品与后端一致 */
export const consumeCheckoutDraft = (): CheckoutDraftItem[] => {
  const value = sessionStorage.getItem(CHECKOUT_DRAFT_KEY)
  sessionStorage.removeItem(CHECKOUT_DRAFT_KEY)
  if (!value) return []
  try {
    const items = JSON.parse(value) as CheckoutDraftItem[]
    return Array.isArray(items) ? items.slice(0, 50) : []
  } catch {
    return []
  }
}

export const getRequestErrorMessage = (error: unknown): string => {
  if (typeof error !== 'object' || error === null) return ''
  const candidate = error as { message?: string; response?: { data?: { message?: string } } }
  return candidate.response?.data?.message || candidate.message || ''
}

/** 订单状态已变化或订单已不存在时，提示后应刷新而非保留旧操作 */
export const isOrderStateConflict = (error: unknown) => {
  const message = getRequestErrorMessage(error)
  return message.includes('状态') || message.includes('订单不存在')
}

/** 提交订单前的客户端校验，与后端约束保持一致，避免无效请求 */
export const validatePlaceOrderRequest = (request: PlaceOrderRequest): string | null => {
  if (!request.userId || request.userId <= 0) return '当前登录用户信息无效'
  if (!request.userName.trim()) return '收货人不能为空'
  if (request.userName.length > 30) return '收货人不能超过30个字符'
  if (!/^\d{11}$/.test(request.userPhone)) return '手机号必须是11位数字'
  if (!request.userAddress.trim()) return '收货地址不能为空'
  if (request.userAddress.length > 100) return '收货地址不能超过100个字符'
  if (request.items.length === 0) return '订单至少包含一个商品'
  if (request.items.length > 50) return '一个订单最多包含50种商品'
  if (request.items.some((item) => item.goodsId <= 0 || item.quantity < 1 || item.quantity > 999)) {
    return '订单商品参数不合法'
  }
  if (new Set(request.items.map((item) => item.goodsId)).size !== request.items.length) {
    return '订单中不能重复添加同一商品'
  }
  return null
}
