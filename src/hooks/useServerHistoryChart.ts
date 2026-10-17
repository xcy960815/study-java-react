import * as echarts from 'echarts'
import { useCallback, useEffect, useRef } from 'react'
import type {
  ServerMetricsHistoryVo,
  ServerMetricsHistoryPoint,
} from '@/apis/monitor/serverMonitor'
import { useResolvedIsDark } from './useResolvedTheme'
import { useThemeStore } from '@/store/modules/theme'

/**
 * 服务监控历史趋势图表 Hook。
 *
 * 管理 ECharts 实例与容器引用，负责趋势折线图渲染、主色/明暗主题联动重绘、
 * 窗口尺寸变化与销毁；供服务监控页使用。
 */
export const useServerHistoryChart = () => {
  /** 图表容器 DOM 引用，需绑定到模板中的图表节点。 */
  const containerRef = useRef<HTMLDivElement | null>(null)

  /** ECharts 实例。 */
  const chartRef = useRef<echarts.ECharts | null>(null)

  /** 最近一次渲染使用的历史数据，主题切换时用于原样重绘。 */
  const latestHistoryRef = useRef<ServerMetricsHistoryVo | null>(null)

  /** 渲染函数引用：挂载期任务通过它调用最新闭包，避免把渲染函数放进挂载依赖。 */
  const renderChartRef = useRef<(history?: ServerMetricsHistoryVo) => void>(() => {})

  const primaryColors = useThemeStore((state) => state.primaryColors)
  const isDark = useResolvedIsDark()
  const primaryColor = isDark ? primaryColors.dark : primaryColors.light

  /**
   * 渲染历史趋势折线图；容器不存在时不渲染。
   *
   * 首次调用时初始化 ECharts 实例；history 缺省时渲染空图表。
   *
   * @param history - 历史趋势数据，可选
   */
  const renderChart = useCallback(
    (history?: ServerMetricsHistoryVo): void => {
      if (!containerRef.current) {
        return
      }

      latestHistoryRef.current = history || null

      if (!chartRef.current) {
        chartRef.current = echarts.init(containerRef.current)
      }

      const points: ServerMetricsHistoryPoint[] = history?.points || []
      const unit = history?.unit || '%'
      const textColor = isDark ? '#a6adb4' : '#606266'
      const borderColor = isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)'

      chartRef.current.setOption({
        animation: false,
        textStyle: {
          fontFamily: 'sans-serif',
          fontSize: 12,
        },
        tooltip: {
          trigger: 'axis',
          valueFormatter: (value: number) =>
            `${Number(value).toFixed(2)}${unit === '%' ? '%' : ''}`,
        },
        grid: {
          top: 26,
          right: 18,
          bottom: 36,
          left: 54,
        },
        xAxis: {
          type: 'time',
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, fontSize: 12 },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: textColor,
            fontSize: 12,
            formatter: (value: number) => (unit === '%' ? `${value}%` : value),
          },
          splitLine: { lineStyle: { color: borderColor } },
        },
        series: [
          {
            name: history?.label || '',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: primaryColor },
            areaStyle: {
              color: echarts.color.modifyAlpha(primaryColor, 0.14),
            },
            data: points.map((point) => [point.timestamp * 1000, point.value]),
          },
        ],
      })
    },
    [isDark, primaryColor]
  )

  /** 保持渲染函数引用为最新闭包。 */
  useEffect(() => {
    renderChartRef.current = renderChart
  }, [renderChart])

  /** 容器挂载时初始化图表（空图占位），卸载时销毁实例。 */
  useEffect(() => {
    if (!containerRef.current) {
      return
    }
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current)
    }
    renderChartRef.current(latestHistoryRef.current || undefined)
    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  /** 主色或明暗模式变化时按最新样式重绘最近一次数据。 */
  useEffect(() => {
    renderChart(latestHistoryRef.current || undefined)
  }, [renderChart])

  /** 让图表实例自适应容器尺寸，窗口 resize 时由页面调用。 */
  const resizeChart = useCallback((): void => {
    chartRef.current?.resize()
  }, [])

  /** 窗口变化自适应。 */
  useEffect(() => {
    window.addEventListener('resize', resizeChart)
    return () => window.removeEventListener('resize', resizeChart)
  }, [resizeChart])

  return {
    /** 图表容器 DOM 引用 */
    containerRef,
    /** 渲染（或重绘）历史趋势折线图 */
    renderChart,
  }
}
