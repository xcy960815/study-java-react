import type { AxiosProgressEvent } from 'axios'
import { request } from '@/utils/request'

const CHUNK_SIZE = 10 * 1024 * 1024

/** 文件上传结果 */
export interface UploadResult {
  filePath?: string
  status: string
  message?: string
}

/**
 * 把 antd Upload 交给 customRequest 的对象转换为 File。
 *
 * @param file - Upload 回调里的文件对象；字符串不是可上传内容
 * @returns 转换后的 File；无法转换时返回 null
 */
export const toUploadFile = (file: string | Blob): File | null => {
  if (typeof file === 'string') {
    return null
  }
  if (file instanceof File) {
    return file
  }
  return new File([file], 'upload.bin')
}

/**
 * 把上传进度事件换算为百分比并回调。
 *
 * @param event - Axios 上传进度事件
 * @param onProgress - 进度回调（0-100 整数）
 */
const reportProgress = (event: AxiosProgressEvent, onProgress?: (percent: number) => void) => {
  if (!onProgress || !event.total) {
    return
  }
  onProgress(Math.round((event.loaded / event.total) * 100))
}

/**
 * 普通文件上传。
 *
 * @param file - 待上传的文件
 * @param onProgress - 上传进度回调（0-100）
 * @returns 上传结果（文件路径或错误信息）
 */
export const uploadFile = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<UploadResult, UploadResult>('/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => reportProgress(event, onProgress),
  })
}

/**
 * 按 10MB 分片上传大文件。
 * 进度按已完成分片的平均值计算。
 *
 * @param file - 待上传的大文件
 * @param onProgress - 上传进度回调（0-100）
 * @returns 上传全部分片完成
 */
export const uploadLargeFile = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> => {
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
  const chunkPercents = Array.from({ length: totalChunks }, () => 0)

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const chunk = file.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE)
    const formData = new FormData()
    formData.append('file', chunk)
    formData.append('fileName', file.name)
    formData.append('chunkIndex', String(chunkIndex))
    formData.append('totalChunks', String(totalChunks))

    const result = await request.post<UploadResult, UploadResult>('/file/upload/chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!event.total) {
          return
        }
        chunkPercents[chunkIndex] = Math.round((event.loaded / event.total) * 100)
        const average = chunkPercents.reduce((sum, percent) => sum + percent, 0) / totalChunks
        onProgress?.(Math.round(average))
      },
    })

    if (result.status === 'error') {
      throw new Error(result.message || '分片上传失败')
    }
  }
}
