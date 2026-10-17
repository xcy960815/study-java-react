/**
 * katex 发布包中贡献目录源码的分隔符拆分器类型声明。
 *
 * 该文件是 `.ts` 源码而非带类型的运行时产物，bundler 解析不到类型，
 * 按 Vue 端同样 import 路径补充声明（与 katex/contrib/auto-render/splitAtDelimiters.ts 实际签名一致）。
 */
declare module 'katex/contrib/auto-render/splitAtDelimiters' {
  export interface DelimiterSpec {
    left: string
    right: string
    display: boolean
  }

  export interface SplitAtDelimiterData {
    type: 'text' | 'math'
    data: string
    rawData?: string
    display?: boolean
  }

  const splitAtDelimiters: (text: string, delimiters: DelimiterSpec[]) => SplitAtDelimiterData[]

  export default splitAtDelimiters
}
