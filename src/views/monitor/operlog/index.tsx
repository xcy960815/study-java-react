import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Pagination,
  Popconfirm,
  Descriptions,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getOperLogList, deleteOperLog, cleanOperLog, type OperLogVo } from '@/apis/monitor/operlog'
import { getDataDictList, type DataDictionaryVo } from '@/apis/system/dataDict'

/** 操作类型映射 */
const businessTypeNames = [
  '其它',
  '新增',
  '修改',
  '删除',
  '授权',
  '导出',
  '导入',
  '强退',
  '生成代码',
  '清空数据',
  '查询',
]

/** 格式化操作人员名称（可能是 JSON） */
const formatOperName = (operName: string) => {
  if (!operName) return '-'
  try {
    const data = JSON.parse(operName)
    return data.loginName || data.userName || operName
  } catch {
    return operName
  }
}

/** 请求方法颜色映射 */
const methodColorMap: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
}

/** 格式化 JSON 字符串 */
const formatJson = (json: string) => {
  if (!json) return ''
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}

const OperlogPage: React.FC = () => {
  const [form] = Form.useForm()
  /** 表格数据 */
  const [tableData, setTableData] = useState<OperLogVo[]>([])
  /** 总条数 */
  const [total, setTotal] = useState(0)
  /** 当前页码 */
  const [pageNum, setPageNum] = useState(1)
  /** 每页条数 */
  const [pageSize, setPageSize] = useState(10)
  /** 加载状态 */
  const [loading, setLoading] = useState(false)
  /** 选中行 ID */
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  /** 详情弹窗可见性 */
  const [detailVisible, setDetailVisible] = useState(false)
  /** 当前详情记录 */
  const [detailRecord, setDetailRecord] = useState<OperLogVo | null>(null)
  /** 操作类型字典选项 */
  const [businessTypeOptions, setBusinessTypeOptions] = useState<DataDictionaryVo[]>([])

  /** 获取操作日志列表 */
  const fetchList = async (pn = pageNum, ps = pageSize) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await getOperLogList({ ...values, pageNum: pn, pageSize: ps })
      setTableData(res.data)
      setTotal(res.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /** 获取操作类型字典 */
  const fetchBusinessTypeDict = async () => {
    try {
      const res = await getDataDictList({
        dictType: 'sys_oper_type',
        status: 1,
        pageNum: 1,
        pageSize: 100,
      })
      setBusinessTypeOptions(res.data)
    } catch (err) {
      console.error('获取操作类型字典失败:', err)
    }
  }

  useEffect(() => {
    fetchBusinessTypeDict()
    fetchList(1, 10)
  }, [])

  /** 搜索 */
  const handleSearch = () => {
    setPageNum(1)
    fetchList(1, pageSize)
  }

  /** 重置 */
  const handleReset = () => {
    form.resetFields()
    setPageNum(1)
    setPageSize(10)
    fetchList(1, 10)
  }

  /** 批量删除 */
  const handleDeleteBatch = async () => {
    if (!selectedIds.length) return
    try {
      await deleteOperLog(selectedIds)
      message.success('删除成功')
      fetchList()
    } catch {
      // ignore
    }
  }

  /** 清空全部 */
  const handleCleanAll = async () => {
    try {
      await cleanOperLog()
      message.success('清空成功')
      fetchList()
    } catch {
      // ignore
    }
  }

  /** 表格列定义 */
  const columns: ColumnsType<OperLogVo> = [
    { title: '日志编号', dataIndex: 'operId', align: 'center', width: 100 },
    { title: '系统模块', dataIndex: 'title', align: 'center' },
    {
      title: '操作类型',
      dataIndex: 'businessType',
      align: 'center',
      render: (val: number) => {
        const colorMap: Record<number, string> = { 1: 'blue', 2: 'orange', 3: 'red' }
        return <Tag color={colorMap[val]}>{businessTypeNames[val] || val}</Tag>
      },
    },
    {
      title: '操作人员',
      dataIndex: 'operName',
      align: 'center',
      render: (val: string) => formatOperName(val),
    },
    { title: '主机', dataIndex: 'operIp', align: 'center', width: 130, ellipsis: true },
    {
      title: '操作状态',
      dataIndex: 'status',
      align: 'center',
      render: (val: number) => (
        <Tag color={val === 0 ? 'success' : 'error'}>{val === 0 ? '正常' : '异常'}</Tag>
      ),
    },
    { title: '操作日期', dataIndex: 'operTime', align: 'center', width: 180 },
    { title: '消耗时间', dataIndex: 'costTime', align: 'center' },
    {
      title: '操作',
      align: 'center',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setDetailRecord(record)
            setDetailVisible(true)
          }}
        >
          详细
        </Button>
      ),
    },
  ]

  /** 分页变化 */
  const handlePageChange = (page: number, size: number) => {
    setPageNum(page)
    setPageSize(size)
    fetchList(page, size)
  }

  return (
    <div style={{ padding: 16 }}>
      {/* 搜索区域 */}
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="title" label="系统模块">
          <Input
            placeholder="请输入系统模块"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="operName" label="操作人员">
          <Input
            placeholder="请输入操作人员"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="businessType" label="类型">
          <Select placeholder="操作类型" allowClear style={{ width: 200 }}>
            {businessTypeOptions.map((item) => (
              <Select.Option key={item.id} value={Number(item.dictValue)}>
                {item.dictName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="操作状态" allowClear style={{ width: 200 }}>
            <Select.Option value={0}>正常</Select.Option>
            <Select.Option value={1}>异常</Select.Option>
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

      {/* 操作按钮 */}
      <Space style={{ marginBottom: 16 }}>
        <Popconfirm title="确认删除选中的日志?" onConfirm={handleDeleteBatch}>
          <Button danger disabled={!selectedIds.length}>
            删除
          </Button>
        </Popconfirm>
        <Popconfirm title="确认清空所有操作日志?" onConfirm={handleCleanAll}>
          <Button danger>清空</Button>
        </Popconfirm>
      </Space>

      {/* 表格 */}
      <Table
        rowKey="operId"
        columns={columns}
        dataSource={tableData}
        loading={loading}
        pagination={false}
        rowSelection={{
          onChange: (keys) => setSelectedIds(keys as number[]),
        }}
      />

      {/* 分页 */}
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

      {/* 详情弹窗 */}
      <Modal
        title="操作日志详细"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          <Button type="primary" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        }
        width={900}
      >
        {detailRecord && (
          <div>
            {/* 基本信息 */}
            <Descriptions
              title="基本信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="操作模块">{detailRecord.title}</Descriptions.Item>
              <Descriptions.Item label="操作类型">
                <Tag>
                  {businessTypeNames[detailRecord.businessType] || detailRecord.businessType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作状态">
                <Tag color={detailRecord.status === 0 ? 'success' : 'error'}>
                  {detailRecord.status === 0 ? '正常' : '失败'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="消耗时间">{detailRecord.costTime} 毫秒</Descriptions.Item>
            </Descriptions>

            {/* 请求信息 */}
            <Descriptions
              title="请求信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="请求地址" span={2}>
                <code>{detailRecord.operUrl}</code>
              </Descriptions.Item>
              <Descriptions.Item label="请求方式">
                <Tag color={methodColorMap[detailRecord.requestMethod?.toUpperCase()] || 'default'}>
                  {detailRecord.requestMethod}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作方法" span={2}>
                <code>{detailRecord.method}</code>
              </Descriptions.Item>
            </Descriptions>

            {/* 用户信息 */}
            <Descriptions
              title="用户信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="操作人员">
                {formatOperName(detailRecord.operName)}
              </Descriptions.Item>
              <Descriptions.Item label="主机地址">
                <code>{detailRecord.operIp}</code>
              </Descriptions.Item>
            </Descriptions>

            {/* 请求参数 */}
            <Descriptions
              title="请求参数"
              bordered
              column={1}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item>
                {detailRecord.operParam ? (
                  <pre style={{ margin: 0, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                    {formatJson(detailRecord.operParam)}
                  </pre>
                ) : (
                  '无'
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* 返回参数 */}
            <Descriptions
              title="返回参数"
              bordered
              column={1}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item>
                {detailRecord.jsonResult ? (
                  <pre style={{ margin: 0, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                    {formatJson(detailRecord.jsonResult)}
                  </pre>
                ) : (
                  '无'
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* 异常信息 */}
            {detailRecord.status === 1 && detailRecord.errorMsg && (
              <Descriptions title="异常信息" bordered column={1} size="small">
                <Descriptions.Item>
                  <span style={{ color: '#ff4d4f' }}>{detailRecord.errorMsg}</span>
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OperlogPage
