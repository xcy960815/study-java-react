import React, { useCallback, useEffect, useState } from 'react'
import {
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Modal,
  Pagination,
  Image,
  message,
  List,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { getGoodsList, insertGoods, updateGoods, deleteGoods, type GoodsVo } from '@/apis/goods'
import type { GoodsDto } from '@/apis/goods'
import { getDataDictList, type DataDictionaryVo } from '@/apis/system/dataDict'
import { placeOrder } from '@/apis/order'
import { useLoginStore } from '@/store'
import { hasPermission } from '@/utils/permission'

type GoodsSearchValues = Pick<GoodsDto, 'goodsName' | 'goodsCategoryId' | 'goodsSellStatus'>

type GoodsFormValues = GoodsDto

interface CheckoutFormValues {
  userName: string
  userPhone: string
  userAddress: string
}

const GoodsPage: React.FC = () => {
  const defaultPageSize = 10
  const [searchForm] = Form.useForm<GoodsSearchValues>()
  const [editForm] = Form.useForm<GoodsFormValues>()
  const [checkoutForm] = Form.useForm<CheckoutFormValues>()
  const navigate = useNavigate()
  const user = useLoginStore((state) => state.user)
  const canPlaceOrder = useLoginStore((state) =>
    hasPermission(state.user?.permissions, 'order:add')
  )
  /** 表格数据 */
  const [tableData, setTableData] = useState<GoodsVo[]>([])
  /** 总条数 */
  const [total, setTotal] = useState(0)
  /** 当前页码 */
  const [pageNum, setPageNum] = useState(1)
  /** 每页条数 */
  const [pageSize, setPageSize] = useState(10)
  /** 加载状态 */
  const [loading, setLoading] = useState(false)
  /** 弹窗可见 */
  const [modalVisible, setModalVisible] = useState(false)
  /** 弹窗标题 */
  const [modalTitle, setModalTitle] = useState('')
  /** 当前编辑记录 */
  const [editRecord, setEditRecord] = useState<GoodsVo | null>(null)
  /** 上架状态字典 */
  const [sellStatusOptions, setSellStatusOptions] = useState<DataDictionaryVo[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [checkoutGoods, setCheckoutGoods] = useState<GoodsVo[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [checkoutVisible, setCheckoutVisible] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)

  /** 获取商品列表 */
  const fetchList = useCallback(
    async (pn: number, ps: number) => {
      setLoading(true)
      try {
        const values = searchForm.getFieldsValue()
        const res = await getGoodsList({ ...values, pageNum: pn, pageSize: ps })
        setTableData(res.data)
        setTotal(res.total)
      } catch {
        message.error('获取商品列表失败，请稍后重试。')
      } finally {
        setLoading(false)
      }
    },
    [searchForm]
  )

  /** 获取上架状态字典 */
  const fetchSellStatusDict = useCallback(async () => {
    try {
      const res = await getDataDictList({
        dictType: 'goods_sell_status',
        status: 1,
        pageNum: 1,
        pageSize: 100,
      })
      setSellStatusOptions(res.data)
    } catch {
      message.error('获取上架状态字典失败，请稍后重试。')
    }
  }, [])

  useEffect(() => {
    void fetchSellStatusDict()
    void fetchList(1, defaultPageSize)
  }, [fetchList, fetchSellStatusDict])

  /** 字典渲染辅助 */
  const getDictName = (val: number) => {
    const item = sellStatusOptions.find((o) => Number(o.dictValue) === val)
    return item?.dictName || String(val)
  }

  /** 搜索 */
  const handleSearch = () => {
    setPageNum(1)
    void fetchList(1, pageSize)
  }

  /** 新增 */
  const handleAdd = () => {
    setModalTitle('新增商品')
    setEditRecord(null)
    editForm.resetFields()
    setModalVisible(true)
  }

  /** 编辑 */
  const handleEdit = (record: GoodsVo) => {
    setModalTitle('编辑商品')
    setEditRecord(record)
    editForm.setFieldsValue({ ...record })
    setModalVisible(true)
  }

  /** 删除 */
  const handleDelete = (record: GoodsVo) => {
    Modal.confirm({
      title: '确认删除该商品？',
      onOk: async () => {
        await deleteGoods(record.goodsId)
        message.success('删除成功')
        await fetchList(pageNum, pageSize)
      },
    })
  }

  /** 提交表单 */
  const handleSubmit = async () => {
    const values = await editForm.validateFields()
    if (editRecord) {
      await updateGoods({ ...values, goodsId: editRecord.goodsId })
    } else {
      await insertGoods(values)
    }
    message.success(editRecord ? '更新成功' : '新增成功')
    setModalVisible(false)
    await fetchList(pageNum, pageSize)
  }

  /** 分页 */
  const handlePageChange = (page: number, size: number) => {
    setPageNum(page)
    setPageSize(size)
    void fetchList(page, size)
  }

  const openCheckout = (goods: GoodsVo[]) => {
    const purchasableGoods = goods.filter((item) => item.goodsSellStatus === 1 && item.stockNum > 0)
    if (!purchasableGoods.length) {
      message.warning('请选择有库存的上架商品')
      return
    }
    if (purchasableGoods.length > 50) {
      message.warning('一个订单最多包含50种商品')
      return
    }
    setCheckoutGoods(purchasableGoods)
    setQuantities(Object.fromEntries(purchasableGoods.map((item) => [item.goodsId, 1])))
    checkoutForm.setFieldsValue({
      userName: user?.nickName || '',
      userPhone: /^\d{11}$/.test(user?.loginName || '') ? user?.loginName : '',
      userAddress: user?.address || '',
    })
    setCheckoutVisible(true)
  }

  const handlePlaceOrder = async () => {
    if (!user?.id || placingOrder) {
      if (!user?.id) message.error('无法获取当前登录用户，请重新登录后重试')
      return
    }
    const values = await checkoutForm.validateFields()
    setPlacingOrder(true)
    try {
      const order = await placeOrder({
        userId: user.id,
        ...values,
        items: checkoutGoods.map((item) => ({
          goodsId: item.goodsId,
          quantity: quantities[item.goodsId] || 1,
        })),
      })
      message.success(`订单 ${order.orderNo} 创建成功，金额以订单结果为准`)
      setCheckoutVisible(false)
      setSelectedRowKeys([])
      navigate(`/order?orderId=${order.orderId}`)
    } finally {
      setPlacingOrder(false)
    }
  }

  /** 表格列 */
  const columns: ColumnsType<GoodsVo> = [
    { title: '商品ID', dataIndex: 'goodsId', align: 'center', width: 80 },
    { title: '商品名称', dataIndex: 'goodsName', align: 'center', width: 150 },
    { title: '商品简介', dataIndex: 'goodsIntro', align: 'center', width: 200, ellipsis: true },
    { title: '分类ID', dataIndex: 'goodsCategoryId', align: 'center', width: 80 },
    {
      title: '封面图',
      dataIndex: 'goodsCoverImg',
      align: 'center',
      width: 100,
      render: (val: string) =>
        val ? <Image src={val} width={60} height={60} style={{ objectFit: 'cover' }} /> : '无图片',
    },
    { title: '原价', dataIndex: 'originalPrice', align: 'center', width: 80 },
    { title: '售价', dataIndex: 'sellingPrice', align: 'center', width: 80 },
    { title: '库存', dataIndex: 'stockNum', align: 'center', width: 80 },
    { title: '标签', dataIndex: 'tag', align: 'center', width: 100 },
    {
      title: '上架状态',
      dataIndex: 'goodsSellStatus',
      align: 'center',
      width: 100,
      render: (val: number) => (
        <Tag color={val === 1 ? 'success' : 'default'}>{getDictName(val)}</Tag>
      ),
    },
    { title: '创建人', dataIndex: 'createUser', align: 'center', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', align: 'center', width: 180 },
    {
      title: '操作',
      align: 'center',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {canPlaceOrder && (
            <Button
              type="link"
              size="small"
              disabled={record.goodsSellStatus !== 1 || record.stockNum < 1}
              onClick={() => openCheckout([record])}
            >
              立即购买
            </Button>
          )}
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="goods-page" style={{ padding: 16 }}>
      {/* 搜索 */}
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="goodsName" label="商品名称">
          <Input placeholder="商品名称" allowClear style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="goodsCategoryId" label="分类ID">
          <InputNumber placeholder="分类ID" style={{ width: 150 }} min={0} />
        </Form.Item>
        <Form.Item name="goodsSellStatus" label="上架状态">
          <Select placeholder="上架状态" allowClear style={{ width: 200 }}>
            {sellStatusOptions.map((item) => (
              <Select.Option key={item.id} value={Number(item.dictValue)}>
                {item.dictName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
        </Form.Item>
      </Form>

      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>
        新增商品
      </Button>
      {canPlaceOrder && (
        <Button
          type="primary"
          ghost
          disabled={!selectedRowKeys.length}
          onClick={() =>
            openCheckout(tableData.filter((item) => selectedRowKeys.includes(item.goodsId)))
          }
          style={{ marginBottom: 16, marginLeft: 8 }}
        >
          购买已选商品（{selectedRowKeys.length}）
        </Button>
      )}

      {/* 表格 */}
      <Table
        rowKey="goodsId"
        columns={columns}
        dataSource={tableData}
        loading={loading}
        pagination={false}
        scroll={{ x: 1700 }}
        rowSelection={
          canPlaceOrder
            ? {
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                getCheckboxProps: (record) => ({
                  disabled: record.goodsSellStatus !== 1 || record.stockNum < 1,
                }),
              }
            : undefined
        }
      />
      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Pagination
            current={pageNum}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showTotal={(t) => `共 ${t} 条`}
            onChange={handlePageChange}
          />
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={editForm} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item
            name="goodsName"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item name="goodsIntro" label="商品简介">
            <Input placeholder="请输入商品简介" />
          </Form.Item>
          <Form.Item
            name="goodsCategoryId"
            label="分类ID"
            rules={[{ required: true, message: '请输入分类ID' }]}
          >
            <InputNumber placeholder="请输入分类ID" min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="goodsCoverImg" label="封面图">
            <Input placeholder="请输入封面图URL" />
          </Form.Item>
          <Form.Item name="goodsCarousel" label="轮播图">
            <Input placeholder="请输入轮播图URL" />
          </Form.Item>
          <Form.Item name="goodsDetailContent" label="商品详情">
            <Input.TextArea placeholder="请输入商品详情" rows={3} />
          </Form.Item>
          <Form.Item name="originalPrice" label="原价">
            <InputNumber placeholder="请输入原价" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="sellingPrice"
            label="售价"
            rules={[{ required: true, message: '请输入售价' }]}
          >
            <InputNumber placeholder="请输入售价" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="stockNum"
            label="库存"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <InputNumber
              placeholder="请输入库存数量"
              min={0}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="tag" label="标签">
            <Input placeholder="请输入标签" />
          </Form.Item>
          <Form.Item
            name="goodsSellStatus"
            label="上架状态"
            rules={[{ required: true, message: '请选择上架状态' }]}
          >
            <Select placeholder="请选择上架状态">
              {sellStatusOptions.map((item) => (
                <Select.Option key={item.id} value={Number(item.dictValue)}>
                  {item.dictName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交订单"
        open={checkoutVisible}
        onOk={() => handlePlaceOrder()}
        onCancel={() => !placingOrder && setCheckoutVisible(false)}
        okText="提交订单"
        confirmLoading={placingOrder}
        okButtonProps={{ disabled: placingOrder }}
        cancelButtonProps={{ disabled: placingOrder }}
        width={720}
      >
        <List
          header="商品及购买数量（价格仅供展示，订单金额以后端为准）"
          dataSource={checkoutGoods}
          renderItem={(item) => (
            <List.Item
              actions={[
                <InputNumber
                  key="quantity"
                  aria-label={`${item.goodsName}购买数量`}
                  min={1}
                  max={Math.min(999, item.stockNum)}
                  precision={0}
                  value={quantities[item.goodsId] || 1}
                  onChange={(value) =>
                    setQuantities((current) => ({
                      ...current,
                      [item.goodsId]: value || 1,
                    }))
                  }
                />,
              ]}
            >
              <List.Item.Meta
                title={item.goodsName}
                description={`展示单价：¥${item.sellingPrice.toFixed(2)}；库存：${item.stockNum}`}
              />
            </List.Item>
          )}
        />
        <Form form={checkoutForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="userName"
            label="收货人姓名"
            rules={[
              { required: true, whitespace: true, message: '请输入收货人姓名' },
              { max: 30, message: '收货人姓名不能超过30个字符' },
            ]}
          >
            <Input maxLength={30} showCount />
          </Form.Item>
          <Form.Item
            name="userPhone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^\d{11}$/, message: '手机号必须是11位数字' },
            ]}
          >
            <Input maxLength={11} />
          </Form.Item>
          <Form.Item
            name="userAddress"
            label="收货地址"
            rules={[
              { required: true, whitespace: true, message: '请输入收货地址' },
              { max: 100, message: '收货地址不能超过100个字符' },
            ]}
          >
            <Input.TextArea maxLength={100} showCount rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GoodsPage
