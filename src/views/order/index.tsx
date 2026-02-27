import React, { useState, useEffect } from 'react'
import { Table, Button, Form, Input, Select, Space, Tag, Modal, Pagination, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getOrderList, insertOrder, updateOrder, deleteOrder, type OrderVo } from '@/apis/order'
import { getDataDictList, type DataDictionaryVo } from '@/apis/system/dataDict'

const OrderPage: React.FC = () => {
  const [searchForm] = Form.useForm()
  const [editForm] = Form.useForm()
  /** 表格数据 */
  const [tableData, setTableData] = useState<OrderVo[]>([])
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
  const [editRecord, setEditRecord] = useState<OrderVo | null>(null)
  /** 订单状态字典 */
  const [orderStatusOptions, setOrderStatusOptions] = useState<DataDictionaryVo[]>([])
  /** 支付状态字典 */
  const [payStatusOptions, setPayStatusOptions] = useState<DataDictionaryVo[]>([])
  /** 支付方式字典 */
  const [payTypeOptions, setPayTypeOptions] = useState<DataDictionaryVo[]>([])

  /** 获取订单列表 */
  const fetchList = async (pn = pageNum, ps = pageSize) => {
    setLoading(true)
    try {
      const values = searchForm.getFieldsValue()
      const res = await getOrderList({ ...values, pageNum: pn, pageSize: ps })
      setTableData(res.data)
      setTotal(res.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /** 获取字典数据 */
  const fetchDicts = async () => {
    try {
      const [orderRes, payStatusRes, payTypeRes] = await Promise.all([
        getDataDictList({ dictType: 'order_status', status: 1, pageNum: 1, pageSize: 100 }),
        getDataDictList({ dictType: 'pay_status', status: 1, pageNum: 1, pageSize: 100 }),
        getDataDictList({ dictType: 'pay_type', status: 1, pageNum: 1, pageSize: 100 }),
      ])
      setOrderStatusOptions(orderRes.data)
      setPayStatusOptions(payStatusRes.data)
      setPayTypeOptions(payTypeRes.data)
    } catch (err) {
      console.error('获取字典失败:', err)
    }
  }

  useEffect(() => {
    fetchDicts()
    fetchList(1, 10)
  }, [])

  /** 字典渲染辅助 */
  const getDictName = (options: DataDictionaryVo[], val: number) => {
    const item = options.find((o) => Number(o.dictValue) === val)
    return item?.dictName || String(val)
  }

  /** 搜索 */
  const handleSearch = () => {
    setPageNum(1)
    fetchList(1, pageSize)
  }

  /** 新增 */
  const handleAdd = () => {
    setModalTitle('新增订单')
    setEditRecord(null)
    editForm.resetFields()
    setModalVisible(true)
  }

  /** 编辑 */
  const handleEdit = (record: OrderVo) => {
    setModalTitle('编辑订单')
    setEditRecord(record)
    editForm.setFieldsValue({ ...record })
    setModalVisible(true)
  }

  /** 删除 */
  const handleDelete = async (record: OrderVo) => {
    Modal.confirm({
      title: '确认删除该订单？',
      onOk: async () => {
        await deleteOrder(record.orderId)
        message.success('删除成功')
        fetchList()
      },
    })
  }

  /** 提交表单 */
  const handleSubmit = async () => {
    const values = await editForm.validateFields()
    if (editRecord) {
      await updateOrder({ ...values, orderId: editRecord.orderId })
    } else {
      await insertOrder(values)
    }
    message.success(editRecord ? '更新成功' : '新增成功')
    setModalVisible(false)
    fetchList()
  }

  /** 分页 */
  const handlePageChange = (page: number, size: number) => {
    setPageNum(page)
    setPageSize(size)
    fetchList(page, size)
  }

  /** 支付状态 Tag 颜色 */
  const getPayStatusColor = (val: number) => {
    if (val === -1) return 'error'
    if (val === 0) return 'warning'
    if (val === 1) return 'success'
    return 'default'
  }

  /** 订单状态 Tag 颜色 */
  const getOrderStatusColor = (val: number) => {
    if (val < 0) return 'default'
    if (val === 0) return 'warning'
    if (val === 4) return 'success'
    return 'processing'
  }

  /** 表格列定义 */
  const columns: ColumnsType<OrderVo> = [
    { title: '订单ID', dataIndex: 'orderId', align: 'center', width: 80 },
    { title: '订单号', dataIndex: 'orderNo', align: 'center', width: 200 },
    { title: '用户ID', dataIndex: 'userId', align: 'center', width: 80 },
    { title: '总价', dataIndex: 'totalPrice', align: 'center', width: 100 },
    {
      title: '支付状态',
      dataIndex: 'payStatus',
      align: 'center',
      width: 100,
      render: (val: number) => (
        <Tag color={getPayStatusColor(val)}>{getDictName(payStatusOptions, val)}</Tag>
      ),
    },
    {
      title: '支付方式',
      dataIndex: 'payType',
      align: 'center',
      width: 100,
      render: (val: number) => getDictName(payTypeOptions, val),
    },
    { title: '支付时间', dataIndex: 'payTime', align: 'center', width: 180 },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      align: 'center',
      width: 100,
      render: (val: number) => (
        <Tag color={getOrderStatusColor(val)}>{getDictName(orderStatusOptions, val)}</Tag>
      ),
    },
    { title: '收货人', dataIndex: 'userName', align: 'center', width: 100 },
    { title: '手机号', dataIndex: 'userPhone', align: 'center', width: 120 },
    { title: '收货地址', dataIndex: 'userAddress', align: 'center', width: 200, ellipsis: true },
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
    <div style={{ padding: 16 }}>
      {/* 搜索 */}
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="orderNo" label="订单号">
          <Input placeholder="订单号" allowClear style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="userId" label="用户ID">
          <Input placeholder="用户ID" allowClear style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="orderStatus" label="订单状态">
          <Select placeholder="订单状态" allowClear style={{ width: 200 }}>
            {orderStatusOptions.map((item) => (
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
        新增订单
      </Button>

      {/* 表格 */}
      <Table
        rowKey="orderId"
        columns={columns}
        dataSource={tableData}
        loading={loading}
        pagination={false}
        scroll={{ x: 1800 }}
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
            name="userId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="请输入用户ID" />
          </Form.Item>
          <Form.Item
            name="totalPrice"
            label="总价"
            rules={[{ required: true, message: '请输入总价' }]}
          >
            <Input placeholder="请输入订单总价" />
          </Form.Item>
          <Form.Item
            name="payStatus"
            label="支付状态"
            rules={[{ required: true, message: '请选择支付状态' }]}
          >
            <Select placeholder="请选择支付状态">
              <Select.Option value={0}>未支付</Select.Option>
              <Select.Option value={1}>支付成功</Select.Option>
              <Select.Option value={-1}>支付失败</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="payType"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select placeholder="请选择支付方式">
              <Select.Option value={0}>无</Select.Option>
              <Select.Option value={1}>支付宝</Select.Option>
              <Select.Option value={2}>微信</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="payTime" label="支付时间">
            <Input placeholder="请输入支付时间（YYYY-MM-DD HH:mm:ss）" />
          </Form.Item>
          <Form.Item
            name="orderStatus"
            label="订单状态"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select placeholder="请选择订单状态">
              {orderStatusOptions.map((item) => (
                <Select.Option key={item.id} value={Number(item.dictValue)}>
                  {item.dictName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="userName"
            label="收货人姓名"
            rules={[{ required: true, message: '请输入收货人姓名' }]}
          >
            <Input placeholder="请输入收货人姓名" />
          </Form.Item>
          <Form.Item
            name="userPhone"
            label="收货人手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="请输入收货人手机号" />
          </Form.Item>
          <Form.Item
            name="userAddress"
            label="收货人地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入收货人地址" />
          </Form.Item>
          <Form.Item name="extraInfo" label="订单备注">
            <Input placeholder="请输入订单备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderPage
