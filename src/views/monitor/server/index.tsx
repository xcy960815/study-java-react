import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  message,
  Select,
  Segmented,
  Empty,
  Spin,
  theme,
} from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import {
  getServerInfo,
  startServerMonitor,
  stopServerMonitor,
  getServerMetricsHistory,
  type ServerInfoVo,
  type ServerMetricKey,
  type ServerMetricValue,
  type ServerMetricsHistoryPoint,
} from '@/apis/monitor/serverMonitor'
import { getSharedWebSocketClient } from '@/utils/websocket'
import { useMetricAnimation } from '@/hooks/useMetricAnimation'
import { useServerHistoryChart } from '@/hooks/useServerHistoryChart'
import MetricCard from '@/components/monitor/metric-card'
import {
  METRIC_OPTIONS,
  RANGE_OPTIONS,
  buildEmptyServerMetrics,
  serverInfoToMetrics,
} from './monitorPresentation'

const ServerPage = () => {
  /** antd 设计 token（明暗模式自适应） */
  const { token } = theme.useToken()
  /** 服务器信息快照（最新一次推送或拉取） */
  const [serverInfo, setServerInfo] = useState<ServerInfoVo | null>(null)
  /** 指标卡数据，无数据时展示占位卡 */
  const [metrics, setMetrics] = useState<ServerMetricValue[]>(() => buildEmptyServerMetrics())
  /** 加载状态 */
  const [loading, setLoading] = useState(false)
  /** 是否正在监控 */
  const [isMonitoring, setIsMonitoring] = useState(false)
  /** 监控订阅的取消函数，与订单通知共用同一条 STOMP 连接 */
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const { getAnimatedMetricNumber, animateMetricValues } = useMetricAnimation()
  const { chartContainerRef, renderChart } = useServerHistoryChart()

  /** 历史趋势当前选中的指标键。 */
  const [selectedMetricKey, setSelectedMetricKey] = useState<ServerMetricKey>('cpu_usage')
  /** 历史趋势当前选中的时间范围（秒），默认 1 小时。 */
  const [selectedRange, setSelectedRange] = useState(3600)
  /** 历史趋势请求进行中标记。 */
  const [loadingHistory, setLoadingHistory] = useState(false)
  /** 当前趋势点序列，用于图表空态判断。 */
  const [historyPoints, setHistoryPoints] = useState<ServerMetricsHistoryPoint[]>([])

  /** 用服务器信息快照刷新系统信息与指标卡，并驱动数字滚动。 */
  const applyServerInfo = useCallback(
    (info: ServerInfoVo) => {
      setServerInfo(info)
      const nextMetrics = serverInfoToMetrics(info)
      setMetrics(nextMetrics)
      animateMetricValues(nextMetrics)
    },
    [animateMetricValues]
  )

  /** 获取服务器信息 */
  const fetchInfo = useCallback(async () => {
    try {
      const res = await getServerInfo()
      applyServerInfo(res)
    } catch (err) {
      console.error('获取服务器信息失败:', err)
    }
  }, [applyServerInfo])

  /** 停止监控：先退订再通知后端停止推送 */
  const stopMonitor = useCallback(async () => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    setIsMonitoring(false)
    try {
      await stopServerMonitor()
      message.success('停止监控')
    } catch {
      message.error('停止监控失败')
    }
  }, [])

  /**
   * 开始监控：订阅 /topic/server-monitor 实时推送（每 3 秒一次）。
   * 进场时由 useEffect 自动触发（silent），不打扰提示；
   * 自动开始失败时页面回到手动「开始监控」按钮态，可点击重试。
   */
  const startMonitor = useCallback(
    async (silent: boolean = false) => {
      setLoading(true)
      try {
        await startServerMonitor()
        unsubscribeRef.current?.()
        unsubscribeRef.current = getSharedWebSocketClient().subscribe<ServerInfoVo>(
          '/topic/server-monitor',
          (data) => {
            applyServerInfo(data)
            setIsMonitoring(true)
          },
          (error) => {
            console.error('WebSocket 错误:', error)
            if (!silent) message.error('连接失败')
            setIsMonitoring(false)
          }
        )
        setIsMonitoring(true)
        if (!silent) message.success('开始监控')
      } catch {
        if (!silent) message.error('开始监控失败')
      } finally {
        setLoading(false)
      }
    },
    [applyServerInfo]
  )

  /** 进入页面自动开始监控（静默），无需手动点击。 */
  useEffect(() => {
    void startMonitor(true)
  }, [startMonitor])

  /** 按当前指标与时间范围拉取历史趋势并渲染图表。 */
  const refreshHistory = useCallback(async () => {
    setLoadingHistory(true)
    const end = Math.floor(Date.now() / 1000)
    const start = end - selectedRange
    try {
      const response = await getServerMetricsHistory(selectedMetricKey, start, end)
      setHistoryPoints(response.points || [])
      renderChart(response)
    } catch (err) {
      console.error('加载历史趋势失败:', err)
      setHistoryPoints([])
      renderChart()
    } finally {
      setLoadingHistory(false)
    }
  }, [selectedMetricKey, selectedRange, renderChart])

  useEffect(() => {
    void refreshHistory()
  }, [refreshHistory])

  useEffect(() => {
    void fetchInfo()
    return () => {
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
    }
  }, [fetchInfo])

  return (
    <div className="monitor-server-page" style={{ padding: 20 }}>
      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>服务器监控</h2>
          <Tag color={isMonitoring ? 'success' : 'default'}>
            {isMonitoring ? '实时监控中' : '未连接'}
          </Tag>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMonitoring ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => startMonitor(false)}
              loading={loading}
            >
              开始监控
            </Button>
          ) : (
            <Button danger icon={<PauseCircleOutlined />} onClick={stopMonitor}>
              停止监控
            </Button>
          )}
        </div>
      </div>

      <Spin spinning={!serverInfo}>
        {serverInfo && (
          <>
            {/* 系统信息 */}
            <Card title="系统信息" style={{ marginBottom: 20 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="操作系统">{serverInfo.sys.os}</Descriptions.Item>
                <Descriptions.Item label="系统架构">{serverInfo.sys.arch}</Descriptions.Item>
                <Descriptions.Item label="主机名">{serverInfo.sys.hostname}</Descriptions.Item>
                <Descriptions.Item label="IP 地址">{serverInfo.sys.ip}</Descriptions.Item>
                <Descriptions.Item label="CPU 型号" span={2}>
                  {serverInfo.cpu.cpuModel}
                </Descriptions.Item>
                <Descriptions.Item label="CPU 核心数">{serverInfo.cpu.cpuNum} 核</Descriptions.Item>
                <Descriptions.Item label="JVM 版本">{serverInfo.jvm.version}</Descriptions.Item>
                <Descriptions.Item label="启动时间">{serverInfo.jvm.startTime}</Descriptions.Item>
                <Descriptions.Item label="运行时长">{serverInfo.jvm.runTime}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 指标卡 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}
            >
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.key}
                  metric={metric}
                  animatedValue={getAnimatedMetricNumber(metric)}
                />
              ))}
            </div>

            {/* 历史趋势 */}
            <Card
              title="历史趋势"
              extra={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Select
                    style={{ width: 220 }}
                    value={selectedMetricKey}
                    onChange={(key) => setSelectedMetricKey(key)}
                    options={METRIC_OPTIONS}
                  />
                  <Segmented
                    value={selectedRange}
                    onChange={(range) => setSelectedRange(range as number)}
                    options={RANGE_OPTIONS}
                  />
                </div>
              }
            >
              <Spin spinning={loadingHistory}>
                <div style={{ position: 'relative', minHeight: 320 }}>
                  <div ref={chartContainerRef} style={{ height: 320 }} />
                  {historyPoints.length === 0 && !loadingHistory && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: token.colorBgContainer,
                          opacity: 0.65,
                        }}
                      />
                      <div style={{ position: 'relative' }}>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无趋势数据" />
                      </div>
                    </div>
                  )}
                </div>
              </Spin>
            </Card>
          </>
        )}
      </Spin>
    </div>
  )
}

export default ServerPage
