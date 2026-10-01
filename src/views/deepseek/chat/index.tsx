import { useSearchParams } from 'react-router-dom'
import AiChatPanel from '@/components/ai-chat'

const DeepSeekChatPage = () => {
  const [params] = useSearchParams()
  const model = params.get('model') || ''

  return <AiChatPanel model={model} assistantName="DeepSeek" endpoint="/deepseek/completions" />
}

export default DeepSeekChatPage
