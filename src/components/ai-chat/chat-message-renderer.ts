import { renderMarkdownText } from '@/utils/markdown'

import type { ChatMessageRenderer } from './chat-message-list'

export const defaultChatMessageRenderer: ChatMessageRenderer = (content: string) => {
  return renderMarkdownText(content)
}
