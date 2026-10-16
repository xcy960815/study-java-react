import { useCallback, useState } from 'react'
import { Alert, Button, Card, InputNumber, Progress, Space, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  runVirtualThreadBenchmark,
  type VirtualThreadBenchmarkResult,
  type VirtualThreadEngineResult,
} from '@/apis/lab'
import { useLoginStore } from '@/store'
import { hasPermission } from '@/utils/permission'

const { Text, Title } = Typography

/** 预设负载：并发规模 × 单任务阻塞时长 */
const PRESETS: Array<{ label: string; taskCount: number; sleepMillis: number }> = [
  { label: '轻量 500 × 10ms', taskCount: 500, sleepMillis: 10 },
  { label: '默认 2000 × 20ms', taskCount: 2000, sleepMillis: 20 },
  { label: '极限 3000 × 50ms', taskCount: 3000, sleepMillis: 50 },
]

interface EngineRow extends VirtualThreadEngineResult {
  key: string
  /** 吞吐占最快引擎的百分比，用于进度条对比展示 */
  throughputPercent: number
}

const buildEngineRows = (engines: VirtualThreadEngineResult[]): EngineRow[] => {
  const maxThroughput = Math.max(1, ...engines.map((engine) => engine.throughputPerSecond))
  return engines.map((engine) => ({
    ...engine,
    key: engine.engineKey,
    throughputPercent: Math.round((engine.throughputPerSecond / maxThroughput) * 100),
  }))
}

const columns: ColumnsType<EngineRow> = [
  {
    title: '引擎',
    dataIndex: 'label',
    render: (_, record) => (
      <Space size={8}>
        <span className="font-medium">{record.label}</span>
        <Text type="secondary" className="text-xs">
          {record.engineKey}
        </Text>
      </Space>
    ),
  },
  {
    title: '并发力度',
    dataIndex: 'workerCount',
    align: 'center',
    render: (_, record) =>
      record.threadType === 'VIRTUAL'
        ? `每任务一线程（≈${record.workerCount}）`
        : `${record.workerCount} 个线程`,
  },
  { title: '总耗时 (ms)', dataIndex: 'wallMillis', align: 'center' },
  {
    title: '吞吐对比',
    dataIndex: 'throughputPercent',
    render: (_, record) => (
      <div className="flex items-center gap-2">
        <Progress
          percent={record.throughputPercent}
          showInfo={false}
          strokeColor={record.threadType === 'VIRTUAL' ? '#52c41a' : '#1677ff'}
          className="w-48"
        />
        <span className="w-24 text-right font-medium">
          {record.throughputPerSecond.toLocaleString()} /s
        </span>
      </div>
    ),
  },
  {
    title: () => (
      <Tooltip title="JVM 平台线程峰值（载体线程语义），虚拟线程阻塞时不占用平台线程">
        峰值平台线程
      </Tooltip>
    ),
    dataIndex: 'peakPlatformThreads',
    align: 'center',
    render: (value: number) => <Text type="secondary">{value}</Text>,
  },
]

const VirtualThreadsLabPage: React.FC = () => {
  const [taskCount, setTaskCount] = useState<number>(2000)
  const [sleepMillis, setSleepMillis] = useState<number>(20)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<VirtualThreadBenchmarkResult | null>(null)
  const canRun = useLoginStore((state) =>
    hasPermission(state.user?.permissions, 'monitor:vthread:query')
  )

  const runBenchmark = useCallback(async () => {
    if (running) return
    setRunning(true)
    try {
      const benchmarkResult = await runVirtualThreadBenchmark({ taskCount, sleepMillis })
      setResult(benchmarkResult)
    } catch {
      // 失败提示由 request 拦截器统一弹出
    } finally {
      setRunning(false)
    }
  }, [running, sleepMillis, taskCount])

  return (
    <div className="space-y-4">
      <Card>
        <Title level={5} className="mb-2">
          虚拟线程吞吐基准（Java 21 LTS）
        </Title>
        <Alert
          type="info"
          showIcon
          className="mt-2"
          message="同一个阻塞型负载（HTTP 类慢 IO），分别用 8 / 64 个平台线程池和「每任务一线程」的虚拟线程跑完，对比吞吐。虚拟线程在阻塞时释放载体线程，因此吞吐可随任务数线性扩展。"
        />
        <Space wrap className="mt-4">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              onClick={() => {
                setTaskCount(preset.taskCount)
                setSleepMillis(preset.sleepMillis)
              }}
            >
              {preset.label}
            </Button>
          ))}
          <Tooltip title={canRun ? '' : '缺少 monitor:vthread:query 权限'}>
            <Button
              type="primary"
              icon={running ? <ReloadOutlined spin /> : <PlayCircleOutlined />}
              loading={running}
              disabled={!canRun}
              onClick={() => {
                void runBenchmark()
              }}
            >
              {running ? '基准运行中…' : '运行基准'}
            </Button>
          </Tooltip>
        </Space>
        <Space wrap className="mt-4">
          <span className="text-sm">任务总数</span>
          <InputNumber
            min={50}
            max={3000}
            step={100}
            value={taskCount}
            onChange={(value) => setTaskCount(value ?? 2000)}
          />
          <span className="text-sm">单任务阻塞 (ms)</span>
          <InputNumber
            min={5}
            max={50}
            step={5}
            value={sleepMillis}
            onChange={(value) => setSleepMillis(value ?? 20)}
          />
        </Space>
      </Card>

      {result && (
        <Card>
          <Space wrap className="mb-3">
            <Text type="secondary">Java {result.javaVersion}</Text>
            <Text type="secondary">
              任务 {result.taskCount.toLocaleString()} × {result.sleepMillis}ms 阻塞
            </Text>
            <Text type="secondary">
              全引擎总耗时 {result.totalElapsedMillis.toLocaleString()} ms
            </Text>
          </Space>
          <Table<EngineRow>
            rowKey="key"
            size="middle"
            pagination={false}
            columns={columns}
            dataSource={buildEngineRows(result.engines)}
          />
        </Card>
      )}
    </div>
  )
}

export default VirtualThreadsLabPage
