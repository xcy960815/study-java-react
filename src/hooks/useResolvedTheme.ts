import { useEffect, useState } from 'react'
import { useThemeStore, type ThemeMode } from '@/store/modules/theme'

/**
 * 解析“实际生效”的暗色状态（参考 guibiao 的 resolvedTheme 语义）：
 * 显式 light/dark 直接判定；system 跟随操作系统深色偏好并监听其变化。
 * 布局的 ConfigProvider、html.dark 类名与设置抽屉共用本 Hook，保证一致。
 */
export const useResolvedIsDark = (): boolean => {
  const mode = useThemeStore((state) => state.mode) as ThemeMode
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    if (mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [mode])

  return mode === 'dark' || (mode === 'system' && systemPrefersDark)
}
