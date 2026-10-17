import { useEffect } from 'react'

import { copyToClipboard } from '@/utils/clipboard'

/**
 * markdown 代码块复制按钮的委托监听。
 *
 * 代码块由 markdown-it 在 v-html 里生成，无法直接绑定 React 事件，
 * 在 window 上做 click 委托，匹配 `div[class*="language-"] button.markdown-code-copy`。
 */
export function useCopyCode() {
  useEffect(() => {
    const timeoutIdMap = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

    const handleWindowClick = (event: MouseEvent) => {
      const element = event.target as HTMLElement | null
      if (!element || !element.matches('div[class*="language-"] button.markdown-code-copy')) {
        return
      }

      const parent = element.parentElement
      const sibling = parent?.nextElementSibling
      if (!parent || !sibling) {
        return
      }

      const isShell = /language-(shellscript|shell|bash|sh|zsh)/.test(parent.className)

      const ignoredNodes: string[] = []
      const clone = sibling.cloneNode(true) as HTMLElement
      if (ignoredNodes.length) {
        clone.querySelectorAll(ignoredNodes.join(',')).forEach((node) => node.remove())
      }

      let text = clone.textContent || ''

      if (isShell) {
        text = text.replace(/^ *(\$|>) /gm, '').trim()
      }

      copyToClipboard(text)
        .then(() => {
          element.classList.add('copied')
          const previousTimeout = timeoutIdMap.get(element)
          if (previousTimeout) {
            clearTimeout(previousTimeout)
          }
          const timeoutId = setTimeout(() => {
            element.classList.remove('copied')
            element.blur()
            timeoutIdMap.delete(element)
          }, 2000)
          timeoutIdMap.set(element, timeoutId)
        })
        .catch(() => {
          // 复制失败时保持原按钮文案
        })
    }

    window.addEventListener('click', handleWindowClick)
    return () => {
      window.removeEventListener('click', handleWindowClick)
    }
  }, [])
}
