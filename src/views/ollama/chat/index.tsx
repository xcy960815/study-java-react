import { useSearchParams } from 'react-router-dom'
import AiChatPanel from '@/components/ai-chat'

const OllamaChatPage = () => {
  const [params] = useSearchParams()
  const model = params.get('model') || 'deepseek-r1:14b'

  return <AiChatPanel model={model} assistantName={model} endpoint="/ollama/completions" />
}

export default OllamaChatPage
