import hljs from 'highlight.js'
import type { MarkdownIt, RendererRule } from 'markdown-it'

export interface Options {
  hasSingleTheme: boolean
}

// 使用正则表达式匹配字符串的第一个字符，并将其转换为大写
function capitalizeFirstLetter(str: string) {
  return str.replace(/^\w/, (match) => match.toUpperCase())
}

/**
 * 用于优先显示的一些习惯语言名（highlight.js 的 name 对个别语言会合并展示，例如 xml → "HTML, XML"）。
 */
const LANGUAGE_TITLE_OVERRIDES: Record<string, string> = {
  html: 'HTML',
  xml: 'XML',
  plaintext: 'Text',
  text: 'Text',
}

/**
 * 基于 highlight.js 查询语言展示名（替代 Vue 端的 prismjs 语言表，减少一整条依赖）。
 */
const getLanguageTitle = (nameOrAlias: string) => {
  const normalizedAlias = nameOrAlias.toLowerCase()

  const override = LANGUAGE_TITLE_OVERRIDES[normalizedAlias]
  if (override) {
    return override
  }

  const language = normalizedAlias ? hljs.getLanguage(normalizedAlias) : undefined
  if (language?.name) {
    return language.name
  }

  return capitalizeFirstLetter(nameOrAlias || 'markdown')
}

export function preWrapperPlugin(markdownIt: MarkdownIt, pluginOptions: Options) {
  const originalFence: RendererRule = markdownIt.renderer.rules.fence

  markdownIt.renderer.rules.fence = (tokens, idx, options, env, renderer) => {
    const token = tokens[idx]

    // remove title from info
    token.info = token.info.replace(/\[.*\]/, '')

    const active = / active( |$)/.test(token.info) ? ' active' : ''

    token.info = token.info.replace(/ active$/, '').replace(/ active /, ' ')

    const lang = extractLang(token.info)

    const content = originalFence(tokens, idx, options, env, renderer)
    return `
      <div class="markdown-code-wrapper flex flex-col language-${lang}${getAdaptiveThemeMarker(pluginOptions)}${active}">
        <div class="markdown-code-header">
          <span class="markdown-code-lang text-xs">${getLanguageTitle(lang)}</span>
          <button class="markdown-code-copy text-xs">
            <div class="markdown-copy-icon"></div>
            <span class="markdown-copy-text default">复制代码</span>
            <span class="markdown-copy-text done">已复制</span>
          </button>
        </div>
        ${content}
      </div>
      `
  }
}

export function getAdaptiveThemeMarker(options: Options) {
  return options.hasSingleTheme ? '' : ' xx-adaptive-theme'
}

export function extractTitle(info: string, html = false) {
  if (html) {
    return info.replace(/<!--[^]*?-->/g, '').match(/data-title="(.*?)"/)?.[1] || ''
  }
  return info.match(/\[(.*)\]/)?.[1] || extractLang(info) || 'txt'
}

function extractLang(info: string) {
  return info
    .trim()
    .replace(/=(\d*)/, '')
    .replace(/:(no-)?line-numbers({| |$|=\d*).*/, '')
    .replace(/(-vue|{| ).*$/, '')
    .replace(/^vue-html$/, 'template')
    .replace(/^ansi$/, '')
}
