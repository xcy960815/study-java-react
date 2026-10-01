import { useEffect, useState } from 'react'
import { Button, Modal, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import {
  deleteOllamaModel,
  getOllamaModels,
  getOllamaPs,
  getOllamaVersion,
  type OllamaModel,
  type OllamaPsModel,
} from '@/apis/ollama'

const formatTime = (value?: string) => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

const OllamaModelsPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<OllamaModel[]>([])
  const [runningOpen, setRunningOpen] = useState(false)
  const [runningModels, setRunningModels] = useState<OllamaPsModel[]>([])

  const loadModels = async () => {
    setLoading(true)
    try {
      const result = await getOllamaModels()
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

  const openChat = (model?: string) => {
    navigate(model ? `/ollama/chat?model=${encodeURIComponent(model)}` : '/ollama/chat')
  }

  const showVersion = async () => {
    const result = await getOllamaVersion()
    message.info(`当前 Ollama 版本是 ${result.version}`)
  }

  const showRunning = async () => {
    const result = await getOllamaPs()
    setRunningModels(result.models || [])
    setRunningOpen(true)
  }

  const removeModel = (name: string) => {
    Modal.confirm({
      title: '警告',
      content: `确认要删除模型【${name}】吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const removed = await deleteOllamaModel(name)
        if (!removed) {
          return
        }
        message.success('操作成功')
        await loadModels()
      },
    })
  }

  const columns: ColumnsType<OllamaModel> = [
    { title: '模型名称', dataIndex: 'id' },
    { title: '类型', dataIndex: 'object' },
    { title: '来源', dataIndex: 'owned_by' },
    { title: '注册时间', dataIndex: 'created' },
    {
      title: '操作',
      width: 180,
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => openChat(row.id)}>
            开始对话
          </Button>
          <Button type="link" danger onClick={() => removeModel(row.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const runningColumns: ColumnsType<OllamaPsModel> = [
    { title: '模型名称', dataIndex: 'name' },
    { title: '模型标识', dataIndex: 'model' },
    {
      title: '销毁时间',
      dataIndex: 'expires_at',
      render: (value: string | undefined) => formatTime(value),
    },
    {
      title: '操作',
      width: 180,
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => openChat(row.name)}>
            开始对话
          </Button>
          <Button type="link" danger onClick={() => removeModel(row.name)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space className="mb-4">
        <Button type="primary" onClick={() => openChat()}>
          开始对话
        </Button>
        <Button onClick={() => void showVersion()}>查看本地 Ollama 版本</Button>
        <Button onClick={() => void showRunning()}>查看正在运行的模型</Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={models}
        pagination={false}
      />
      <Modal
        title="正在内存运行的模型"
        open={runningOpen}
        footer={null}
        onCancel={() => setRunningOpen(false)}
        width={760}
      >
        <Table
          rowKey="name"
          columns={runningColumns}
          dataSource={runningModels}
          pagination={false}
        />
      </Modal>
    </div>
  )
}

export default OllamaModelsPage
