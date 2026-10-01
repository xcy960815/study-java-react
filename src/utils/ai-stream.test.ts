import { describe, expect, it } from 'vitest'
import { extractStreamText, takeSseEvents } from './ai-stream'

describe('ai stream parser', () => {
  it('reads incremental text and ignores the done marker', () => {
    expect(extractStreamText('{"choices":[{"delta":{"content":"你好"}}]}')).toBe('你好')
    expect(extractStreamText('[DONE]')).toBe('')
    expect(extractStreamText('not-json')).toBe('')
  })

  it('keeps an incomplete line for the next chunk', () => {
    const parsed = takeSseEvents('data: {"choices":[{"delta":{"content":"a"}}]}\n\ndata: {"cho')
    expect(parsed.events).toEqual(['{"choices":[{"delta":{"content":"a"}}]}'])
    expect(parsed.rest).toBe('data: {"cho')
  })

  it('reads the last event when the stream ends without a trailing newline', () => {
    const parsed = takeSseEvents('data: {"choices":[{"delta":{"content":"尾"}}]}', true)
    expect(parsed.events).toEqual(['{"choices":[{"delta":{"content":"尾"}}]}'])
    expect(parsed.rest).toBe('')
    expect(extractStreamText(parsed.events[0] ?? '')).toBe('尾')
  })
})
