import { useState } from 'react'
import { Modal, Tooltip } from 'antd'
import { useAppUpdateCheck } from '@/hooks/useAppUpdateCheck'

/**
 * 新版本提示（参考 guibiao 的 version-update-dot）：
 * 检测到线上已发布新版本时，在右上角显示橙色脉冲圆点，
 * 点击弹出确认框，确认后整页重载以加载最新前端资源。
 */
const UpdateIndicator: React.FC = () => {
  const { hasUpdate } = useAppUpdateCheck()
  const [promptOpen, setPromptOpen] = useState(false)

  if (!hasUpdate) {
    return null
  }

  return (
    <>
      <Tooltip title="发现新版本，点击查看" placement="bottom">
        <button
          type="button"
          className="update-dot-trigger"
          aria-label="发现新版本，点击查看"
          onClick={() => setPromptOpen(true)}
        >
          <span className="update-dot" aria-hidden="true" />
        </button>
      </Tooltip>
      <Modal
        open={promptOpen}
        title="发现新版本"
        okText="刷新并更新"
        cancelText="稍后处理"
        onOk={() => {
          window.location.reload()
        }}
        onCancel={() => setPromptOpen(false)}
      >
        系统已发布新版本，刷新页面后即可使用最新功能。请先保存正在编辑的内容。
      </Modal>
    </>
  )
}

export default UpdateIndicator
