export interface TranscriptMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending: boolean
}

/**
 * 发送时把用户消息和回复占位一起接到列表末尾。
 * 回复还在生成时，后续增量只改这条占位，不新插一条。
 */
export const appendTurn = (
  messages: readonly TranscriptMessage[],
  question: string,
  ids: { userId: string; assistantId: string }
): TranscriptMessage[] => {
  return [
    ...messages,
    { id: ids.userId, role: 'user', content: question, pending: false },
    { id: ids.assistantId, role: 'assistant', content: '', pending: true },
  ]
}

export const writeAssistant = (
  messages: readonly TranscriptMessage[],
  assistantId: string,
  content: string,
  pending: boolean
): TranscriptMessage[] => {
  return messages.map((item) => (item.id === assistantId ? { ...item, content, pending } : item))
}

export const settleAssistant = (
  messages: readonly TranscriptMessage[],
  assistantId: string
): TranscriptMessage[] => {
  return writeAssistant(
    messages,
    assistantId,
    messages.find((item) => item.id === assistantId)?.content ?? '',
    false
  )
}
