import { request } from '@/utils/request'

/** 商品 Vo */
export interface GoodsVo {
  /** 商品ID */
  goodsId: number
  /** 商品名称 */
  goodsName: string
  /** 商品简介 */
  goodsIntro: string
  /** 分类ID */
  goodsCategoryId: number
  /** 封面图 */
  goodsCoverImg: string
  /** 轮播图 */
  goodsCarousel: string
  /** 商品详情 */
  goodsDetailContent: string
  /** 原价 */
  originalPrice: number
  /** 售价 */
  sellingPrice: number
  /** 库存 */
  stockNum: number
  /** 标签 */
  tag: string
  /** 上架状态（0下架 1上架） */
  goodsSellStatus: number
  /** 创建人 */
  createUser: string
  /** 创建时间 */
  createTime: string
  /** 更新人 */
  updateUser: string
  /** 更新时间 */
  updateTime: string
}

/** 商品请求参数 */
export interface GoodsDto {
  goodsId?: number
  goodsName?: string
  goodsIntro?: string
  goodsCategoryId?: number
  goodsCoverImg?: string
  goodsCarousel?: string
  goodsDetailContent?: string
  originalPrice?: number
  sellingPrice?: number
  stockNum?: number
  tag?: string
  goodsSellStatus?: number
}

/** 获取商品列表 */
export const getGoodsList = (params: GoodsDto & { pageNum: number; pageSize: number }) => {
  return request.get<{ data: GoodsVo[]; total: number }, { data: GoodsVo[]; total: number }>(
    '/goods/getGoodsList',
    { params }
  )
}

/** 获取商品详情 */
export const getGoodsInfo = (params: GoodsDto) => {
  return request.get<GoodsVo, GoodsVo>('/goods/getGoodsInfo', { params })
}

/** 新增商品 */
export const insertGoods = (data: GoodsDto) => {
  return request.put<boolean, boolean>('/goods/insertGoods', data)
}

/** 更新商品 */
export const updateGoods = (data: GoodsDto) => {
  return request.post<boolean, boolean>('/goods/updateGoods', data)
}

/** 删除商品 */
export const deleteGoods = (id: number) => {
  return request.delete<boolean, boolean>('/goods/deleteGoods', { params: { id } })
}
