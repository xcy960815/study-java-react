import { useState } from 'react'
import { Progress, Upload, message } from 'antd'
import { AxiosError } from 'axios'
import { InboxOutlined } from '@ant-design/icons'
import { toUploadFile, uploadLargeFile } from '@/apis/upload'

const { Dragger } = Upload

const LargeFileUploadPage = () => {
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
            await uploadLargeFile(source, setPercent)
            setPercent(100)
            message.success('全部分片上传完成')
            onSuccess?.(source.name)
          } catch (error) {
            if (error instanceof Error && !(error instanceof AxiosError)) {
              message.error(error.message)
            }
            onError?.(error instanceof Error ? error : new Error('分片上传失败'))
          } finally {
            setUploading(false)
          }
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p className="ant-upload-hint">大文件会按 10MB 分片上传</p>
      </Dragger>
      {percent > 0 ? <Progress className="mt-6" percent={percent} /> : null}
    </div>
  )
}

export default LargeFileUploadPage
