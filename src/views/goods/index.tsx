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
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getGoodsList, insertGoods, updateGoods, deleteGoods, type GoodsVo } from '@/apis/goods'
import type { GoodsDto } from '@/apis/goods'
import { getDataDictList, type DataDictionaryVo } from '@/apis/system/dataDict'

type GoodsSearchValues = Pick<GoodsDto, 'goodsName' | 'goodsCategoryId' | 'goodsSellStatus'>

type GoodsFormValues = GoodsDto

const GoodsPage: React.FC = () => {
  const defaultPageSize = 10
  const [searchForm] = Form.useForm<GoodsSearchValues>()
  const [editForm] = Form.useForm<GoodsFormValues>()
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
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
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

      {/* 表格 */}
      <Table
        rowKey="goodsId"
        columns={columns}
        dataSource={tableData}
        loading={loading}
        pagination={false}
        scroll={{ x: 1600 }}
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
    </div>
  )
}

export default GoodsPage
