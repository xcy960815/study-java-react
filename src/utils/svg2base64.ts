const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
const PREFIX = 'data:image/svg+xml;base64,'

/**
 * UTF-8 编码处理
 * @param {string} input 需要编码的字符串
 * @returns {string} 编码后的字符串
 */
export const utf8Encode = (input: string): string => {
  input = input.replace(/\r\n/g, '\n')

  let output = ''

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)

    if (c < 128) {
      output += String.fromCharCode(c)
    } else if (c > 127 && c < 2048) {
      output += String.fromCharCode((c >> 6) | 192)
      output += String.fromCharCode((c & 63) | 128)
    } else {
      output += String.fromCharCode((c >> 12) | 224)
      output += String.fromCharCode(((c >> 6) & 63) | 128)
      output += String.fromCharCode((c & 63) | 128)
    }
  }

  return output
}

/**
 * Base64 核心编码转换
 * @param {string} input 需要转换的字符串
 * @returns {string} Base64 字符串
 */
export const encode = (input: string): string => {
  let i = 0
  let chr1: number
  let chr2: number
  let chr3: number
  let enc1: number
  let enc2: number
  let enc3: number
  let enc4: number
  let output = ''

  input = utf8Encode(input)

  while (i < input.length) {
    chr1 = input.charCodeAt(i++)
    chr2 = input.charCodeAt(i++)
    chr3 = input.charCodeAt(i++)

    enc1 = chr1 >> 2
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
    enc4 = chr3 & 63

    if (isNaN(chr2)) {
      enc3 = enc4 = 64
    } else if (isNaN(chr3)) {
      enc4 = 64
    }

    output =
      output + CHARS.charAt(enc1) + CHARS.charAt(enc2) + CHARS.charAt(enc3) + CHARS.charAt(enc4)
  }

  return output
}

/**
 * 检测输入的数据类型
 * @param {string | SVGElement} input 输入内容（字符串或 SVG DOM 节点）
 * @returns {'string' | 'element' | void} 检测所得类型 ('string', 'element' 或者是 undefined)
 */
export const detectInputType = (input: string | SVGElement): 'string' | 'element' | void => {
  if (typeof input === 'string') {
    return 'string'
  }

  if (typeof SVGElement !== 'undefined' && input instanceof SVGElement) {
    return 'element'
  }
}

/**
 * 拼接 Base64 头部生成完整的 Data URL
 * @param {string} input 原始字符串
 * @returns {string} 带有 base64 前缀的链接文本
 */
export const getBase64 = (input: string) => PREFIX + encode(input)

/**
 * 将 SVG 元素序列化并转为 Base64 格式
 * @param {SVGElement} input Web SVG 节点
 * @returns {string} 可用的图片格式 Base64 链接
 */
export const convertElement = (input: SVGElement): string =>
  getBase64(new XMLSerializer().serializeToString(input))

/**
 * 通用的 SVG 转 Base64 导出函数
 * @param {string | SVGElement} input 字符串模版或 DOM 元素 (如 React/Vue 通过 render 获取的 svg)
 * @returns {string} 包含前缀的 Base64 格式图像链接，可直接供 href/src 使用
 */
export const svg2base64 = (input: string | SVGElement): string => {
  const type = detectInputType(input)

  switch (type) {
    case 'string':
      return getBase64(input as string)

    case 'element':
      return convertElement(input as SVGElement)

    default:
      return input as string
  }
}
