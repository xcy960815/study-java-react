import { request } from '@/utils/request'
import type {
  OrderAction,
  OrderStatus,
  PayablePaymentType,
  PayStatus,
  PaymentType,
} from '@/enums/order'

/** 订单 Vo */
export interface Order {
  orderId: number
  orderNo: string
  userId: number
  totalPrice: number
  payStatus: PayStatus
  payType: PaymentType
  payTime: string | null
  orderStatus: OrderStatus
  userName: string
  userPhone: string
  userAddress: string
  extraInfo: string
  createTime: string
  updateTime: string
}

/** 订单列表查询参数 */
export interface OrderQuery {
  orderNo?: string
  userId?: number
  payStatus?: PayStatus
  orderStatus?: OrderStatus
  isDeleted?: 0 | 1
}

/** 下单条目：商品与数量 */
export interface PlaceOrderItem {
  goodsId: number
  quantity: number
}

/** 结算草稿行：商品页勾选后暂存 sessionStorage，订单页消费后还原选择 */
export interface CheckoutDraftItem extends PlaceOrderItem {
  goodsName: string
  sellingPrice: number
  stockNum: number
}

/** 下单请求 */
export interface PlaceOrderRequest {
  userId: number
  userName: string
  userPhone: string
  userAddress: string
  items: PlaceOrderItem[]
}

/** 支付请求 */
export interface PayOrderRequest {
  requestId: string
  orderId: number
  payType: PayablePaymentType
}

/** 支付结果 */
export interface PaymentResult {
  orderId: number
  orderNo: string
  totalPrice: number
  orderStatus: OrderStatus
  payStatus: PayStatus
  payType: PaymentType
  transactionNo: string
  idempotent: boolean
}

/** 订单流转请求 */
export interface OrderTransitionRequest {
  orderId: number
  action: OrderAction
}

/** 支付成功事件 */
export interface OrderPaidEvent {
  orderId: number
  orderNo: string
  userId: number
  amount: number
  paymentType: PaymentType
  transactionNo: string
}

/**
 * 获取订单列表。
 *
 * @param params - 订单筛选条件与分页参数
 * @returns 订单分页结果
 */
export const getOrderList = (params: OrderQuery & { pageNum: number; pageSize: number }) =>
  request.get<{ data: Order[]; total: number }, { data: Order[]; total: number }>(
    '/order/getOrderList',
    { params }
  )

/**
 * 获取订单详情。
 *
 * @param orderId - 订单ID
 * @returns 订单详情
 */
export const getOrderDetail = (orderId: number) =>
  request.get<Order, Order>('/order/getOrderInfo', { params: { id: orderId } })

/**
 * 下单。
 *
 * @param data - 订单收货信息与商品条目
 * @returns 新创建的订单
 */
export const placeOrder = (data: PlaceOrderRequest) =>
  request.post<Order, Order>('/order/place', data)

/**
 * 支付订单。
 *
 * @param data - 支付请求（幂等键、订单ID、支付方式）
 * @returns 支付结果
 */
export const payOrder = (data: PayOrderRequest) =>
  request.post<PaymentResult, PaymentResult>('/order/pay', data)

/**
 * 流转订单状态（发货、收货等）。
 *
 * @param data - 订单ID与目标动作
 * @returns 流转后的订单
 */
export const transitionOrder = (data: OrderTransitionRequest) =>
  request.post<Order, Order>('/order/transition', data)

/**
 * 删除订单。
 *
 * @param orderId - 订单ID
 * @returns 是否删除成功
 */
export const deleteOrder = (orderId: number) =>
  request.delete<boolean, boolean>('/order/deleteOrder', { params: { id: orderId } })
