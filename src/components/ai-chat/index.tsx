import { useEffect, useRef, useState } from 'react'
import { Button, Input, Space, message } from 'antd'
import { streamChat } from '@/utils/ai-stream'

import { appendTurn, settleAssistant, writeAssistant, type TranscriptMessage } from './transcript'

interface AiChatPanelProps {
  /** 当前对话使用的模型名，来自路由或页面输入 */
  model: string
  /** 助手消息展示名 */
  assistantName: string
  /** 后端流式对话路径 */
  endpoint: '/deepseek/completions' | '/ollama/completions'
}

/**
 * DeepSeek 和 Ollama 共用的流式对话面板。
 */
const AiChatPanel = ({ model, assistantName, endpoint }: AiChatPanelProps) => {
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const sendingRef = useRef(false)
  const transcriptRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const transcript = transcriptRef.current
    if (!transcript) {
      return
    }
    transcript.scrollTop = transcript.scrollHeight
  }, [messages])

  const handleSend = async () => {
    const question = draft.trim()
    if (!question || sendingRef.current) {
      return
    }
    if (!model) {
      message.warning('请先从模型列表选择一个模型')
      return
    }

    const userId = crypto.randomUUID()
    const assistantId = crypto.randomUUID()
    const history = messages
      .filter((item) => item.role === 'user' || item.content)
      .map((item) => ({ role: item.role, content: item.content }))
    setMessages((current) => appendTurn(current, question, { userId, assistantId }))
    setDraft('')
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

  const handleStop = () => {
    abortRef.current?.abort()
  }

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="mb-3 text-sm text-gray-500">
        当前模型：{model || '未选择'} · 助手：{assistantName}
      </div>
      <div
        ref={transcriptRef}
        className="flex-1 space-y-3 overflow-auto rounded border border-gray-100 bg-gray-50 p-4"
      >
        {messages.length === 0 ? (
          <div className="text-gray-400">输入内容后开始对话</div>
        ) : (
          messages.map((item) => (
            <div key={item.id} className={item.role === 'user' ? 'text-right' : 'text-left'}>
              <div className="mb-1 text-xs text-gray-400">
                {item.role === 'user' ? '我' : assistantName}
              </div>
              <div className="inline-block max-w-[80%] whitespace-pre-wrap rounded bg-white px-3 py-2 text-left shadow-sm">
                {item.content || (item.pending ? '思考中…' : '')}
              </div>
            </div>
          ))
        )}
      </div>
      <Space.Compact className="mt-3 w-full">
        <Input.TextArea
          value={draft}
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          onChange={(event) => setDraft(event.target.value)}
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault()
              void handleSend()
            }
          }}
        />
      </Space.Compact>
      <Space className="mt-3">
        <Button type="primary" loading={sending} onClick={() => void handleSend()}>
          发送
        </Button>
        <Button disabled={!sending} onClick={handleStop}>
          停止
        </Button>
      </Space>
    </div>
  )
}

export default AiChatPanel
