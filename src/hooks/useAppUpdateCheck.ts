import { useEffect, useRef, useState } from 'react'

/** 轮询间隔（毫秒） */
const CHECK_INTERVAL_MS = 60_000
/** 基线捕获失败后的重试间隔（毫秒） */
const BASELINE_RETRY_MS = 30_000
/** index.html 主入口脚本的文件名模式（构建产物唯一 hash 即版本指纹） */
const ENTRY_PATTERN = /index(?:-es)?-[A-Za-z0-9_-]+\.js/
/** 开发环境预览更新提示使用的查询参数 */
const PREVIEW_QUERY = 'versionNoticePreview'
const PREVIEW_VALUE = '1'

interface AppUpdateCheck {
  /** 是否发现新版本（或处于预览模式） */
  hasUpdate: boolean
}

/** 拉取当前 index.html 并提取主入口 hash，网络失败返回 null（不判定为更新） */
const fetchCurrentEntryToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}index.html?h=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!response.ok) return null
    const html = await response.text()
    return html.match(ENTRY_PATTERN)?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * 应用更新检测 Hook（参考 guibiao 的版本更新感知）：
 * 以页面加载时的 index.html 主入口 hash 为基线，周期性轮询比对；
 * 发现差异即认为线上发布了新版本，由右上角脉冲圆点提示用户刷新。
 */
export const useAppUpdateCheck = (): AppUpdateCheck => {
  const [hasUpdate, setHasUpdate] = useState(
    () => new URLSearchParams(window.location.search).get(PREVIEW_QUERY) === PREVIEW_VALUE
  )
  /** 首次采样到的主入口 token，作为版本基线 */
  const baselineRef = useRef<string | null>(null)

  useEffect(() => {
    if (hasUpdate) return
    let disposed = false
    let intervalId = 0
    let retryId = 0

    /** 基线就位后启动周期比对 */
    const startPolling = (baseline: string) => {
      if (disposed) return
      baselineRef.current = baseline
      intervalId = window.setInterval(async () => {
        if (document.hidden || disposed) return
        const latest = await fetchCurrentEntryToken()
        if (latest && !disposed && baselineRef.current && latest !== baselineRef.current) {
          setHasUpdate(true)
        }
      }, CHECK_INTERVAL_MS)
    }

    void (async () => {
      const current = await fetchCurrentEntryToken()
      if (disposed) return
      if (current) {
        startPolling(current)
        return
      }
      // 网络失败时只影响首次基线捕获，延迟重试，不把失败误判为“有更新”
      retryId = window.setTimeout(async () => {
        const retry = await fetchCurrentEntryToken()
        if (!disposed && retry) startPolling(retry)
      }, BASELINE_RETRY_MS)
    })()

    return () => {
      disposed = true
      window.clearInterval(intervalId)
      window.clearTimeout(retryId)
    }
  }, [hasUpdate])

  return { hasUpdate }
}
