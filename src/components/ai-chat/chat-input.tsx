import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import { Input, message } from 'antd'

import { CloseOne, Code, Info, Keyboard, Send } from '@icon-park/react'

const MIN_QUESTION_LENGTH = 2

const MAX_QUESTION_LENGTH = 2000

const BUTTON_ICON_CONFIG = {
  size: 18,
  sendFill: '#fff',
  cancelFill: '#666',
}

interface ChatInputProps {
  /** 是否正在进行会话（显示取消按钮，隐藏发送按钮） */
  pending: boolean
  placeholder?: string
  onSend: (question: string) => void
  onCancel: () => void
}

/**
 * 问题输入区：2000 字计数、Enter 发送 / Shift+Enter 换行、
 * Cmd/Ctrl + Enter 全局快捷键、进行中会话可一键取消。
 */
const ChatInput = ({
  pending,
  placeholder = '请输入您的问题...',
  onSend,
  onCancel,
}: ChatInputProps) => {
  const [question, setQuestion] = useState('')

  const pendingRef = useRef(pending)
  const submitRef = useRef<() => void>(() => {})

  const isDisabled = (value: string) => {
    const trimmedQuestion = value.trim()
    return !trimmedQuestion || trimmedQuestion.length < MIN_QUESTION_LENGTH
  }

  const submit = () => {
    // 会话进行中不允许再次提交（对应 Vue 端 props.conversation 守卫）
    if (pendingRef.current) {
      return
    }
    const trimmedQuestion = question.trim()
    if (trimmedQuestion.length < MIN_QUESTION_LENGTH) {
      message.warning('问题太短了，请至少输入2个字符')
      return
    }
    onSend(trimmedQuestion)
    setQuestion('')
  }

  // 渲染后同步最新提交逻辑与 pending 状态，供全局快捷键回调读取
  useEffect(() => {
    pendingRef.current = pending
    submitRef.current = submit
  })

  // Cmd/Ctrl + Enter 全局快捷键；焦点落在输入框时由 TextArea 自己的
  // onPressEnter 处理，避免同一按键触发两次发送
  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey) {
        return
      }
      if (!event.metaKey && !event.ctrlKey) {
        return
      }
      const target = event.target
      if (target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        return
      }
      event.preventDefault()
      submitRef.current()
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [])

  const handleEnterKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.shiftKey) {
      // 允许 Shift + Enter 换行
      return
    }
    if (isDisabled(question)) {
      return
    }
    event.preventDefault()
    submit()
  }

  return (
    <div className="chat-input-container flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_16px_0_rgba(30,58,138,0.04)] transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-[0_4px_24px_0_rgba(59,130,246,0.08)] dark:border-slate-700 dark:shadow-none">
      <Input.TextArea
        value={question}
        variant="borderless"
        autoSize={{ minRows: 4, maxRows: 8 }}
        maxLength={MAX_QUESTION_LENGTH}
        showCount
        placeholder={placeholder}
        onChange={(event) => setQuestion(event.target.value)}
        onPressEnter={handleEnterKey}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <Code theme="outline" size={16} fill="#94a3b8" />
            <span>支持代码高亮</span>
          </span>
          <span className="mx-2">|</span>
          <span className="flex items-center gap-1">
            <Info theme="outline" size={16} fill="#94a3b8" />
            <span>支持 Markdown 格式</span>
          </span>
          <span className="mx-2">|</span>
          <span className="flex items-center gap-1">
            <Keyboard theme="outline" size={16} fill="#94a3b8" />
            <span>按 Enter 发送，Shift + Enter 换行</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!pending ? (
            <button
              type="button"
              disabled={isDisabled(question)}
              onClick={submit}
              className="flex items-center justify-center rounded-xl border-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:hover:translate-y-0 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 dark:disabled:from-slate-600 dark:disabled:to-slate-700"
            >
              <Send
                theme="filled"
                size={BUTTON_ICON_CONFIG.size}
                fill={BUTTON_ICON_CONFIG.sendFill}
              />
              <span className="ml-1.5 text-sm font-medium">发送</span>
            </button>
          ) : null}

          {pending ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center rounded-xl border-0 bg-slate-100 px-6 py-2.5 font-medium text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <CloseOne
                theme="filled"
                size={BUTTON_ICON_CONFIG.size}
                fill={BUTTON_ICON_CONFIG.cancelFill}
              />
              <span className="ml-1.5 text-sm font-medium">取消</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ChatInput
