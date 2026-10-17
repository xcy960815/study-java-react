import ChatCopy from './chat-copy'
import ChatThinking from './chat-thinking'
import type { TranscriptMessage } from './transcript'

export type ChatRole = 'user' | 'assistant' | 'system'

export type RoleAlias = Partial<Record<ChatRole, string>>

/** 消息正文转换器：markdown 文本 → 安全 HTML */
export type ChatMessageRenderer = (content: string) => string

interface ChatMessageListProps {
  messages: ReadonlyArray<TranscriptMessage>
  roleAlias: RoleAlias
  renderContent: ChatMessageRenderer
}

const DEFAULT_ROLE_ALIAS: Record<ChatRole, string> = {
  user: 'ME',
  assistant: 'ChatGPT',
  system: 'System',
}

const getRoleAlias = (role: ChatRole, roleAlias: RoleAlias): string => {
  return roleAlias[role] || DEFAULT_ROLE_ALIAS[role] || role
}

/**
 * 会话消息列表：角色别名标题 + 悬停显示复制全文 + markdown 正文 + 生成中思考动画。
 */
const ChatMessageList = ({ messages, roleAlias, renderContent }: ChatMessageListProps) => {
  return (
    <div>
      {messages.map((item) => (
        <div
          key={item.id}
          className="conversation-item group mb-2 flex flex-col rounded-lg bg-slate-100 px-4 py-3 transition-shadow duration-200 hover:shadow-md dark:bg-slate-800"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="font-bold text-slate-700 dark:text-slate-200">
              {getRoleAlias(item.role, roleAlias)}：
            </div>
            <div className="invisible transition-opacity duration-200 group-hover:visible">
              <ChatCopy content={item.content} />
            </div>
          </div>
          <div className="flex-1">
            {item.role === 'assistant' && item.pending && !item.content ? <ChatThinking /> : null}
            <div
              className="prose-wrapper flex flex-col text-sm leading-relaxed text-slate-600 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: renderContent(item.content || '') }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatMessageList
