import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Descriptions, Tag, Button, Spin, message, Row, Col } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import {
  getServerInfo,
  startServerMonitor,
  stopServerMonitor,
  type ServerInfoVo,
} from '@/apis/monitor/serverMonitor'

/** 仪表盘进度条组件 */
const GaugeCard: React.FC<{ title: string; value: number; unit?: string }> = ({
  title,
  value,
  unit = '%',
}) => {
  const percentage = Math.min(100, Math.max(0, value))
  const getColor = () => {
    if (percentage < 30) return '#52c41a'
    if (percentage < 70) return '#faad14'
    return '#ff4d4f'
  }
  return (
    <Card title={title} size="small">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: `8px solid #f0f0f0`,
            borderTopColor: getColor(),
            borderRightColor: percentage > 25 ? getColor() : '#f0f0f0',
            borderBottomColor: percentage > 50 ? getColor() : '#f0f0f0',
            borderLeftColor: percentage > 75 ? getColor() : '#f0f0f0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 'bold', color: getColor() }}>
            {value}
            {unit}
          </span>
        </div>
      </div>
    </Card>
  )
}

/** 饼状信息卡片 */
const PieInfoCard: React.FC<{
  title: string
  used: number
  free: number
  unit?: string
}> = ({ title, used, free, unit = 'MB' }) => {
  const total = used + free
  const usedPct = total > 0 ? ((used / total) * 100).toFixed(1) : '0'
  return (
    <Card title={title} size="small">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>{usedPct}%</div>
        <div style={{ marginTop: 12, color: '#666' }}>
          已使用:{' '}
          <strong>
            {used} {unit}
          </strong>{' '}
          / 空闲:{' '}
          <strong>
            {free} {unit}
          </strong>
        </div>
      </div>
    </Card>
  )
}

const ServerPage: React.FC = () => {
  /** 服务器信息 */
  const [serverInfo, setServerInfo] = useState<ServerInfoVo | null>(null)
  /** 加载状态 */
  const [loading, setLoading] = useState(false)
  /** 是否正在监控 */
  const [isMonitoring, setIsMonitoring] = useState(false)
  /** 轮询定时器 */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** 获取服务器信息 */
  const fetchInfo = useCallback(async () => {
    try {
      const res = await getServerInfo()
      setServerInfo(res)
    } catch (err) {
      console.error('获取服务器信息失败:', err)
    }
  }, [])

  /** 开始监控（轮询方式） */
  const handleStart = async () => {
    setLoading(true)
    try {
      await startServerMonitor()
      setIsMonitoring(true)
      message.success('开始监控')
      // 每 5 秒刷新一次
      timerRef.current = setInterval(fetchInfo, 5000)
    } catch {
      message.error('开始监控失败')
    } finally {
      setLoading(false)
    }
  }

  /** 停止监控 */
  const handleStop = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      await stopServerMonitor()
      setIsMonitoring(false)
      message.success('停止监控')
    } catch {
      message.error('停止监控失败')
    }
  }

  useEffect(() => {
    fetchInfo()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchInfo])

  return (
    <div style={{ padding: 20 }}>
      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 24 }}>服务器监控</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tag color={isMonitoring ? 'success' : 'default'}>
            {isMonitoring ? '实时监控中' : '未连接'}
          </Tag>
          {!isMonitoring ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              loading={loading}
            >
              开始监控
            </Button>
          ) : (
            <Button danger icon={<PauseCircleOutlined />} onClick={handleStop}>
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

            {/* 监控卡片 */}
            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <GaugeCard title="CPU 使用率" value={serverInfo.cpu.used} />
              </Col>
              <Col xs={24} sm={12}>
                <GaugeCard title="内存使用率" value={serverInfo.memory.usage} />
              </Col>
              <Col xs={24} sm={12} style={{ marginTop: 20 }}>
                <PieInfoCard
                  title="JVM 内存使用"
                  used={serverInfo.jvm.used}
                  free={serverInfo.jvm.free}
                  unit="MB"
                />
              </Col>
              <Col xs={24} sm={12} style={{ marginTop: 20 }}>
                <PieInfoCard
                  title="磁盘使用率"
                  used={serverInfo.disk.used}
                  free={serverInfo.disk.free}
                  unit="GB"
                />
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </div>
  )
}

export default ServerPage
