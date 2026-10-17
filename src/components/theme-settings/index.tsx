import { ColorPicker, Drawer, Typography } from 'antd'
import {
  PRESET_THEME_COLORS,
  useThemeStore,
  type PresetThemeColor,
  type ThemeMode,
} from '@/store/modules/theme'
import { useResolvedIsDark } from '@/hooks/useResolvedTheme'

const { Text } = Typography

/** 外观主题选项：预览卡片的标识与文案 */
const THEME_OPTIONS: Array<{ label: string; description: string; value: ThemeMode }> = [
  { label: '亮色', description: '清爽的日间界面', value: 'light' },
  { label: '暗色', description: '低亮度夜读环境', value: 'dark' },
  { label: '跟随系统', description: '自动匹配系统偏好', value: 'system' },
]

interface ThemeSettingsDrawerProps {
  /** 抽屉是否可见 */
  open: boolean
  /** 关闭抽屉回调 */
  onClose: () => void
}

/**
 * 个性化设置抽屉（迁移自 guibiao 的 PersonalizationDrawer）：
 * - 外观主题：带迷你界面预览的选择卡（亮/暗/跟随系统）
 * - 主题色彩：预设色卡按「上暗下亮」双色渐变展示，激活要求亮暗两档均一致；
 *   底部提供自定义主色取色器（应用为亮暗同值）
 */
const ThemeSettingsDrawer: React.FC<ThemeSettingsDrawerProps> = ({ open, onClose }) => {
  const mode = useThemeStore((state) => state.mode)
  const primaryColors = useThemeStore((state) => state.primaryColors)
  const setMode = useThemeStore((state) => state.setMode)
  const setPrimaryColors = useThemeStore((state) => state.setPrimaryColors)
  const setSinglePrimaryColor = useThemeStore((state) => state.setSinglePrimaryColor)
  const isDark = useResolvedIsDark()
  const resolvedPrimaryColor = isDark ? primaryColors.dark : primaryColors.light

  /** 预设色卡激活：亮/暗两档均与当前主色一致（guibiao 语义） */
  const isPresetColorActive = (color: PresetThemeColor) =>
    primaryColors.light === color.light && primaryColors.dark === color.dark

  /**
   * 自定义主色与某张预设色卡「当前模式侧」同值时提示单色匹配，
   * 告知该卡仅部分档位与设置一致，再次点击即补齐两档。
   */
  const isCustomColorMatching = (color: PresetThemeColor) =>
    resolvedPrimaryColor.toLowerCase() === (isDark ? color.dark : color.light).toLowerCase()

  return (
    <Drawer open={open} onClose={onClose} title="个性化设置" width={360} destroyOnHidden>
      <div className="theme-drawer">
        {/* ---------- 外观主题 ---------- */}
        <section className="theme-drawer__section">
          <div className="theme-drawer__heading">
            <span className="theme-drawer__title">外观主题</span>
            <span className="theme-drawer__description">选择界面的亮色或暗黑外观</span>
          </div>
          <div className="theme-drawer__theme-options" role="radiogroup" aria-label="外观主题">
            {THEME_OPTIONS.map((option) => {
              const active = mode === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`theme-drawer__theme-option ${active ? 'is-active' : ''}`}
                  onClick={() => setMode(option.value)}
                >
                  <span className={`theme-preview theme-preview--${option.value}`}>
                    <span className="theme-preview__sidebar" />
                    <span className="theme-preview__content">
                      <span />
                      <span />
                    </span>
                  </span>
                  <span className="theme-preview__label">{option.label}</span>
                  <span className="theme-preview__description">{option.description}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ---------- 主题色彩 ---------- */}
        <section className="theme-drawer__section">
          <div className="theme-drawer__heading">
            <span className="theme-drawer__title">主题色彩</span>
            <span className="theme-drawer__description">
              自定义系统主色调，Ant Design 与全站界面实时联动
            </span>
          </div>
          <div className="theme-drawer__color-options" role="radiogroup" aria-label="主题色彩">
            {PRESET_THEME_COLORS.map((color) => {
              const active = isPresetColorActive(color)
              const halfMatched = !active && isCustomColorMatching(color)
              return (
                <button
                  key={color.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={color.label}
                  className={`theme-drawer__color-option ${active ? 'is-active' : ''}`}
                  onClick={() => setPrimaryColors({ light: color.light, dark: color.dark })}
                >
                  <span
                    className="theme-drawer__swatch"
                    style={{
                      background: `linear-gradient(180deg, ${color.dark} 50%, ${color.light} 50%)`,
                    }}
                  >
                    {active && <i className="theme-drawer__swatch-check" />}
                  </span>
                  <span className="theme-drawer__label">{color.label}</span>
                  {halfMatched && <span className="theme-drawer__half-match">当前单色匹配</span>}
                </button>
              )
            })}
          </div>
          <div className="theme-drawer__custom-row">
            <span className="theme-drawer__custom-label">自定义主色</span>
            <div className="theme-drawer__custom-picker">
              <ColorPicker
                value={resolvedPrimaryColor}
                onChange={(color) => setSinglePrimaryColor(color.toHexString())}
                showText={false}
              />
              <span className="theme-drawer__custom-value">
                {resolvedPrimaryColor.toUpperCase()}
              </span>
            </div>
          </div>
        </section>

        <div className="theme-drawer__footnote">
          <Text type="secondary" className="text-xs">
            偏好保存在本地浏览器 study_java_react_theme 键，仅对当前设备生效。
          </Text>
        </div>
      </div>
    </Drawer>
  )
}

export default ThemeSettingsDrawer
