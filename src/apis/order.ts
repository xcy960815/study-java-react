import { request } from '@/utils/request'
import type {
  OrderAction,
  OrderStatus,
  PayablePaymentType,
  PayStatus,
  PaymentType,
} from '@/enums/order'

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

export interface OrderQuery {
  orderNo?: string
  userId?: number
  payStatus?: PayStatus
  orderStatus?: OrderStatus
  isDeleted?: 0 | 1
}

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

export interface PlaceOrderRequest {
  userId: number
  userName: string
  userPhone: string
  userAddress: string
  items: PlaceOrderItem[]
}

export interface PayOrderRequest {
  requestId: string
  orderId: number
  payType: PayablePaymentType
}

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

export interface OrderTransitionRequest {
  orderId: number
  action: OrderAction
}

export interface OrderPaidEvent {
  orderId: number
  orderNo: string
  userId: number
  amount: number
  paymentType: PaymentType
  transactionNo: string
}

export const getOrderList = (params: OrderQuery & { pageNum: number; pageSize: number }) =>
  request.get<{ data: Order[]; total: number }, { data: Order[]; total: number }>(
    '/order/getOrderList',
    { params }
  )

export const getOrderDetail = (orderId: number) =>
  request.get<Order, Order>('/order/getOrderInfo', { params: { id: orderId } })

export const placeOrder = (data: PlaceOrderRequest) =>
  request.post<Order, Order>('/order/place', data)

export const payOrder = (data: PayOrderRequest) =>
  request.post<PaymentResult, PaymentResult>('/order/pay', data)

export const transitionOrder = (data: OrderTransitionRequest) =>
  request.post<Order, Order>('/order/transition', data)

export const deleteOrder = (orderId: number) =>
  request.delete<boolean, boolean>('/order/deleteOrder', { params: { id: orderId } })
