/**
 * 复制文本到剪贴板。
 *
 * 优先使用 navigator.clipboard（仅安全上下文可用），失败时降级 document.execCommand，
 * 保证 HTTP 内网环境下复制功能依旧可用。
 *
 * @param text 待复制的文本
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // 安全上下文不可用（如 HTTP 内网）或授权被拒，走降级路径
  }

  const element = document.createElement('textarea')
  const previouslyFocusedElement = document.activeElement

  element.value = text

  // Prevent keyboard from showing on mobile
  element.setAttribute('readonly', '')

  element.style.contain = 'strict'
  element.style.position = 'absolute'
  element.style.left = '-9999px'
  element.style.fontSize = '12pt'

  const selection = document.getSelection()
  const originalRange = selection ? selection.rangeCount > 0 && selection.getRangeAt(0) : null

  document.body.appendChild(element)
  element.select()

  element.selectionStart = 0
  element.selectionEnd = text.length

  try {
    const copied = document.execCommand('copy')
    if (!copied) {
      throw new Error('execCommand 复制失败')
    }
  } finally {
    document.body.removeChild(element)

    if (originalRange) {
      selection?.removeAllRanges()
      selection?.addRange(originalRange)
    }

    if (previouslyFocusedElement) {
      ;(previouslyFocusedElement as HTMLElement).focus()
    }
  }
}
