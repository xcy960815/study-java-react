import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Modal,
  Popconfirm,
  InputNumber,
  Radio,
  Space,
  message,
} from 'antd'
import type { TableColumnsType, TablePaginationConfig } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  getDataDictList,
  insertDataDict,
  updateDataDict,
  deleteDataDict,
} from '@/apis/system/dataDict'
import type {
  DataDictionaryVo,
  DataDictionaryDto,
  DataDictListParams,
} from '@/apis/system/dataDict'

const { Option } = Select

type DataDictionarySearchValues = Pick<DataDictListParams, 'dictType' | 'dictName' | 'status'>

type DataDictionaryFormValues = DataDictionaryDto

type PaginationState = {
  current: number
  pageSize: number
}

const DataDictionaryList: React.FC = () => {
  // 搜索表单
  const [searchForm] = Form.useForm<DataDictionarySearchValues>()

  // 弹窗表单
  const [modalForm] = Form.useForm<DataDictionaryFormValues>()

  // 表格数据
  const [tableData, setTableData] = useState<DataDictionaryVo[]>([])

  // 总数
  const [total, setTotal] = useState(0)

  // 加载状态
  const [loading, setLoading] = useState(false)

  // 分页
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 10 })

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)

  // 弹窗标题
  const [modalTitle, setModalTitle] = useState('添加字典')

  // 保存加载状态
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    fetchDataDictList()
  }, [])

  // 请求数据字典列表
  const fetchDataDictList = async (page = pagination.current, size = pagination.pageSize) => {
    setLoading(true)
    try {
      const searchValues = searchForm.getFieldsValue()
      const res = await getDataDictList({
        pageNum: page,
        pageSize: size,
        ...searchValues,
      })
      setTableData(res.data || [])
      setTotal(res.total || 0)
      setPagination({ current: page, pageSize: size })
    } catch (e) {
      console.error('Failed to fetch data dict list')
    } finally {
      setLoading(false)
    }
  }

  // 搜索
  const handleSearch = () => {
    fetchDataDictList(1, pagination.pageSize)
  }

  // 重置
  const handleReset = () => {
    searchForm.resetFields()
    fetchDataDictList(1, 10)
  }

  // 表格切换
  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchDataDictList(pag.current ?? pagination.current, pag.pageSize ?? pagination.pageSize)
  }

  // 新增字典
  const handleAdd = () => {
    setModalTitle('添加字典')
    modalForm.resetFields()
    modalForm.setFieldsValue({ sortOrder: 0, status: 1 })
    setModalVisible(true)
  }

  // 修改字典
  const handleEdit = (record: DataDictionaryVo) => {
    setModalTitle('修改字典')
    modalForm.setFieldsValue(record)
    setModalVisible(true)
  }

  // 删除字典
  const handleDelete = async (record: DataDictionaryVo) => {
    try {
      await deleteDataDict(record.id)
      message.success('删除成功')
      fetchDataDictList()
    } catch (e) {
      console.error('Failed to delete')
    }
  }

  // 弹窗确认
  const handleModalOk = async () => {
    try {
      const values = await modalForm.validateFields()
      setSaveLoading(true)
      const { id, ...payload } = values
      if (id) {
        await updateDataDict({ ...payload, id })
      } else {
        await insertDataDict(payload)
      }
      message.success('操作成功')
      setModalVisible(false)
      fetchDataDictList()
    } catch (e) {
      console.error('Validation failed', e)
    } finally {
      setSaveLoading(false)
    }
  }

  const columns: TableColumnsType<DataDictionaryVo> = [
    {
      title: '序号',
      key: 'index',
      width: 55,
      align: 'center' as const,
      render: (_value, _record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: '字典类型',
      dataIndex: 'dictType',
      key: 'dictType',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '字典编码',
      dataIndex: 'dictCode',
      key: 'dictCode',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '字典名称',
      dataIndex: 'dictName',
      key: 'dictName',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '字典值',
      dataIndex: 'dictValue',
      key: 'dictValue',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '排序号',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center' as const,
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'error'}>{status === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 200,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      align: 'center' as const,
      render: (_value, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)} className="p-0">
            修改
          </Button>
          <Popconfirm title="确认要删除该字典吗？" onConfirm={() => handleDelete(record)}>
            <Button type="link" danger className="p-0">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="dictType" label="字典类型">
          <Input
            placeholder="请输入字典类型"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="dictName" label="字典名称">
          <Input
            placeholder="请输入字典名称"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态" style={{ width: 200 }} allowClear>
            <Option value={1}>启用</Option>
            <Option value={0}>禁用</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增字典
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
        bordered
      />

      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saveLoading}
        width={500}
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="dictType"
            label="字典类型"
            rules={[{ required: true, message: '字典类型不能为空' }]}
          >
            <Input placeholder="请输入字典类型" />
          </Form.Item>
          <Form.Item
            name="dictCode"
            label="字典编码"
            rules={[{ required: true, message: '字典编码不能为空' }]}
          >
            <Input placeholder="请输入字典编码" />
          </Form.Item>
          <Form.Item
            name="dictName"
            label="字典名称"
            rules={[{ required: true, message: '字典名称不能为空' }]}
          >
            <Input placeholder="请输入字典名称" />
          </Form.Item>
          <Form.Item
            name="dictValue"
            label="字典值"
            rules={[{ required: true, message: '字典值不能为空' }]}
          >
            <Input placeholder="请输入字典值" />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序号"
            rules={[{ required: true, message: '排序号不能为空' }]}
          >
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '状态不能为空' }]}
          >
            <Radio.Group>
              <Radio value={1}>启用</Radio>
              <Radio value={0}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DataDictionaryList
