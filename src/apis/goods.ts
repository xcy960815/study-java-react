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
  /** 分类名称 */
  categoryName?: string
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

/**
 * 获取商品列表。
 *
 * @param params - 商品查询条件与分页参数
 * @returns 商品分页结果
 */
export const getGoodsList = (params: GoodsDto & { pageNum: number; pageSize: number }) => {
  return request.get<{ data: GoodsVo[]; total: number }, { data: GoodsVo[]; total: number }>(
    '/goods/getGoodsList',
    { params }
  )
}

/**
 * 按条件获取商品详情。
 *
 * @param params - 商品查询条件（如商品ID）
 * @returns 商品详情
 */
export const getGoodsInfo = (params: GoodsDto) => {
  return request.get<GoodsVo, GoodsVo>('/goods/getGoodsInfo', { params })
}

/**
 * 新增商品。
 *
 * @param data - 待新增的商品信息
 * @returns 是否新增成功
 */
export const insertGoods = (data: GoodsDto) => {
  return request.put<boolean, boolean>('/goods/insertGoods', data)
}

/**
 * 更新商品信息。
 *
 * @param data - 待更新的商品信息
 * @returns 是否更新成功
 */
export const updateGoods = (data: GoodsDto) => {
  return request.post<boolean, boolean>('/goods/updateGoods', data)
}

/** 商品分类 Vo */
export interface GoodsCategoryVo {
  categoryId: number
  parentId: number
  categoryName: string
  categoryLevel: number
  orderNum: number
  remark?: string
  children?: GoodsCategoryVo[]
}

/** 商品分类请求参数 */
export interface GoodsCategoryDto {
  categoryId?: number
  parentId: number
  categoryName: string
  orderNum?: number
  remark?: string
}

/**
 * 获取商品分类树。
 *
 * @returns 商品分类树
 */
export const getGoodsCategoryTree = () => {
  return request.get<GoodsCategoryVo[], GoodsCategoryVo[]>('/goods/category/tree')
}

/**
 * 新增商品分类。
 *
 * @param data - 待新增的分类信息
 * @returns 是否新增成功
 */
export const insertGoodsCategory = (data: GoodsCategoryDto) => {
  return request.post<boolean, boolean>('/goods/category', data)
}

/**
 * 更新商品分类。
 *
 * @param data - 待更新的分类信息
 * @returns 是否更新成功
 */
export const updateGoodsCategory = (data: GoodsCategoryDto) => {
  return request.put<boolean, boolean>('/goods/category', data)
}

/**
 * 删除商品分类。
 *
 * @param categoryId - 分类ID
 * @returns 是否删除成功
 */
export const deleteGoodsCategory = (categoryId: number) => {
  return request.delete<boolean, boolean>(`/goods/category/${categoryId}`)
}

/**
 * 删除商品。
 *
 * @param id - 商品ID
 * @returns 是否删除成功
 */
export const deleteGoods = (id: number) => {
  return request.delete<boolean, boolean>('/goods/deleteGoods', { params: { id } })
}
