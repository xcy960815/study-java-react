import { useCallback, useEffect, useState } from 'react'

/**
 * 浏览器全屏状态 Hook：返回当前是否全屏与切换函数，兼容各浏览器前缀 API。
 * 组件卸载时自动移除监听，避免状态残留。
 */
export const useFullscreen = (): { fullscreen: boolean; toggleFullscreen: () => Promise<void> } => {
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement))

  useEffect(() => {
    const syncFullscreenState = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', syncFullscreenState)
    document.addEventListener('mozfullscreenchange', syncFullscreenState)
    document.addEventListener('webkitfullscreenchange', syncFullscreenState)
    document.addEventListener('MSFullscreenChange', syncFullscreenState)

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      document.removeEventListener('mozfullscreenchange', syncFullscreenState)
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState)
      document.removeEventListener('MSFullscreenChange', syncFullscreenState)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const element: HTMLElement = document.documentElement
    if (document.fullscreenElement) {
      document.exitFullscreen()
      return
    }
    await element.requestFullscreen()
  }, [])

  return { fullscreen, toggleFullscreen }
}
