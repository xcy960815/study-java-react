import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAutoScroll } from './use-auto-scroll'

/**
 * 钩子的最小挂载壳：渲染一个绑定 containerRef 与 onScroll 的容器 div，
 * 并把 handleScroll 通过 effect 透出给测试用例。
 */
interface AutoScrollHarness {
  el: HTMLDivElement
  scrollTo: ReturnType<typeof vi.fn>
  /** 模拟容器上的滚动（把当前 scrollTop 度量交给 handleScroll 处理） */
  fireScroll: () => void
  /** 触发内容签名变化 */
  rerender: (contentKey: string) => void
  unmount: () => void
}

let latestHandleScroll: ReturnType<typeof useAutoScroll>['handleScroll'] | null = null

const HookHost = ({ contentKey }: { contentKey: string }) => {
  const { containerRef, handleScroll } = useAutoScroll(contentKey)

  useEffect(() => {
    latestHandleScroll = handleScroll
  })

  return <div ref={containerRef} />
}

const patchMetrics = (
  el: HTMLDivElement,
  metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }
) => {
  Object.defineProperty(el, 'scrollTop', { configurable: true, get: () => metrics.scrollTop })
  Object.defineProperty(el, 'scrollHeight', {
    configurable: true,
    get: () => metrics.scrollHeight,
  })
  Object.defineProperty(el, 'clientHeight', {
    configurable: true,
    get: () => metrics.clientHeight,
  })
}

const mountAutoScroll = (initialKey: string): AutoScrollHarness => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root: Root = createRoot(host)

  latestHandleScroll = null
  const scrollTo = vi.fn()
  ;(Element.prototype as unknown as { scrollTo?: unknown }).scrollTo = scrollTo

  act(() => {
    root.render(<HookHost contentKey={initialKey} />)
  })

  const el = host.querySelector('div') as HTMLDivElement

  return {
    el,
    scrollTo,
    fireScroll: () => {
      expect(latestHandleScroll).not.toBeNull()
      latestHandleScroll?.(undefined as never)
    },
    rerender: (contentKey: string) => {
      act(() => {
        root.render(<HookHost contentKey={contentKey} />)
      })
    },
    unmount: () => {
      act(() => {
        root.unmount()
      })
      host.remove()
      delete (Element.prototype as unknown as { scrollTo?: unknown }).scrollTo
    },
  }
}

describe('useAutoScroll', () => {
  const FULL_PAGE = { scrollHeight: 1000, clientHeight: 400 }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('内容变化时跟随滚动到底部', () => {
    const harness = mountAutoScroll('一轮')
    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 600 })
    const initialCalls = harness.scrollTo.mock.calls.length

    harness.rerender('两轮')

    expect(harness.scrollTo.mock.calls.length).toBe(initialCalls + 1)
    const lastCall = harness.scrollTo.mock.calls.at(-1)?.[0] as { top: number; behavior: string }
    expect(lastCall.top).toBe(1000)
    expect(lastCall.behavior).toBe('instant')

    harness.unmount()
  })

  it('用户上滚后停止跟随（不再自动滚到底）', () => {
    const harness = mountAutoScroll('一轮')
    // 跟随中：初始挂在底部附近
    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 950 })
    harness.fireScroll() // 距底 50，方向回退，仍未触底

    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 200 })
    harness.fireScroll() // 非触底且 scrollTop 相对上次回退 → 视为用户上滚

    const callsBefore = harness.scrollTo.mock.calls.length
    harness.rerender('两轮')

    expect(harness.scrollTo.mock.calls.length).toBe(callsBefore) // 不再跟随

    harness.unmount()
  })

  it('脱离跟随后再滚回底部 → 恢复自动跟随', () => {
    const harness = mountAutoScroll('一轮')
    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 950 })
    harness.fireScroll()

    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 200 })
    harness.fireScroll() // 用户上滚脱离

    const callsDetached = harness.scrollTo.mock.calls.length
    harness.rerender('两轮')
    expect(harness.scrollTo.mock.calls.length).toBe(callsDetached) // 脱离中不跟随

    // 用户拉回底部
    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 1000 })
    harness.fireScroll() // 距底 0 → 回粘

    harness.rerender('三轮')
    const lastCall = harness.scrollTo.mock.calls.at(-1)?.[0] as { top: number }
    expect(lastCall.top).toBe(1000) // 已恢复跟随

    harness.unmount()
  })

  it('程序化平滑滚动（scrollTop 单调递增）不会自我打断跟随', () => {
    const harness = mountAutoScroll('一轮')
    // 滑动中：位置单调递增且未触底
    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 300 })
    harness.fireScroll()
    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 500 })
    harness.fireScroll()

    const callsBefore = harness.scrollTo.mock.calls.length
    harness.rerender('两轮')

    expect(harness.scrollTo.mock.calls.length).toBe(callsBefore + 1) // 跟随未被影响

    harness.unmount()
  })

  it('向下的滚动（内容增长方向）不解除跟随', () => {
    const harness = mountAutoScroll('一轮')
    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 200 })
    harness.fireScroll()
    patchMetrics(harness.el, { ...FULL_PAGE, scrollTop: 400 })
    harness.fireScroll()

    const callsBefore = harness.scrollTo.mock.calls.length
    harness.rerender('两轮')
    expect(harness.scrollTo.mock.calls.length).toBe(callsBefore + 1)

    harness.unmount()
  })
})
