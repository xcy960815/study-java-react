import MarkdownIt from 'markdown-it'

import markdownItHighlight from 'markdown-it-highlightjs'

import markdownItKatex from '@vscode/markdown-it-katex'

import splitAtDelimiters from 'katex/contrib/auto-render/splitAtDelimiters'

import 'katex/dist/katex.min.css'

import 'katex/contrib/mhchem'

import { sanitizeHtml } from '@/utils/html-sanitizer'

import { preWrapperPlugin } from './pre-wrapper'

const THINK_PLACEHOLDER_PREFIX = '__STUDY_JAVA_REACT_THINK_BLOCK__'

const markdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

markdownIt
  .use(markdownItHighlight)
  .use(preWrapperPlugin, {
    hasSingleTheme: true,
  })
  .use(markdownItKatex)

/**
 * 把 AI 回答里的 \( \) / \[ \] 数学定界符统一转换成 $ / $$，交给 katex 渲染。
 */
const transformMathMarkdown = (markdownText: string) => {
  const data = splitAtDelimiters(markdownText, [
    {
      left: '\\[',
      right: '\\]',
      display: true,
    },
    {
      left: '\\(',
      right: '\\)',
      display: false,
    },
  ])
  return data.reduce((result, segment) => {
    if (segment.type === 'text') {
      return result + segment.data
    }
    const math = segment.display ? `$$${segment.data}$$` : `$${segment.data}$`
    return result + math
  }, '')
}

/**
 * 抽离 <think> 推理块，先占位再整包渲染，避免内部内容被 markdown 语法干扰。
 */
const extractThinkBlocks = (source: string): { content: string; thinkBlocks: string[] } => {
  const thinkBlocks: string[] = []
  const content = source.replace(/<think>([\s\S]*?)<\/think>/gi, (_, block: string) => {
    const placeholder = `${THINK_PLACEHOLDER_PREFIX}${thinkBlocks.length}__`
    thinkBlocks.push(block.trim())
    return placeholder
  })

  return { content, thinkBlocks }
}

const replaceThinkPlaceholders = (html: string, thinkBlocks: string[]): string => {
  return thinkBlocks.reduce((result, block, index) => {
    const placeholder = `${THINK_PLACEHOLDER_PREFIX}${index}__`
    const thinkHtml = `<div class="think-wrapper">${markdownIt.render(block)}</div>`

    return result.split(`<p>${placeholder}</p>`).join(thinkHtml).split(placeholder).join(thinkHtml)
  }, html)
}

/**
 * AI 回答文本 → 安全 HTML（供 dangerouslySetInnerHTML 渲染）。
 */
export const renderMarkdownText = (content: string) => {
  const mathTransformed = transformMathMarkdown(content)
  const { content: transformedContent, thinkBlocks } = extractThinkBlocks(mathTransformed)
  const markdownHtml = markdownIt.render(transformedContent)
  const contentWithThink = replaceThinkPlaceholders(markdownHtml, thinkBlocks)

  return sanitizeHtml(contentWithThink)
}
