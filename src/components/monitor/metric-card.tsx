import NumberFlow from '@number-flow/react'
import type { ServerMetricValue } from '@/apis/monitor/serverMonitor'
import { getStatusText } from '@/views/monitor/server/monitorPresentation'
import { theme } from 'antd'

/** 指标数值的固定 2 位小数格式 */
const METRIC_NUMBER_FORMAT = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

/**
 * 服务监控指标卡：展示单个指标的标签、弹簧滚动数值与状态脚注。
 * 动画值由父级经 useMetricAnimation 计算后传入；无值时展示占位符，
 * 警告/危险态分别以主题色描边与数值色提醒。
 */
const MetricCard = ({
  metric,
  animatedValue,
}: {
  /** 卡片承载的指标对象（标签、数值、单位与状态） */
  metric: ServerMetricValue
  /** 当前应展示的动画数值；无动画值时由父级回退为指标当前值 */
  animatedValue: number
}) => {
  const { token } = theme.useToken()
  const statusColor =
    metric.status === 'warning'
      ? token.colorWarning
      : metric.status === 'danger'
        ? token.colorError
        : metric.status === 'unavailable'
          ? token.colorTextDisabled
          : token.colorText

  return (
    <article
      style={{
        minHeight: 130,
        border: `1px solid ${metric.status === 'ok' || metric.status === 'unavailable' ? token.colorBorder : statusColor}`,
        borderRadius: 8,
        background: token.colorBgContainer,
        padding: '16px 20px',
        transition: 'border-color 0.3s ease',
      }}
    >
      <div style={{ color: token.colorTextSecondary, fontSize: 13 }}>{metric.label}</div>
      <div
        style={{
          marginTop: 14,
          color: statusColor,
          fontSize: 34,
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
        }}
      >
        {metric.value !== null ? (
          <NumberFlow
            value={animatedValue}
            format={METRIC_NUMBER_FORMAT}
            suffix="%"
            locales="zh-CN"
          />
        ) : (
          '--'
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 14,
          color: token.colorTextSecondary,
          fontSize: 12,
        }}
      >
        <span>实时采集</span>
        <span>{getStatusText(metric.status)}</span>
      </div>
    </article>
  )
}

export default MetricCard
