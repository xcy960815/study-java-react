import { getToken } from '@/utils/token'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface StreamChoice {
  delta?: { content?: string }
  message?: { content?: string }
}

/**
 * 从一条 SSE data 负载里取出本段文本。
 * 后端转发的是 OpenAI 兼容分片，结束标记和无法解析的行不产生文本。
 */
export const extractStreamText = (payload: string): string => {
  const text = payload.trim()
  if (!text || text === '[DONE]') {
    return ''
  }

  try {
    const json = JSON.parse(text) as { choices?: StreamChoice[] }
    return json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? ''
  } catch {
    return ''
  }
}

/**
 * 把已经读到的 SSE 缓冲切成完整事件。
 * 流还没结束时，最后一行可能不完整，通过 rest 留到下次；结束时补一个换行把最后一行也读完。
 */
export const takeSseEvents = (
  buffer: string,
  ended = false
): { events: string[]; rest: string } => {
  const source = ended && buffer.length > 0 && !buffer.endsWith('\n') ? `${buffer}\n` : buffer
  const lines = source.split('\n')
  const rest = ended ? '' : (lines.pop() ?? '')
  const events = lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())

  return { events, rest }
}

interface StreamChatOptions {
  endpoint: string
  model: string
  messages: ChatMessage[]
  signal: AbortSignal
  onDelta: (text: string) => void
}

/**
 * 调用后端的流式对话接口，并把增量文本交给调用方。
 */
export const streamChat = async ({
  endpoint,
  model,
  messages,
  signal,
  onDelta,
}: StreamChatOptions) => {
  const token = getToken()
  const baseUrl = import.meta.env.VITE_API_DOMAIN_PREFIX || ''
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.8,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error(`对话请求失败：${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      buffer += decoder.decode()
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const parsed = takeSseEvents(buffer)
    buffer = parsed.rest
    emitPayloads(parsed.events, onDelta)
  }

  emitPayloads(takeSseEvents(buffer, true).events, onDelta)
}

const emitPayloads = (events: string[], onDelta: (text: string) => void) => {
  events.forEach((event) => {
    const text = extractStreamText(event)
    if (text) {
      onDelta(text)
    }
  })
}
