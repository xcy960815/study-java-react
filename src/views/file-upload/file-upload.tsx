import { useState } from 'react'
import { Progress, Upload, message } from 'antd'
import { AxiosError } from 'axios'
import { InboxOutlined } from '@ant-design/icons'
import { toUploadFile, uploadFile } from '@/apis/upload'

const { Dragger } = Upload

const FileUploadPage = () => {
  const [percent, setPercent] = useState(0)
  const [uploading, setUploading] = useState(false)

  return (
    <div className="mx-auto max-w-xl py-10">
      <Dragger
        multiple={false}
        showUploadList={false}
        disabled={uploading}
        customRequest={async ({ file, onSuccess, onError }) => {
          const source = toUploadFile(file)
          if (!source) {
            onError?.(new Error('无法读取文件'))
            return
          }
          setUploading(true)
          setPercent(0)
          try {
            const result = await uploadFile(source, setPercent)
            if (result.status === 'error') {
              const uploadError = new Error(result.message || '上传失败')
              message.error(uploadError.message)
              onError?.(uploadError)
              return
            }
            message.success(result.filePath ? `上传成功：${result.filePath}` : '上传成功')
            onSuccess?.(result)
          } catch (error) {
            if (error instanceof Error && !(error instanceof AxiosError)) {
              message.error(error.message)
            }
            onError?.(error instanceof Error ? error : new Error('上传失败'))
          } finally {
            setUploading(false)
          }
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
      </Dragger>
      {percent > 0 ? <Progress className="mt-6" percent={percent} /> : null}
    </div>
  )
}

export default FileUploadPage
