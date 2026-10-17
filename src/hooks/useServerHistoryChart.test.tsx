import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServerMetricsHistoryVo } from '@/apis/monitor/serverMonitor'
import { useServerHistoryChart } from './useServerHistoryChart'

vi.mock('echarts', () => {
  const instance = { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }
  return {
    init: vi.fn(() => instance),
    color: { modifyAlpha: (color: string) => color },
  }
})

import * as echarts from 'echarts'

vi.mock('@/store/modules/theme', () => ({
  useThemeStore: () => ({ primaryColors: { light: '#1677ff', dark: '#4096ff' } }),
}))

vi.mock('./useResolvedTheme', () => ({
  useResolvedIsDark: () => false,
}))

const history: ServerMetricsHistoryVo = {
  metricKey: 'cpu_usage',
  label: 'CPU 使用率',
  unit: '%',
  points: [
    { timestamp: 1750000000, value: 12.5 },
    { timestamp: 1750000060, value: 30 },
  ],
}

/** 复现服务监控页的真实时序：图表容器随系统信息条件渲染，挂载晚于首次历史数据到达。 */
let captured: ReturnType<typeof useServerHistoryChart> | undefined

type HarnessProps = {
  attach: boolean
  onApi?: (api: ReturnType<typeof useServerHistoryChart>) => void
}

const Harness = ({ attach, onApi }: HarnessProps) => {
  const { chartContainerRef, renderChart } = useServerHistoryChart()
  useEffect(() => {
    onApi?.({ chartContainerRef, renderChart })
  }, [chartContainerRef, renderChart, onApi])
  return attach ? <div ref={chartContainerRef} style={{ width: 100, height: 100 }} /> : null
}

describe('useServerHistoryChart', () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  /** 竞态场景：历史数据先于容器挂载到达时，容器出现后必须自动补渲染已记住的数据。 */
  it('renders remembered history once the container attaches late', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() => {
      root.render(<Harness attach={false} onApi={(api) => (captured = api)} />)
    })
    // 历史先到：数据被记住，但没有容器时不初始化图表
    act(() => {
      captured?.renderChart(history)
    })
    expect(echarts.init).not.toHaveBeenCalled()

    // 系统信息随后到达：容器条件渲染挂载，应补初始化并渲染记住的数据
    act(() => {
      root.render(<Harness attach={true} onApi={(api) => (captured = api)} />)
    })
    expect(echarts.init).toHaveBeenCalledTimes(1)

    const instance = (echarts.init as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(instance.setOption).toHaveBeenCalledTimes(1)
    const option = instance.setOption.mock.calls[0][0]
    expect(option.series[0].data).toEqual([
      [1750000000000, 12.5],
      [1750000060000, 30],
    ])

    act(() => {
      root.unmount()
    })
    expect(instance.dispose).toHaveBeenCalledTimes(1)
  })

  /** 容器已挂载的常规场景：直接渲染。 */
  it('renders immediately when the container is already attached', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() => {
      root.render(<Harness attach={true} onApi={(api) => (captured = api)} />)
    })
    act(() => {
      captured?.renderChart(history)
    })

    const instance = (echarts.init as ReturnType<typeof vi.fn>).mock.results[0].value
    // 挂载空图占位与主题效应会先各画一次空图表，最后一次应是显式传入的数据
    expect(instance.setOption).toHaveBeenCalled()
    const lastOption = instance.setOption.mock.calls.at(-1)[0]
    expect(lastOption.series[0].data).toHaveLength(2)

    act(() => {
      root.unmount()
    })
  })
})
