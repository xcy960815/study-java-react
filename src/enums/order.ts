export const OrderStatus = {
  PENDING_PAYMENT: 0,
  PAID: 1,
  PREPARED: 2,
  SHIPPED: 3,
  COMPLETED: 4,
  MANUALLY_CLOSED: -1,
  TIMEOUT_CLOSED: -2,
  MERCHANT_CLOSED: -3,
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const PayStatus = { FAILED: -1, UNPAID: 0, SUCCESS: 1 } as const
export type PayStatus = (typeof PayStatus)[keyof typeof PayStatus]

export const PaymentType = { NONE: 0, ALIPAY: 1, WECHAT_PAY: 2 } as const
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType]
export type PayablePaymentType = typeof PaymentType.ALIPAY | typeof PaymentType.WECHAT_PAY

export type OrderAction =
  | 'PREPARE'
  | 'SHIP'
  | 'COMPLETE'
  | 'MANUAL_CLOSE'
  | 'TIMEOUT_CLOSE'
  | 'MERCHANT_CLOSE'

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING_PAYMENT]: { label: '待支付', color: 'warning' },
  [OrderStatus.PAID]: { label: '已支付', color: 'processing' },
  [OrderStatus.PREPARED]: { label: '配货完成', color: 'cyan' },
  [OrderStatus.SHIPPED]: { label: '已出库', color: 'blue' },
  [OrderStatus.COMPLETED]: { label: '交易完成', color: 'success' },
  [OrderStatus.MANUALLY_CLOSED]: { label: '手动关闭', color: 'default' },
  [OrderStatus.TIMEOUT_CLOSED]: { label: '超时关闭', color: 'default' },
  [OrderStatus.MERCHANT_CLOSED]: { label: '商家关闭', color: 'default' },
}

export const PAY_STATUS_META: Record<PayStatus, { label: string; color: string }> = {
  [PayStatus.FAILED]: { label: '支付失败', color: 'error' },
  [PayStatus.UNPAID]: { label: '未支付', color: 'warning' },
  [PayStatus.SUCCESS]: { label: '支付成功', color: 'success' },
}

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  [PaymentType.NONE]: '无',
  [PaymentType.ALIPAY]: '支付宝',
  [PaymentType.WECHAT_PAY]: '微信支付',
}

export const ORDER_ACTION_META: Record<
  OrderAction,
  { label: string; confirm: string; danger?: boolean }
> = {
  PREPARE: { label: '配货', confirm: '确认该订单已经配货完成？' },
  SHIP: { label: '发货', confirm: '确认该订单已经出库？' },
  COMPLETE: { label: '完成', confirm: '确认该订单交易完成？' },
  MANUAL_CLOSE: { label: '手动关闭', confirm: '确认手动关闭该订单？', danger: true },
  TIMEOUT_CLOSE: { label: '超时关闭', confirm: '确认按超时原因关闭该订单？', danger: true },
  MERCHANT_CLOSE: { label: '商家关闭', confirm: '确认由商家关闭该订单？', danger: true },
}

export const ORDER_ACTIONS_BY_STATUS: Partial<Record<OrderStatus, OrderAction[]>> = {
  [OrderStatus.PENDING_PAYMENT]: ['MANUAL_CLOSE', 'MERCHANT_CLOSE'],
  [OrderStatus.PAID]: ['PREPARE'],
  [OrderStatus.PREPARED]: ['SHIP'],
  [OrderStatus.SHIPPED]: ['COMPLETE'],
}
