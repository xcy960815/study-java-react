import fs from 'fs'
import path from 'path'
import type { ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

/**
 * 扫描指定目录并生成树形结构，供项目文件结构接口和构建产物使用。
 *
 * @param dir 当前扫描目录
 * @param basePath 相对根目录的路径前缀
 */
const scanDirectory = (dir: string, basePath: string = '') => {
  interface FileNode {
    label: string
    value: string
    isDirectory: boolean
    children?: FileNode[]
  }
  const result: Array<FileNode> = []
  const files = fs.readdirSync(dir).filter((file) => file !== '.DS_Store')

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const relativePath = path.join(basePath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      const children = scanDirectory(filePath, relativePath)
      result.push({
        label: file,
        value: relativePath,
        isDirectory: true,
        children,
      })
    } else {
      result.push({
        label: file,
        value: relativePath,
        isDirectory: false,
      })
    }
  })

  return result
}

/**
 * 生成项目文件结构的 Vite 插件。
 * 构建时输出 `public/file-structure.json`，开发时提供本地接口。
 */
export const fileStructurePlugin = () => {
  return {
    name: 'file-structure-plugin',
    buildStart() {
      const srcPath = path.resolve(process.cwd(), 'src')
      const fileStructure = scanDirectory(srcPath)
      const outputPath = path.resolve(process.cwd(), 'public/file-structure.json')
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, JSON.stringify(fileStructure, null, 2))
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        '/api/project/file-structure',
        (_req: IncomingMessage, res: ServerResponse) => {
          const srcPath = path.resolve(process.cwd(), 'src')
          const fileStructure = scanDirectory(srcPath)
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              code: 200,
              data: fileStructure,
            })
          )
        }
      )
    },
  }
}
