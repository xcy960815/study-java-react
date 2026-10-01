import { useEffect, useState } from 'react'
import { Button, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { getDeepSeekBalance, getDeepSeekModels, type DeepSeekModel } from '@/apis/deepseek'

const DeepSeekModelsPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<DeepSeekModel[]>([])

  const loadModels = async () => {
    setLoading(true)
    try {
      const result = await getDeepSeekModels()
      setModels(result.data || [])
    } catch {
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadModels()
  }, [])

  const handleBalance = async () => {
    const result = await getDeepSeekBalance()
    const total = result.balance_infos?.[0]?.total_balance
    message.success(total ? `当前余额：${total}` : '已获取余额')
  }

  const columns: ColumnsType<DeepSeekModel> = [
    { title: '模型名称', dataIndex: 'id' },
    { title: '类型', dataIndex: 'object' },
    { title: '来源', dataIndex: 'owned_by' },
    {
      title: '注册时间',
      dataIndex: 'created',
      render: (created: DeepSeekModel['created']) => (created === 0 ? '未知' : created),
    },
    {
      title: '操作',
      width: 120,
      render: (_, row) => (
        <Button
          type="link"
          onClick={() => navigate(`/deepseek/chat?model=${encodeURIComponent(row.id)}`)}
        >
          开始对话
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Space className="mb-4">
        <Button type="primary" onClick={() => void handleBalance()}>
          获取余额
        </Button>
        <Button onClick={() => void loadModels()}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={models}
        pagination={false}
      />
    </div>
  )
}

export default DeepSeekModelsPage
