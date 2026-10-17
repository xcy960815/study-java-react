import { useRef, useState } from 'react'

import { message } from 'antd'

import { streamChat } from '@/utils/ai-stream'
import { randomId } from '@/utils/random-id'

import { defaultChatMessageRenderer } from './chat-message-renderer'
import ChatInput from './chat-input'
import ChatMessageList, { type RoleAlias } from './chat-message-list'
import type { TranscriptMessage } from './transcript'
import { appendTurn, settleAssistant, writeAssistant } from './transcript'
import { useAutoScroll } from './use-auto-scroll'
import { useCopyCode } from './use-copy-code'

import 'highlight.js/styles/github-dark.css'
import './markdown.css'

interface AiChatPanelProps {
  /** 当前对话使用的模型名，来自路由或页面输入 */
  model: string
  /** 助手消息展示名 */
  assistantName: string
  /** 后端流式对话路径 */
  endpoint: '/deepseek/completions'
}

/**
 * DeepSeek 流式对话面板：markdown 渲染、代码块复制、粘底自动滚动、
 * 思考动画与一键取消，视觉与交互对齐 Vue 端 ai-chat。
 */
const AiChatPanel = ({ model, assistantName, endpoint }: AiChatPanelProps) => {
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [sending, setSending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const sendingRef = useRef(false)

  const roleAlias: RoleAlias = {
    user: 'ME',
    assistant: assistantName,
    system: 'System',
  }

  const contentKey = `${messages.length}:${messages[messages.length - 1]?.content ?? ''}`
  const { containerRef, handleScroll } = useAutoScroll(contentKey)
  useCopyCode()

  const handleSend = async (question: string) => {
    if (sendingRef.current || !question) {
      return
    }
    if (!model) {
      message.warning('请先从模型列表选择一个模型')
      return
    }

    const userId = randomId()
    const assistantId = randomId()
    const history = messages
      .filter((item) => item.role === 'user' || item.content)
      .map((item) => ({ role: item.role, content: item.content }))
    setMessages((current) => appendTurn(current, question, { userId, assistantId }))
    sendingRef.current = true
    setSending(true)

    const controller = new AbortController()
    abortRef.current = controller
    let assistantText = ''

    try {
      await streamChat({
        endpoint,
        model,
        messages: [
          { role: 'system', content: '你是一个聊天机器人' },
          ...history,
          { role: 'user', content: question },
        ],
        signal: controller.signal,
        onDelta: (text) => {
          assistantText += text
          setMessages((current) => writeAssistant(current, assistantId, assistantText, true))
        },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      message.error(error instanceof Error ? error.message : '对话失败')
    } finally {
      setMessages((current) => settleAssistant(current, assistantId))
      abortRef.current = null
      sendingRef.current = false
      setSending(false)
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="mb-1 px-1 text-xs text-slate-500 dark:text-slate-400">
        当前模型：{model || '未选择'} · 助手：{assistantName}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="conversation-list my-2 flex-1 overflow-y-auto pr-1"
      >
        {messages.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-400 dark:text-slate-500">
            输入内容后开始对话
          </div>
        ) : (
          <ChatMessageList
            messages={messages}
            roleAlias={roleAlias}
            renderContent={defaultChatMessageRenderer}
          />
        )}
      </div>
      <ChatInput
        pending={sending}
        onSend={(question) => void handleSend(question)}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default AiChatPanel
