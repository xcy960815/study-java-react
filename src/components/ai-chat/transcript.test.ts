import { describe, expect, it } from 'vitest'

import { appendTurn, settleAssistant, writeAssistant } from './transcript'

describe('chat transcript', () => {
  it('把用户消息和回复追加到末尾，流式内容只更新那条回复', () => {
    const first = appendTurn([], 'hello', { userId: 'u1', assistantId: 'a1' })
    const streaming = writeAssistant(first, 'a1', 'Hel', true)

    expect(streaming.map((item) => [item.role, item.content, item.pending])).toEqual([
      ['user', 'hello', false],
      ['assistant', 'Hel', true],
    ])
    expect(streaming[1]?.id).toBe('a1')

    const finished = settleAssistant(writeAssistant(streaming, 'a1', 'Hello', true), 'a1')
    const second = appendTurn(finished, 'hello', { userId: 'u2', assistantId: 'a2' })

    expect(second.map((item) => [item.role, item.content])).toEqual([
      ['user', 'hello'],
      ['assistant', 'Hello'],
      ['user', 'hello'],
      ['assistant', ''],
    ])
    expect(second[3]?.pending).toBe(true)
  })
})
