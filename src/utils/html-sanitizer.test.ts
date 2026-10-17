import { describe, expect, it } from 'vitest'

import { sanitizeHtml } from './html-sanitizer'

describe('sanitizeHtml', () => {
  it('剥离 script 标签', () => {
    const cleaned = sanitizeHtml('文案<script>alert(1)</script>结束')
    expect(cleaned).not.toContain('script')
    expect(cleaned).toContain('文案')
  })

  it('剥离 on* 事件属性并保留 class', () => {
    const cleaned = sanitizeHtml('<div class="rich" onclick="alert(1)">内容</div>')
    expect(cleaned).toContain('class="rich"')
    expect(cleaned).not.toContain('onclick')
  })

  it('给 <a href> 补充 rel noopener noreferrer nofollow', () => {
    const cleaned = sanitizeHtml('<a href="https://example.com">文档</a>')
    expect(cleaned).toContain('rel="noopener noreferrer nofollow"')
  })

  it('剥离危险协议链接', () => {
    const cleaned = sanitizeHtml('<a href="javascript:alert(1)">点我</a>')
    expect(cleaned).not.toContain('javascript:')
    expect(cleaned).toContain('<a')
  })

  it('放行安全 data:image 图片', () => {
    const cleaned = sanitizeHtml('<img src="data:image/png;base64,iVBORw0KGgo=">')
    expect(cleaned).toContain('data:image/png')
  })

  it('非法 data url 被剥离', () => {
    const cleaned = sanitizeHtml('<img src="data:text/html;base64,PHNjcmlwdD4=">')
    expect(cleaned).not.toContain('data:text/html')
  })

  it('空串直通', () => {
    expect(sanitizeHtml('')).toBe('')
  })
})
