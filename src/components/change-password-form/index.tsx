import { useState } from 'react'
import { Button, Form, Input, message } from 'antd'
import { updateUserPassword } from '@/apis/system/user'
import { eventEmitter } from '@/utils/event-emits'
import { clearAuthTokens } from '@/utils/token'

interface ChangePasswordFormValues {
  originalPassword: string
  newPassword: string
  confirmNewPassword: string
}

/**
 * 修改密码表单：个人中心与独立修改密码页共用。
 * 成功后清除本地登录态并广播 logout，由路由桥统一跳回登录页。
 */
export const ChangePasswordForm: React.FC = () => {
  const [form] = Form.useForm<ChangePasswordFormValues>()
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (submitting) return
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const result = await updateUserPassword({
        passwordMd5: values.originalPassword,
        newPasswordMd5: values.newPassword,
        confirmNewPasswordMd5: values.confirmNewPassword,
      })
      if (result) {
        message.success('修改密码成功，请重新登录')
        form.resetFields()
        // 先清 token 再广播，避免 GuestOnlyRoute 把已登录用户弹回首页。
        clearAuthTokens()
        eventEmitter.emit('logout')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
      <Form.Item
        name="originalPassword"
        label="原始密码"
        rules={[{ required: true, message: '请输入原始密码' }]}
      >
        <Input.Password placeholder="请输入原始密码" />
      </Form.Item>
      <Form.Item
        name="newPassword"
        label="新密码"
        rules={[
          { required: true, message: '请输入新密码' },
          ({ getFieldValue }) => ({
            validator(_rule, value: string) {
              const original = getFieldValue('originalPassword')
              const confirm = getFieldValue('confirmNewPassword')
              if (original && value === original) {
                return Promise.reject(new Error('新密码不能与原始密码相同'))
              }
              if (!original && confirm && value !== confirm) {
                return Promise.reject(new Error('新密码与确认密码不相同'))
              }
              return Promise.resolve()
            },
          }),
        ]}
      >
        <Input.Password placeholder="请输入新密码" />
      </Form.Item>
      <Form.Item
        name="confirmNewPassword"
        label="确认新密码"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请再次输入新密码' },
          ({ getFieldValue }) => ({
            validator(_rule, value: string) {
              const newPassword = getFieldValue('newPassword')
              if (newPassword && value !== newPassword) {
                return Promise.reject(new Error('两次输入的新密码不相同'))
              }
              return Promise.resolve()
            },
          }),
        ]}
      >
        <Input.Password placeholder="请确认新密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" loading={submitting} onClick={() => void handleConfirm()}>
          确认修改
        </Button>
      </Form.Item>
    </Form>
  )
}

export default ChangePasswordForm
