import { useEffect, useRef, type UIEvent } from 'react'

export interface UseAutoScrollResult {
  /** 滚动容器 ref，渲染时挂到消息列表容器上 */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** 挂到容器 onScroll 的滚动处理 */
  handleScroll: (event: UIEvent<HTMLDivElement>) => void
}

const THROTTLE_INTERVAL = 100

const RESET_USER_SCROLLING_DELAY = 500

const BOTTOM_TOLERANCE_PX = 5

/**
 * 粘底自动滚动：内容变化时跟随滚动；用户向上滚动时暂停，
 * 回到（近）底部后自动恢复跟踪（对应 Vue 端 useAutoScroll 行为）。
 *
 * @param contentKey 内容签名（消息条数 + 最新内容），变化即触发跟随
 */
export function useAutoScroll(contentKey: string): UseAutoScrollResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const autoScrollRef = useRef(true)
  const isUserScrollingRef = useRef(false)
  const lastScrollTopRef = useRef(0)
  const lastHandledAtRef = useRef(0)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isScrolledToBottom = () => {
    const container = containerRef.current
    if (!container) {
      return true
    }
    const { scrollTop, scrollHeight, clientHeight } = container
    // 允许 5px 的误差
    return Math.abs(scrollHeight - scrollTop - clientHeight) < BOTTOM_TOLERANCE_PX
  }

  const scheduleResetUserScrolling = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }
    resetTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, RESET_USER_SCROLLING_DELAY)
  }

  const scrollToBottom = () => {
    const container = containerRef.current
    if (!container || !autoScrollRef.current || isUserScrollingRef.current) {
      return
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    if (autoScrollRef.current && !isUserScrollingRef.current) {
      scrollToBottom()
    }
  }, [contentKey])

  useEffect(
    () => () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    },
    []
  )

  const handleScroll = () => {
    const now = Date.now()
    if (now - lastHandledAtRef.current < THROTTLE_INTERVAL) {
      return
    }
    lastHandledAtRef.current = now

    const container = containerRef.current
    if (!container) {
      return
    }

    const currentScrollTop = container.scrollTop
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current

    // 更新滚动状态
    isUserScrollingRef.current = true
    lastScrollTopRef.current = currentScrollTop

    // 如果滚动到底部，恢复自动滚动；向上滚动时禁用自动滚动
    if (isScrolledToBottom()) {
      autoScrollRef.current = true
      scheduleResetUserScrolling()
    } else if (isScrollingUp) {
      autoScrollRef.current = false
      scheduleResetUserScrolling()
    }
  }

  return {
    containerRef,
    handleScroll,
  }
}
