import { useEffect, useRef, type UIEvent } from 'react'

export interface UseAutoScrollResult {
  /** 滚动容器 ref，渲染时挂到消息列表容器上 */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** 挂到容器 onScroll 的滚动处理 */
  handleScroll: (event: UIEvent<HTMLDivElement>) => void
}

/** 触底判定容忍值（px） */
export const BOTTOM_TOLERANCE_PX = 5

/**
 * 粘底自动滚动（scrollTop 单调性模型）：
 *
 * - 跟随中：内容变化时瞬时滚动到底部；
 *   程序化滚动产生的 scroll 事件始终向下单调（scrollTop 递增），不会打断跟随。
 * - 用户上滚：任何非触底位置的 scrollTop 回退（滚轮 / 滚动条拖拽 / 触屏 / 键盘）
 *   都意味着「用户想留在当前位置」，跟随立即停止。
 * - 恢复：回答未完时用户再滚回（近）底部 → 触底必回粘，随即恢复跟随。
 *
 * @param contentKey 内容签名（消息条数 + 最新内容），变化即触发跟随
 */
export function useAutoScroll(contentKey: string): UseAutoScrollResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stickRef = useRef(true)
  const lastScrollTopRef = useRef(0)

  // 内容变化时跟随到底部（仅在粘附状态下）
  useEffect(() => {
    const element = containerRef.current
    if (!element || !stickRef.current) {
      return
    }
    // 以当前（滚动前）位置作为首个滚动事件的回退判断基准
    lastScrollTopRef.current = element.scrollTop
    element.scrollTo({
      top: element.scrollHeight,
      // 跟随流式输出用瞬时滚动：连续高频内容变化下没有平滑动画的追赶延迟，
      // 必定一步贴到最新内容（instant 语义优于依赖元素 scroll-behavior 的 auto）。
      behavior: 'instant',
    })
  }, [contentKey])

  const handleScroll = () => {
    const element = containerRef.current
    if (!element) {
      return
    }

    const scrollTop = element.scrollTop
    const distanceFromBottom = element.scrollHeight - scrollTop - element.clientHeight
    const scrolledUp = scrollTop < lastScrollTopRef.current

    // 始终以最新位置作为下一次方向判断的基准
    lastScrollTopRef.current = scrollTop

    // 触底必回粘：用户滚到底 ⇢ 恢复跟随
    if (distanceFromBottom < BOTTOM_TOLERANCE_PX) {
      stickRef.current = true
      return
    }

    // 非触底位置的 scrollTop 回退只能是用户在往上滚 → 解除跟随
    if (scrolledUp) {
      stickRef.current = false
    }
  }

  return {
    containerRef,
    handleScroll,
  }
}
