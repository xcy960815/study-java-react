import { useEffect, useRef, useState } from 'react'

import { CheckOne, CloseOne, Copy, Loading } from '@icon-park/react'

import { copyToClipboard } from '@/utils/clipboard'

type ChatCopyStatus = 'copy' | 'loading' | 'success' | 'error'

const BUTTON_STATUS_TIPS: Record<ChatCopyStatus, string> = {
  copy: '复制全文',
  loading: '',
  success: '已复制到剪贴板！',
  error: '复制失败！',
}

const ICON_FILL = '#999'

/**
 * 消息全文复制按钮：复制 → 加载 → 成功/失败 → 复位 的状态轮换。
 */
const ChatCopy = ({ content }: { content: string }) => {
  const [status, setStatus] = useState<ChatCopyStatus>('copy')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    },
    []
  )

  const scheduleStatus = (nextStatus: ChatCopyStatus, delay: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setStatus(nextStatus)
    }, delay)
  }

  const handleCopy = () => {
    setStatus('loading')

    copyToClipboard(content)
      .then(() => scheduleStatus('success', 150))
      .catch(() => scheduleStatus('error', 0))
      .finally(() => scheduleStatus('copy', 1500))
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center cursor-pointer" onClick={handleCopy}>
        <Loading theme="outline" size={14} fill={ICON_FILL} spin />
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex items-center cursor-pointer" onClick={handleCopy}>
        <CheckOne theme="filled" size={14} fill="#52c41a" />
        <span className="ml-0.5 text-xs leading-none text-gray-500">
          {BUTTON_STATUS_TIPS[status]}
        </span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center cursor-pointer" onClick={handleCopy}>
        <CloseOne theme="filled" size={14} fill="#ef4444" />
        <span className="ml-0.5 text-xs leading-none text-gray-500">
          {BUTTON_STATUS_TIPS[status]}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center cursor-pointer" onClick={handleCopy}>
      <Copy theme="outline" size={14} fill={ICON_FILL} />
      <span className="ml-0.5 text-xs leading-none text-gray-500">
        {BUTTON_STATUS_TIPS[status]}
      </span>
    </div>
  )
}

export default ChatCopy
