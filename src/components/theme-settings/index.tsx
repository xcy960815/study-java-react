import { Drawer, Segmented, Space, Typography } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import {
  PRIMARY_COLOR_OPTIONS,
  useThemeStore,
  type PrimaryColorOption,
  type ThemeMode,
} from '@/store/modules/theme'

const { Text, Title } = Typography

/** 外观模式选项 */
const MODE_OPTIONS: Array<{ label: string; value: ThemeMode }> = [
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' },
  { label: '跟随系统', value: 'system' },
]

interface ThemeSettingsDrawerProps {
  /** 抽屉是否可见 */
  open: boolean
  /** 关闭抽屉回调 */
  onClose: () => void
}

/**
 * 个性化设置抽屉（参考 guibiao 的 PersonalizationDrawer）：
 * 提供外观模式（亮/暗/跟随系统）与主题色选择，偏好写入本地主题 Store 持久化。
 */
const ThemeSettingsDrawer: React.FC<ThemeSettingsDrawerProps> = ({ open, onClose }) => {
  const mode = useThemeStore((state) => state.mode)
  const primaryColor = useThemeStore((state) => state.primaryColor)
  const setMode = useThemeStore((state) => state.setMode)
  const setPrimaryColor = useThemeStore((state) => state.setPrimaryColor)

  return (
    <Drawer open={open} onClose={onClose} title="个性化设置" width={320} destroyOnHidden>
      <div className="space-y-6">
        <section>
          <Title level={5} className="mb-3">
            外观模式
          </Title>
          <Segmented
            block
            value={mode}
            onChange={(value) => setMode(value as ThemeMode)}
            options={MODE_OPTIONS}
          />
          <Text type="secondary" className="mt-2 block text-xs">
            「跟随系统」会根据操作系统/浏览器的深色模式自动切换。
          </Text>
        </section>

        <section>
          <Title level={5} className="mb-3">
            主题色
          </Title>
          <Space wrap size={12}>
            {PRIMARY_COLOR_OPTIONS.map((option: PrimaryColorOption) => {
              const selected = option.color === primaryColor
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-label={`主题色 ${option.label}`}
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 transition-colors ${
                    selected ? 'border-current' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: option.color, color: '#ffffff' }}
                  onClick={() => setPrimaryColor(option.color)}
                >
                  {selected && <CheckOutlined />}
                </button>
              )
            })}
          </Space>
          <Text type="secondary" className="mt-2 block text-xs">
            主题色会同时应用到按钮、链接、菜单高亮等全部主色场景。
          </Text>
        </section>

        <Text type="secondary" className="text-xs">
          偏好保存在本地浏览器（localStorage：study_java_react_theme），仅对当前设备生效。
        </Text>
      </div>
    </Drawer>
  )
}

export default ThemeSettingsDrawer
