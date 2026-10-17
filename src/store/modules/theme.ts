import { create } from 'zustand'

/** 外观模式：亮色 / 暗色 / 跟随系统 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 主题色亮暗值对：亮色模式用 light，暗色模式用 dark */
export interface PrimaryColors {
  light: string
  dark: string
}

/** 预设主题色项：分组展示文案与亮暗两档色值 */
export interface PresetThemeColor {
  /** 展示文案 */
  label: string
  /** 亮色模式的主色 */
  light: string
  /** 暗色模式的主色（与亮色相比更浅，暗底下更醒目） */
  dark: string
}

/** 预设主题色板（迁移自 guibiao：暗色档均比亮色档浅，切换模式自动换色） */
export const PRESET_THEME_COLORS: readonly PresetThemeColor[] = [
  { label: '知更蓝', light: '#1677ff', dark: '#4096ff' },
  { label: '克莱因蓝', light: '#002fa7', dark: '#5e93ff' },
  { label: '焦糖', light: '#9a6438', dark: '#c2895d' },
  { label: '藤紫', light: '#5e3f8c', dark: '#a587da' },
  { label: '石青', light: '#1e6a72', dark: '#5aa1a9' },
  { label: '勃艮第', light: '#7a2840', dark: '#d67a8f' },
  { label: '橄榄', light: '#6a6a32', dark: '#989960' },
  { label: '墨绿', light: '#143c34', dark: '#759e93' },
  { label: '梅紫', light: '#8a3a68', dark: '#d07aa9' },
  { label: '黛蓝', light: '#3a5278', dark: '#7d97c1' },
] as const

const STORAGE_KEY = 'study_java_react_theme'
const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system']
/** 校验 Hex 颜色值（3 位或 6 位） */
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** 默认外观：亮色 + 知更蓝 */
const DEFAULT_MODE: ThemeMode = 'light'
const DEFAULT_PRIMARY_COLORS: PrimaryColors = {
  light: PRESET_THEME_COLORS[0].light,
  dark: PRESET_THEME_COLORS[0].dark,
}

/** 持久化的主题偏好 */
interface ThemePreferences {
  mode: ThemeMode
  primaryColors: PrimaryColors
}

/** 主题状态形状 */
interface ThemeState extends ThemePreferences {
  setMode: (mode: ThemeMode) => void
  /** 整对替换主色（预设色板或自定义取色器都写这里） */
  setPrimaryColors: (colors: PrimaryColors) => void
  /** 同时以一个色值应用到亮暗两档（自定义主色场景） */
  setSinglePrimaryColor: (color: string) => void
  reset: () => void
}

/** 旧版持久化：只有一个 primaryColor 字段（v0.2.0 之前） */
interface LegacyStoredPreferences extends Partial<ThemePreferences> {
  primaryColor?: string
}

const readStoredPreferences = (): LegacyStoredPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as LegacyStoredPreferences
    }
  } catch {
    // 解析失败忽略，走默认值
  }
  return {}
}

const isHexColor = (value: string | undefined): value is string =>
  typeof value === 'string' && HEX_COLOR_PATTERN.test(value)

/** 收敛非法存储值：主色两档独立校验；旧格式单色迁移为亮暗同值 */
const normalizePreferences = (): ThemePreferences => {
  const stored = readStoredPreferences()
  const mode = VALID_MODES.includes(stored.mode as ThemeMode)
    ? (stored.mode as ThemeMode)
    : DEFAULT_MODE

  const legacySingle = isHexColor(stored.primaryColor) ? stored.primaryColor : null
  const storedLight = stored.primaryColors?.light
  const storedDark = stored.primaryColors?.dark
  const light = isHexColor(storedLight)
    ? storedLight
    : (legacySingle ?? DEFAULT_PRIMARY_COLORS.light)
  const dark = isHexColor(storedDark) ? storedDark : (legacySingle ?? DEFAULT_PRIMARY_COLORS.dark)

  return { mode, primaryColors: { light, dark } }
}

const persist = (preferences: ThemePreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // localStorage 不可用时静默降级，仅内存态生效
  }
}

/** 主题状态仓库：外观模式与亮暗双值主色，持久化到本地 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  ...normalizePreferences(),
  setMode: (mode) => {
    set({ mode })
    persist({ mode, primaryColors: get().primaryColors })
  },
  setPrimaryColors: (primaryColors) => {
    set({ primaryColors })
    persist({ mode: get().mode, primaryColors })
  },
  setSinglePrimaryColor: (color) => {
    if (!HEX_COLOR_PATTERN.test(color)) return
    get().setPrimaryColors({ light: color, dark: color })
  },
  reset: () => {
    set({ mode: DEFAULT_MODE, primaryColors: { ...DEFAULT_PRIMARY_COLORS } })
    persist({ mode: DEFAULT_MODE, primaryColors: { ...DEFAULT_PRIMARY_COLORS } })
  },
}))
