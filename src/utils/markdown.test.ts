import { describe, expect, it } from 'vitest'

import { renderMarkdownText } from './markdown'

describe('renderMarkdownText', () => {
  it('渲染基础 markdown（加粗与内联代码）', () => {
    const html = renderMarkdownText('**重点** 与 `code` [文档](https://example.com)')
    expect(html).toContain('<strong>重点</strong>')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('href="https://example.com"')
  })

  it('代码块生成 wrapper / 语言标注 / 复制按钮结构', () => {
    const html = renderMarkdownText('深拷贝示例：\n\n```python\nprint("hi")\n```')
    expect(html).toContain('markdown-code-wrapper')
    expect(html).toContain('language-python')
    expect(html).toContain('<span class="markdown-code-lang text-xs">Python</span>')
    expect(html).toContain('button class="markdown-code-copy')
    expect(html).toContain('复制代码')
  })

  it('未知语言回退为首字母大写', () => {
    const html = renderMarkdownText('```mermaid\ngraph TD\n```')
    expect(html).toContain('<span class="markdown-code-lang text-xs">Mermaid</span>')
  })

  it('think 块抽离渲染并外层保留普通内容', () => {
    const source = ['<think>', '内部推理', '</think>', '最终答案'].join('')
    const html = renderMarkdownText(source)

    expect(html).toContain('think-wrapper')
    expect(html).toContain('内部推理')
    expect(html).toContain('最终答案')
    // 原始标签不应直接出现在输出里
    expect(html).not.toContain('<think>')
  })

  it('\\( \\) 数学定界符交给 katex 渲染', () => {
    const html = renderMarkdownText('质能方程 \\(E=mc^2\\) 检验')
    expect(html).toContain('katex')
  })

  it('markdown-it 原生拦截 javascript: 链接', () => {
    const html = renderMarkdownText('[点我](javascript:alert(1))')
    // markdown-it 自带 validateLink 拒绝危险协议，回落为普通文本（不产出 <a>）
    expect(html).not.toContain('<a ')
    expect(html).toContain('[点我](javascript:alert(1))')
  })

  it('空内容输入返回空串', () => {
    expect(renderMarkdownText('')).toBe('')
  })
})
