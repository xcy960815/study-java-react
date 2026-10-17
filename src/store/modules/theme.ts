import { create } from 'zustand'

/** 外观模式：亮色 / 暗色 / 跟随系统 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 可选的预设主题色 */
export interface PrimaryColorOption {
  key: string
  label: string
  color: string
}

/** 预设主题色板（antd colorPrimary + 页面强调色共用） */
export const PRIMARY_COLOR_OPTIONS: PrimaryColorOption[] = [
  { key: 'blue', label: '知更蓝', color: '#1677ff' },
  { key: 'purple', label: '澎湃紫', color: '#722ED1' },
  { key: 'cyan', label: '明青', color: '#13C2C2' },
  { key: 'green', label: '极光绿', color: '#52C41A' },
  { key: 'orange', label: '日暮', color: '#FA8C16' },
  { key: 'magenta', label: '法式洋红', color: '#EB2F96' },
]

const STORAGE_KEY = 'study_java_react_theme'
const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system']

/** 默认外观：亮色 + 品牌蓝 */
const DEFAULT_MODE: ThemeMode = 'light'
const DEFAULT_PRIMARY_COLOR = PRIMARY_COLOR_OPTIONS[0]?.color ?? '#1677ff'

/** 持久化的主题偏好 */
interface ThemePreferences {
  mode: ThemeMode
  primaryColor: string
}

/** 主题状态形状 */
interface ThemeState extends ThemePreferences {
  setMode: (mode: ThemeMode) => void
  setPrimaryColor: (color: string) => void
  reset: () => void
}

const readStoredPreferences = (): Partial<ThemePreferences> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as Partial<ThemePreferences>
    }
  } catch {
    // 解析失败忽略，走默认值
  }
  return {}
}

/** 收敛非法存储值，保证运行时永远是合法取值 */
const normalizePreferences = (): ThemePreferences => {
  const stored = readStoredPreferences()
  const mode = VALID_MODES.includes(stored.mode as ThemeMode)
    ? (stored.mode as ThemeMode)
    : DEFAULT_MODE
  const primaryColor =
    stored.primaryColor && /^#[0-9a-fA-F]{6}$/.test(stored.primaryColor)
      ? stored.primaryColor
      : DEFAULT_PRIMARY_COLOR
  return { mode, primaryColor }
}

const persist = (preferences: ThemePreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // localStorage 不可用时静默降级，仅内存态生效
  }
}

/** 主题状态仓库：外观模式与主色，持久化到本地 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  ...normalizePreferences(),
  setMode: (mode) => {
    set({ mode })
    persist({ mode, primaryColor: get().primaryColor })
  },
  setPrimaryColor: (primaryColor) => {
    set({ primaryColor })
    persist({ mode: get().mode, primaryColor })
  },
  reset: () => {
    set({ mode: DEFAULT_MODE, primaryColor: DEFAULT_PRIMARY_COLOR })
    persist({ mode: DEFAULT_MODE, primaryColor: DEFAULT_PRIMARY_COLOR })
  },
}))
