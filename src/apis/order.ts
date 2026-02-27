import { request } from '@/utils/request'

/** 订单 Vo */
export interface OrderVo {
  /** 订单ID */
  orderId: number
  /** 订单号 */
  orderNo: string
  /** 用户ID */
  userId: number
  /** 总价 */
  totalPrice: number
  /** 支付状态（-1支付失败 0未支付 1支付成功） */
  payStatus: number
  /** 支付方式（0无 1支付宝 2微信） */
  payType: number
  /** 支付时间 */
  payTime: string | null
  /** 订单状态 */
  orderStatus: number
  /** 收货人姓名 */
  userName: string
  /** 收货人手机号 */
  userPhone: string
  /** 收货人地址 */
  userAddress: string
  /** 订单备注 */
  extraInfo: string
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime: string
}

/** 订单请求参数 */
export interface OrderDto {
  orderId?: number
  orderNo?: string
  userId?: number
  totalPrice?: number
  payStatus?: number
  payType?: number
  payTime?: string
  orderStatus?: number
  userName?: string
  userPhone?: string
  userAddress?: string
  extraInfo?: string
}

/** 获取订单列表 */
export const getOrderList = (params: OrderDto & { pageNum: number; pageSize: number }) => {
  return request.get<{ data: OrderVo[]; total: number }, { data: OrderVo[]; total: number }>(
    '/order/getOrderList',
    { params }
  )
}

/** 获取订单详情 */
export const getOrderDetail = (params: OrderDto) => {
  return request.get<OrderVo, OrderVo>('/order/getOrderDetail', { params })
}

/** 新增订单 */
export const insertOrder = (data: OrderDto) => {
  return request.post<boolean, boolean>('/order/insertOrder', data)
}

/** 更新订单 */
export const updateOrder = (data: OrderDto) => {
  return request.post<boolean, boolean>('/order/updateOrder', data)
}

/** 删除订单 */
export const deleteOrder = (orderId: number) => {
  return request.delete<boolean, boolean>('/order/deleteOrder', { params: { orderId } })
}
